from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from datetime import datetime, timedelta
from django.utils.timezone import now
import requests
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors
from django.http import HttpResponse

@api_view(['POST'])
def plan_trip(request):
    try:
        data = request.data
        current_loc = data.get('current_location')
        pickup_loc = data.get('pickup_location')
        dropoff_loc = data.get('dropoff_location')
        current_cycle = float(data.get('current_cycle_used', 0))

        # Geocode using Nominatim
        def geocode(address):
            url = f"https://nominatim.openstreetmap.org/search?q={address}&format=json&limit=1"
            headers = {'User-Agent': 'TripPlanner/1.0'}  # Required by Nominatim
            resp = requests.get(url, headers=headers, timeout=5)
            if resp.status_code == 200 and resp.json():
                result = resp.json()[0]
                return [float(result['lat']), float(result['lon'])]
            return None

        current_coords = geocode(current_loc)
        pickup_coords = geocode(pickup_loc)
        dropoff_coords = geocode(dropoff_loc)

        if not all([current_coords, pickup_coords, dropoff_coords]):
            return Response({'error': 'Invalid locations'}, status=status.HTTP_400_BAD_REQUEST)

        # Get route using OSRM
        coords_str = f"{current_coords[1]},{current_coords[0]};{pickup_coords[1]},{pickup_coords[0]};{dropoff_coords[1]},{dropoff_coords[0]}"
        osrm_url = f"http://router.project-osrm.org/route/v1/driving/{coords_str}?overview=full&geometries=geojson"
        osrm_resp = requests.get(osrm_url, timeout=5)
        if osrm_resp.status_code != 200:
            return Response({'error': 'Route calculation failed'}, status=status.HTTP_400_BAD_REQUEST)

        route_data = osrm_resp.json()
        total_distance_miles = route_data['routes'][0]['distance'] / 1609.34  # meters to miles
        total_driving_hours = route_data['routes'][0]['duration'] / 3600  # seconds to hours
        points = [[lat, lon] for lon, lat in route_data['routes'][0]['geometry']['coordinates']]  # [lat, lon] for Leaflet

        # HOS Timeline Calculation
        timeline = []
        stops = []
        current_time = now()
        day = 1
        driving_today = 0
        on_duty_today = 0
        cumulative_driving = 0
        miles_driven = 0
        window_start = current_time
        total_on_duty = current_cycle

        # 1hr pickup (on-duty not driving)
        pickup_start = current_time
        pickup_end = pickup_start + timedelta(hours=1)
        timeline.append({'start': pickup_start.strftime('%H:%M'), 'end': pickup_end.strftime('%H:%M'), 'status': 'On Duty Not Driving', 'day': day})
        current_time = pickup_end
        on_duty_today += 1
        total_on_duty += 1
        stops.append({'type': 'pickup', 'location': pickup_coords})

        # Driving with HOS rules
        remaining_hours = total_driving_hours
        while remaining_hours > 0:
            time_in_window = (current_time - window_start).total_seconds() / 3600
            available_driving = min(11 - driving_today, 14 - time_in_window, remaining_hours)
            if available_driving <= 0:
                # 10hr off-duty reset (per 14hr window rule)
                rest_start = current_time
                rest_end = rest_start + timedelta(hours=10)
                timeline.append({'start': rest_start.strftime('%H:%M'), 'end': rest_end.strftime('%H:%M'), 'status': 'Off Duty', 'day': day})
                stops.append({'type': 'rest', 'location': points[len(points)//2]})
                current_time = rest_end
                window_start = rest_end
                driving_today = 0
                on_duty_today = 0
                day += 1 if rest_end.day > rest_start.day else 0
                continue

            # 30min break after 8 cumulative driving hours
            if cumulative_driving >= 8:
                break_start = current_time
                break_end = break_start + timedelta(minutes=30)
                timeline.append({'start': break_start.strftime('%H:%M'), 'end': break_end.strftime('%H:%M'), 'status': 'Off Duty', 'day': day})
                current_time = break_end
                on_duty_today += 0.5
                total_on_duty += 0.5
                cumulative_driving = 0

            # Fuel stop every 1000 miles
            segment_miles = available_driving * 60  # 60 mph average
            if miles_driven + segment_miles >= 1000:
                fuel_start = current_time
                fuel_end = fuel_start + timedelta(minutes=30)
                timeline.append({'start': fuel_start.strftime('%H:%M'), 'end': fuel_end.strftime('%H:%M'), 'status': 'On Duty Not Driving', 'day': day})
                stops.append({'type': 'fuel', 'location': points[len(points)//3]})
                current_time = fuel_end
                on_duty_today += 0.5
                total_on_duty += 0.5
                miles_driven = 0

            # Add driving segment
            drive_start = current_time
            drive_end = drive_start + timedelta(hours=available_driving)
            timeline.append({'start': drive_start.strftime('%H:%M'), 'end': drive_end.strftime('%H:%M'), 'status': 'Driving', 'day': day})
            current_time = drive_end
            driving_today += available_driving
            cumulative_driving += available_driving
            remaining_hours -= available_driving
            miles_driven += segment_miles

            # 70hr/8-day limit with 34hr restart
            if total_on_duty >= 70:
                restart_start = current_time
                restart_end = restart_start + timedelta(hours=34)
                timeline.append({'start': restart_start.strftime('%H:%M'), 'end': restart_end.strftime('%H:%M'), 'status': 'Off Duty', 'day': day})
                stops.append({'type': 'restart', 'location': points[-1]})
                current_time = restart_end
                total_on_duty = 0
                day += 2 if restart_end.day > restart_start.day + 1 else 1

        # 1hr dropoff (on-duty not driving)
        dropoff_start = current_time
        dropoff_end = dropoff_start + timedelta(hours=1)
        timeline.append({'start': dropoff_start.strftime('%H:%M'), 'end': dropoff_end.strftime('%H:%M'), 'status': 'On Duty Not Driving', 'day': day})
        on_duty_today += 1
        total_on_duty += 1
        stops.append({'type': 'dropoff', 'location': dropoff_coords})

        # Generate logs per day
        logs = []
        for d in range(1, day + 1):
            day_timeline = [seg for seg in timeline if seg['day'] == d]
            logs.append({
                'day': d,
                'gridData': {'timeBlocks': day_timeline},
                'remarks': f'Trip from {current_loc} to {pickup_loc} to {dropoff_loc}, {total_distance_miles:.1f} miles.'
            })

        return Response({
            'route': {'points': points, 'stops': stops},
            'timeline': timeline,
            'logs': logs,
            'total_distance_miles': total_distance_miles,
            'total_time_hours': total_driving_hours + 2  # + pickup/dropoff
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def generate_log_pdf(request, day):
    response = HttpResponse(content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="log_day_{day}.pdf"'
    doc = SimpleDocTemplate(response, pagesize=letter)
    styles = getSampleStyleSheet()
    story = []

    # Header
    story.append(Paragraph(f"Driver's Daily Log - Day {day}", styles['Heading1']))
    story.append(Spacer(1, 12))

    # Table for 24-hour grid (simplified)
    data = [['Time', 'Status']]
    for hour in range(24):
        data.append([f"{hour}:00", "Off Duty"])  # Mock; replace with timeline data
    table = Table(data, colWidths=[100, 400])
    table.setStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 14),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 12),
    ])
    story.append(table)
    story.append(Spacer(1, 12))

    # Remarks
    story.append(Paragraph("Remarks: Sample trip, rest included.", styles['Normal']))

    doc.build(story)
    return response