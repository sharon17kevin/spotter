from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from datetime import datetime, timedelta
from django.utils.timezone import now
import requests
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table
from reportlab.lib import colors
from django.http import HttpResponse
from django.core.exceptions import ObjectDoesNotExist
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

from .models import TripPlan


# ------------------ HELPERS ------------------

def geocode_address(address: str):
    """Geocode an address using Nominatim."""
    url = f"https://nominatim.openstreetmap.org/search?q={address}&format=json&limit=1"
    headers = {"User-Agent": "TripPlanner/1.0"}
    resp = requests.get(url, headers=headers, timeout=5)
    if resp.status_code == 200 and resp.json():
        result = resp.json()[0]
        return [float(result["lat"]), float(result["lon"])]
    return None


def fetch_route(coords: list):
    """Fetch driving route between waypoints using OSRM with intermediate points."""
    coords_str = ";".join([f"{lon},{lat}" for lat, lon in coords])
    url = f"http://router.project-osrm.org/route/v1/driving/{coords_str}?overview=full&geometries=geojson&steps=true"
    resp = requests.get(url, timeout=5)
    if resp.status_code != 200:
        raise Exception("Route calculation failed")
    return resp.json()


def build_timeline(start_time, route_data, current_cycle, pickup_coords, dropoff_coords, current_loc, pickup_loc, dropoff_loc):
    """Simulate HOS-compliant timeline for the route."""
    total_distance_miles = route_data["routes"][0]["distance"] / 1609.34
    total_driving_hours = route_data["routes"][0]["duration"] / 3600
    points = [[lat, lon] for lon, lat in route_data["routes"][0]["geometry"]["coordinates"]]

    timeline = []
    stops = []
    current_time = start_time
    day = 1
    driving_today = 0
    on_duty_today = 0
    cumulative_driving = 0
    miles_driven = 0
    window_start = current_time
    total_on_duty = current_cycle
    segment_index = 0
    remaining_hours = total_driving_hours

    # Pickup
    pickup_end = current_time + timedelta(hours=1)
    timeline.append({"day": day, "start": current_time, "end": pickup_end, "status": "On Duty Not Driving", "reason": f"Loading at {pickup_loc}"})
    stops.append({"type": "pickup", "location": pickup_coords, "duration": 1.0, "reason": f"Loading at {pickup_loc}"})
    current_time = pickup_end
    on_duty_today += 1
    total_on_duty += 1

    while remaining_hours > 0:
        time_in_window = (current_time - window_start).total_seconds() / 3600
        available_driving = min(11 - driving_today, 14 - time_in_window, remaining_hours)

        if available_driving <= 0 or time_in_window >= 14:
            # 10-hour rest reset
            rest_duration = 10
            rest_end = current_time + timedelta(hours=rest_duration)
            timeline.append({"day": day, "start": current_time, "end": rest_end, "status": "Off Duty", "reason": "10-hour reset"})
            rest_index = min(segment_index + len(points) // 4, len(points) - 1)
            stops.append({"type": "rest", "location": points[rest_index], "duration": rest_duration, "reason": "Daily reset"})
            current_time = rest_end
            window_start = rest_end
            driving_today = 0
            on_duty_today = 0
            day += 1
            continue

        if cumulative_driving >= 8 and available_driving > 0:
            break_end = current_time + timedelta(minutes=30)
            timeline.append({"day": day, "start": current_time, "end": break_end, "status": "On Duty Not Driving", "reason": "30-min break"})
            current_time = break_end
            on_duty_today += 0.5
            total_on_duty += 0.5
            cumulative_driving = 0

        # Fuel stop every 1000 miles
        segment_miles = (total_distance_miles / len(points)) * (len(points) // total_driving_hours) * available_driving
        if miles_driven + segment_miles >= 1000:
            fuel_end = current_time + timedelta(minutes=30)
            fuel_index = min(segment_index + len(points) // 3, len(points) - 1)
            timeline.append({"day": day, "start": current_time, "end": fuel_end, "status": "On Duty Not Driving", "reason": "Fuel stop"})
            stops.append({"type": "fuel", "location": points[fuel_index], "duration": 0.5, "reason": "Fuel stop"})
            current_time = fuel_end
            on_duty_today += 0.5
            total_on_duty += 0.5
            miles_driven = miles_driven % 1000

        # Driving
        drive_end = current_time + timedelta(hours=available_driving)
        timeline.append({"day": day, "start": current_time, "end": drive_end, "status": "Driving"})
        current_time = drive_end
        driving_today += available_driving
        cumulative_driving += available_driving
        remaining_hours -= available_driving
        miles_driven += segment_miles
        segment_index = int(min(segment_index + len(points) // max(1, total_driving_hours // available_driving), len(points) - 1))

        if total_on_duty >= 70:
            restart_end = current_time + timedelta(hours=34)
            timeline.append({"day": day, "start": current_time, "end": restart_end, "status": "Off Duty", "reason": "34-hour restart"})
            stops.append({"type": "restart", "location": points[-1], "duration": 34.0, "reason": "70-hour restart"})
            current_time = restart_end
            total_on_duty = 0
            day += 2

    # Dropoff
    dropoff_end = current_time + timedelta(hours=1)
    timeline.append({"day": day, "start": current_time, "end": dropoff_end, "status": "On Duty Not Driving", "reason": f"Unloading at {dropoff_loc}"})
    stops.append({"type": "dropoff", "location": dropoff_coords, "duration": 1.0, "reason": f"Unloading at {dropoff_loc}"})
    current_time = dropoff_end

    return timeline, stops, total_distance_miles, total_driving_hours, current_time, points


def split_into_logs(timeline, current_loc, pickup_loc, dropoff_loc):
    """Split timeline into per-day logs."""
    logs = []
    by_day = {}
    for entry in timeline:
        d = entry["start"].date()
        by_day.setdefault(d, []).append(entry)

    for i, (log_date, entries) in enumerate(sorted(by_day.items()), start=1):
        totals = {"driving": 0, "on_duty": 0, "off_duty": 0, "sleeper": 0}
        blocks = []
        for seg in entries:
            hours = (seg["end"] - seg["start"]).total_seconds() / 3600
            if seg["status"] == "Driving":
                totals["driving"] += hours
            elif seg["status"] == "On Duty Not Driving":
                totals["on_duty"] += hours
            elif seg["status"] == "Off Duty":
                totals["off_duty"] += hours
            elif seg["status"] == "Sleeper":
                totals["sleeper"] += hours
            blocks.append({
                "start": seg["start"].strftime("%H:%M"),
                "end": seg["end"].strftime("%H:%M"),
                "status": seg["status"],
                "reason": seg.get("reason", "")
            })
        logs.append({
            "day": i,
            "date": str(log_date),
            "timeBlocks": blocks,
            "totals": {k: round(v, 2) for k, v in totals.items()},
            "remarks": f"Trip Day {i}: {current_loc} → {pickup_loc} → {dropoff_loc}"
        })
    return logs


def build_summary(total_distance_miles, total_driving_hours, current_time):
    """Build overall trip summary."""
    return {
        "total_distance_miles": round(total_distance_miles, 1),
        "total_driving_hours": round(total_driving_hours, 1),
        "total_trip_hours": round(total_driving_hours + 2, 1),  # +2 for pickup/dropoff
        "estimated_arrival": current_time.isoformat()
    }

@api_view(["POST"])
def plan_trip(request):
    try:
        data = request.data
        current_loc = data.get("current_location", {}).get("address")
        pickup_loc = data.get("pickup_location", {}).get("address")
        dropoff_loc = data.get("dropoff_location", {}).get("address")
        current_cycle = float(data.get("current_cycle_used", 0))
        start_date = data.get("start_date")
        start_time = datetime.fromisoformat(start_date) if start_date else datetime(2025, 9, 27, 22, 54)  # 10:54 PM WAT

        # Use provided coordinates directly
        current_coords = [data["current_location"]["lat"], data["current_location"]["lng"]]
        pickup_coords = [data["pickup_location"]["lat"], data["pickup_location"]["lng"]]
        dropoff_coords = [data["dropoff_location"]["lat"], data["dropoff_location"]["lng"]]
        if not all([current_coords, pickup_coords, dropoff_coords]):
            return Response({"error": "Invalid locations"}, status=status.HTTP_400_BAD_REQUEST)

        # Route
        route_data = fetch_route([current_coords, pickup_coords, dropoff_coords])

        # Timeline
        timeline, stops, total_distance, total_driving, end_time, points = build_timeline(
            start_time, route_data, current_cycle, pickup_coords, dropoff_coords, current_loc, pickup_loc, dropoff_loc
        )

        # Logs
        logs = split_into_logs(timeline, current_loc, pickup_loc, dropoff_loc)

        # Summary
        summary = build_summary(total_distance, total_driving, end_time)
        
        response_data = {
            "route": {"points": points, "stops": stops},
            "timeline": [
                {
                    "day": seg["day"],
                    "start": seg["start"].strftime("%H:%M"),
                    "end": seg["end"].strftime("%H:%M"),
                    "status": seg["status"],
                    "reason": seg.get("reason", "")
                } for seg in timeline
            ],
            "logs": logs,
            "summary": summary
        }

        TripPlan.objects.create(
            driver_name=data.get("driver_name"),
            co_driver_name=data.get("co_driver_name"),
            truck_number=data.get("truck_number"),
            trailer_number=data.get("trailer_number"),
            start_date=start_time,
            current_cycle_used=current_cycle,
            plan_data=response_data
        )

        return Response(response_data, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

# @api_view(['POST'])
# def plan_trip(request):
#     try:
#         data = request.data
#         current_loc = data.get('current_location')
#         pickup_loc = data.get('pickup_location')
#         dropoff_loc = data.get('dropoff_location')
#         current_cycle = float(data.get('current_cycle_used', 0))

#         # Geocode using Nominatim
#         def geocode(address):
#             url = f"https://nominatim.openstreetmap.org/search?q={address}&format=json&limit=1"
#             headers = {'User-Agent': 'TripPlanner/1.0'}  # Required by Nominatim
#             resp = requests.get(url, headers=headers, timeout=5)
#             if resp.status_code == 200 and resp.json():
#                 result = resp.json()[0]
#                 return [float(result['lat']), float(result['lon'])]
#             return None

#         current_coords = geocode(current_loc)
#         pickup_coords = geocode(pickup_loc)
#         dropoff_coords = geocode(dropoff_loc)

#         if not all([current_coords, pickup_coords, dropoff_coords]):
#             return Response({'error': 'Invalid locations'}, status=status.HTTP_400_BAD_REQUEST)

#         # Get route using OSRM
#         coords_str = f"{current_coords[1]},{current_coords[0]};{pickup_coords[1]},{pickup_coords[0]};{dropoff_coords[1]},{dropoff_coords[0]}"
#         osrm_url = f"http://router.project-osrm.org/route/v1/driving/{coords_str}?overview=full&geometries=geojson"
#         osrm_resp = requests.get(osrm_url, timeout=5)
#         if osrm_resp.status_code != 200:
#             return Response({'error': 'Route calculation failed'}, status=status.HTTP_400_BAD_REQUEST)

#         route_data = osrm_resp.json()
#         total_distance_miles = route_data['routes'][0]['distance'] / 1609.34  # meters to miles
#         total_driving_hours = route_data['routes'][0]['duration'] / 3600  # seconds to hours
#         points = [[lat, lon] for lon, lat in route_data['routes'][0]['geometry']['coordinates']]  # [lat, lon] for Leaflet

#         # HOS Timeline Calculation
#         timeline = []
#         stops = []
#         current_time = now()
#         day = 1
#         driving_today = 0
#         on_duty_today = 0
#         cumulative_driving = 0
#         miles_driven = 0
#         window_start = current_time
#         total_on_duty = current_cycle

#         # 1hr pickup (on-duty not driving)
#         pickup_start = current_time
#         pickup_end = pickup_start + timedelta(hours=1)
#         timeline.append({'start': pickup_start.strftime('%H:%M'), 'end': pickup_end.strftime('%H:%M'), 'status': 'On Duty Not Driving', 'day': day})
#         current_time = pickup_end
#         on_duty_today += 1
#         total_on_duty += 1
#         stops.append({'type': 'pickup', 'location': pickup_coords})

#         # Driving with HOS rules
#         remaining_hours = total_driving_hours
#         while remaining_hours > 0:
#             time_in_window = (current_time - window_start).total_seconds() / 3600
#             available_driving = min(11 - driving_today, 14 - time_in_window, remaining_hours)
#             if available_driving <= 0:
#                 # 10hr off-duty reset (per 14hr window rule)
#                 rest_start = current_time
#                 rest_end = rest_start + timedelta(hours=10)
#                 timeline.append({'start': rest_start.strftime('%H:%M'), 'end': rest_end.strftime('%H:%M'), 'status': 'Off Duty', 'day': day})
#                 stops.append({'type': 'rest', 'location': points[len(points)//2]})
#                 current_time = rest_end
#                 window_start = rest_end
#                 driving_today = 0
#                 on_duty_today = 0
#                 day += 1 if rest_end.day > rest_start.day else 0
#                 continue

#             # 30min break after 8 cumulative driving hours
#             if cumulative_driving >= 8:
#                 break_start = current_time
#                 break_end = break_start + timedelta(minutes=30)
#                 timeline.append({'start': break_start.strftime('%H:%M'), 'end': break_end.strftime('%H:%M'), 'status': 'Off Duty', 'day': day})
#                 current_time = break_end
#                 on_duty_today += 0.5
#                 total_on_duty += 0.5
#                 cumulative_driving = 0

#             # Fuel stop every 1000 miles
#             segment_miles = available_driving * 60  # 60 mph average
#             if miles_driven + segment_miles >= 1000:
#                 fuel_start = current_time
#                 fuel_end = fuel_start + timedelta(minutes=30)
#                 timeline.append({'start': fuel_start.strftime('%H:%M'), 'end': fuel_end.strftime('%H:%M'), 'status': 'On Duty Not Driving', 'day': day})
#                 stops.append({'type': 'fuel', 'location': points[len(points)//3]})
#                 current_time = fuel_end
#                 on_duty_today += 0.5
#                 total_on_duty += 0.5
#                 miles_driven = 0

#             # Add driving segment
#             drive_start = current_time
#             drive_end = drive_start + timedelta(hours=available_driving)
#             timeline.append({'start': drive_start.strftime('%H:%M'), 'end': drive_end.strftime('%H:%M'), 'status': 'Driving', 'day': day})
#             current_time = drive_end
#             driving_today += available_driving
#             cumulative_driving += available_driving
#             remaining_hours -= available_driving
#             miles_driven += segment_miles

#             # 70hr/8-day limit with 34hr restart
#             if total_on_duty >= 70:
#                 restart_start = current_time
#                 restart_end = restart_start + timedelta(hours=34)
#                 timeline.append({'start': restart_start.strftime('%H:%M'), 'end': restart_end.strftime('%H:%M'), 'status': 'Off Duty', 'day': day})
#                 stops.append({'type': 'restart', 'location': points[-1]})
#                 current_time = restart_end
#                 total_on_duty = 0
#                 day += 2 if restart_end.day > restart_start.day + 1 else 1

#         # 1hr dropoff (on-duty not driving)
#         dropoff_start = current_time
#         dropoff_end = dropoff_start + timedelta(hours=1)
#         timeline.append({'start': dropoff_start.strftime('%H:%M'), 'end': dropoff_end.strftime('%H:%M'), 'status': 'On Duty Not Driving', 'day': day})
#         on_duty_today += 1
#         total_on_duty += 1
#         stops.append({'type': 'dropoff', 'location': dropoff_coords})

#         # Generate logs per day
#         logs = []
#         for d in range(1, day + 1):
#             day_timeline = [seg for seg in timeline if seg['day'] == d]
#             logs.append({
#                 'day': d,
#                 'gridData': {'timeBlocks': day_timeline},
#                 'remarks': f'Trip from {current_loc} to {pickup_loc} to {dropoff_loc}, {total_distance_miles:.1f} miles.'
#             })
        
#         response_data = {
#             'route': {'points': points, 'stops': stops},
#             'timeline': timeline,
#             'logs': logs,
#             'total_distance_miles': total_distance_miles,
#             'total_time_hours': total_driving_hours + 2
#         }
          
#         TripPlan.objects.create(
#             driver_name=data.get("driver_name"),
#             co_driver_name=data.get("co_driver_name"),
#             truck_number=data.get("truck_number"),
#             trailer_number=data.get("trailer_number"),
#             start_date=data.get("start_date"),
#             current_cycle_used=current_cycle,
#             plan_data=response_data
#         )

#         return Response(response_data, status=status.HTTP_200_OK)
#     except Exception as e:
#         return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def generate_log_pdf(request, trip_id, day):
    try:
        # Fetch TripPlan and validate
        trip = TripPlan.objects.get(id=trip_id)
        plan_data = trip.plan_data
        logs = plan_data.get("logs", [])
        day_log = next((log for log in logs if log.get("day") == day), None)
        if not day_log:
            return Response({"error": "Day log not found"}, status=404)

        # Prepare response
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="eld_log_day_{day}.pdf"'
        doc = SimpleDocTemplate(response, pagesize=letter, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=72)
        styles = getSampleStyleSheet()
        story = []

        # Custom styles
        title_style = ParagraphStyle(
            name='TitleStyle',
            parent=styles['Heading1'],
            fontSize=18,
            spaceAfter=12
        )
        normal_style = ParagraphStyle(
            name='NormalStyle',
            parent=styles['Normal'],
            fontSize=10
        )

        # Header
        story.append(Paragraph(f"DRIVER'S DAILY LOG - DAY {day}", title_style))
        story.append(Paragraph(f"Date: {day_log.get('date', 'N/A')}", normal_style))
        story.append(Spacer(1, 12))
        story.append(Paragraph(f"Driver: {trip.driver_name or 'N/A'}", normal_style))
        story.append(Paragraph(f"Co-Driver: {trip.co_driver_name or 'N/A'}", normal_style))
        story.append(Paragraph(f"Truck #: {trip.truck_number or 'N/A'}", normal_style))
        story.append(Paragraph(f"Trailer #: {trip.trailer_number or 'N/A'}", normal_style))
        story.append(Spacer(1, 12))

        # Status Legend
        story.append(Paragraph("DUTY STATUS LEGEND", styles['Heading2']))
        legend_data = [
            ['Color', 'Status'],
            ['#10b981', 'Off Duty'],
            ['#8b5cf6', 'Sleeper Berth'],
            ['#dc2626', 'Driving'],
            ['#f59e0b', 'On Duty (Not Driving)']
        ]
        legend_table = Table(legend_data, colWidths=[0.5*inch, 2*inch], style=[
            ('BACKGROUND', (0, 0), (0, -1), colors.grey),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.black),
            ('ALIGN', (0, 0), (0, -1), 'CENTER'),
            ('BACKGROUND', (1, 1), (1, -1), colors.white),
            ('TEXTCOLOR', (1, 1), (1, -1), colors.black),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ])
        story.append(legend_table)
        story.append(Spacer(1, 12))

        # 24-Hour Grid
        hours = list(range(24))
        grid_data = [['Time'] + [f"{h:02d}" for h in hours]]
        statuses = ['Off Duty', 'Sleeper Berth', 'Driving', 'On Duty (Not Driving)']
        for status in statuses:
            row = [status]
            hourly_grid = [status] * 24  # Default to the status
            time_blocks = day_log.get("gridData", {}).get("timeBlocks", [])
            for block in time_blocks:
                start_parts = block.get("start", "00:00").split(':')
                end_parts = block.get("end", "00:00").split(':')
                start_hour = int(start_parts[0]) + (int(start_parts[1]) / 60 if len(start_parts) > 1 else 0)
                end_hour = int(end_parts[0]) + (int(end_parts[1]) / 60 if len(end_parts) > 1 else 0)
                for h in range(int(start_hour), min(int(end_hour) + 1, 24)):
                    if 0 <= h < 24:
                        hourly_grid[h] = block.get("status", "Off Duty")
            row.extend(hourly_grid)
            grid_data.append(row)

        grid_table = Table(grid_data, colWidths=[0.5*inch] + [0.25*inch] * 24, style=[
            ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
            ('BACKGROUND', (1, 1), (-1, -1), colors.white),
        ])
        for i, status in enumerate(statuses, 1):
            for j in range(1, 25):
                if grid_data[i][j] == status:
                    grid_table.setStyle([
                        ('BACKGROUND', (j, i), (j, i), status_colors.get(status, colors.white))
                    ])
        story.append(grid_table)
        story.append(Spacer(1, 12))

        # Summary
        totals = day_log.get("totals", {"driving": 0, "on_duty": 0, "off_duty": 0, "sleeper": 0})
        summary_data = [
            ['Category', 'Hours'],
            ['Off Duty', f"{totals.get('off_duty', 0):.2f}"],
            ['Sleeper Berth', f"{totals.get('sleeper', 0):.2f}"],
            ['Driving', f"{totals.get('driving', 0):.2f}"],
            ['On Duty (Not Driving)', f"{totals.get('on_duty', 0):.2f}"]
        ]
        summary_table = Table(summary_data, colWidths=[1.5*inch, 1*inch], style=[
            ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ])
        story.append(summary_table)
        story.append(Spacer(1, 12))

        # Locations
        story.append(Paragraph("Locations", styles['Heading2']))
        story.append(Paragraph(f"Starting: {trip.plan_data.get('current_location', {}).get('address', 'N/A')}", normal_style))
        story.append(Paragraph(f"Ending: {trip.plan_data.get('dropoff_location', {}).get('address', 'N/A')}", normal_style))
        story.append(Spacer(1, 12))

        # Total Miles
        total_miles = trip.plan_data.get("summary", {}).get("total_distance_miles", 0) / len(logs or [1])  # Approx per day
        story.append(Paragraph(f"Total Miles: {total_miles:.0f} miles", normal_style))
        story.append(Spacer(1, 12))

        # Remarks
        story.append(Paragraph("Remarks", styles['Heading2']))
        story.append(Paragraph(day_log.get("remarks", "No remarks"), normal_style))

        # Build the PDF
        doc.build(story)
        return response

    except ObjectDoesNotExist:
        return Response({"error": "Trip not found"}, status=404)
    except Exception as e:
        return Response({"error": f"Error generating PDF: {str(e)}"}, status=500)

# Define status_colors globally or within the function
status_colors = {
    'Off Duty': colors.green,
    'Sleeper Berth': colors.purple,
    'Driving': colors.red,
    'On Duty (Not Driving)': colors.yellow
}