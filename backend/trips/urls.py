from django.urls import path
from .views import plan_trip, generate_log_pdf

urlpatterns = [
    path('plan-trip/', plan_trip, name='plan-trip'),
    path('log-pdf/<int:day>/', generate_log_pdf, name='generate_log_pdf'),
]
