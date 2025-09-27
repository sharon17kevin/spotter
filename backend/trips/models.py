from django.db import models

class TripPlan(models.Model):
    driver_name = models.CharField(max_length=100, default="Unknown Driver")
    co_driver_name = models.CharField(max_length=100, blank=True, null=True)
    truck_number = models.CharField(max_length=50, blank=True, null=True)
    trailer_number = models.CharField(max_length=50, blank=True, null=True)
    start_date = models.DateField(default="2025-01-01")
    current_cycle_used = models.FloatField(default=0)

    # Store the generated plan
    plan_data = models.JSONField(null=True)  # requires Postgres, Django 3.1+
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Trip from {self.pickup_location} to {self.dropoff_location}"
