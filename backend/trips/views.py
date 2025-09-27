from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
import requests
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
import datetime
from django.http import HttpResponse

@api_view(['POST'])
def plan_trip(request):
    try:
        data = request.data
        current_loc = data.get('current_location')
        pickup_loc = data.get('pickup_location')
        dropoff_loc = data.get('dropoff_location')
        current_cycle = float(data.get('current_cycle_used', 0))

        # Mock routing API (replace with real API like OSRM)
        def get_route_distance(start, end):
            # Placeholder: Assume 100 miles/hour for simplicity
            return {'distance': 300, 'duration': 5}  # miles, hours

        # HOS Logic (simplified)
        def calculate_timeline():
            total_distance = (get_route_distance(current_loc, pickup_loc)['distance'] +
                            get_route_distance(pickup_loc, dropoff_loc)['distance'])
            total_time = total_distance / 60  # Assume 60 mph average
            timeline = []
            hours_used = current_cycle
            start_time = datetime.datetime.now().replace(hour=9, minute=14, second=0, microsecond=0)  # 09:14 PM CEST
            day = 1

            while total_time > 0:
                driving_time = min(11 - (hours_used % 11), total_time)  # 11-hour limit
                if driving_time <= 0:
                    break
                start = start_time + datetime.timedelta(hours=hours_used)
                end = start + datetime.timedelta(hours=driving_time)
                timeline.append({'start': start.strftime('%H:%M'), 'end': end.strftime('%H:%M'),
                               'status': 'Driving', 'day': day})
                hours_used += driving_time
                total_time -= driving_time
                start_time = end

                # 30-min break after 8 hours
                if hours_used % 8 == 0 and total_time > 0:
                    break_start = start_time
                    break_end = break_start + datetime.timedelta(minutes=30)
                    timeline.append({'start': break_start.strftime('%H:%M'), 'end': break_end.strftime('%H:%M'),
                                   'status': 'Off Duty', 'day': day})
                    start_time = break_end
                    hours_used += 0.5

                # 10-hour rest after 14-hour window
                if hours_used % 14 == 0 and total_time > 0:
                    rest_start = start_time
                    rest_end = rest_start + datetime.timedelta(hours=10)
                    timeline.append({'start': rest_start.strftime('%H:%M'), 'end': rest_end.strftime('%H:%M'),
                                   'status': 'Off Duty', 'day': day})
                    start_time = rest_end
                    hours_used += 10
                    day += 1

            return timeline

        timeline = calculate_timeline()
        route = {
            'points': [[48.8566, 2.3522], [48.8584, 2.2945], [48.8534, 2.3488]],  # Mock Paris coords
            'stops': [{'type': 'rest', 'location': [48.8584, 2.2945]}]
        }
        logs = [{'day': i + 1, 'grid_data': {'time_blocks': timeline}} for i in range(len(set(t['day'] for t in timeline)))]

        return Response({'route': route, 'timeline': timeline, 'logs': logs}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def generate_log_pdf(request, day):
    response = HttpResponse(content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="log_day_{day}.pdf"'
    doc = SimpleDocTemplate(response, pagesize=letter)
    styles = getSampleStyleSheet()
    story = []

    story.append(Paragraph(f"Driver's Daily Log - Day {day}", styles['Heading1']))
    story.append(Spacer(1, 12))
    story.append(Paragraph("Remarks: Trip from Paris to Lyon, rest at 02:00", styles['Normal']))
    story.append(Spacer(1, 12))

    doc.build(story)
    return response