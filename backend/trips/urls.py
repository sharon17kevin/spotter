from django.urls import path
from .views import plan_trip

urlpatterns = [
    path('plan-trip/', plan_trip, name='plan-trip'),
    # path('trip/<int:trip_id>/pdf/<int:day>/', generate_log_pdf, name='generate_log_pdf'),
]
