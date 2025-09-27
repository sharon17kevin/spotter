from rest_framework import serializers
from .models import TripPlan

class TripPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = TripPlan
        fields = "__all__"