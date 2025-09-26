import { useState } from "react";
import RouteMap from "../components/RouteMap";
import type { RouteResult, TripPlan } from "../types";

const MapPage = () => {
  const [tripPlan, _] = useState<TripPlan>({
    tripInput: {
      currentLocation: { lat: 0, lng: 0, address: "" },
      pickupLocation: { lat: 0, lng: 0, address: "" },
      dropoffLocation: { lat: 0, lng: 0, address: "" },
      currentCycleUsed: 0,
      driverName: "",
      coDriverName: "",
      truckNumber: "",
      trailerNumber: "",
      startDate: "",
    },
    dailyLogs: [],
    summary: {
      totalDays: 0,
      totalMiles: 0,
      totalDrivingHours: 0,
      estimatedFuelCost: 0,
    },
  });
  const defaultRouteResult: RouteResult = {
    segments: [],
    restStops: [],
    totalDistance: 0,
    totalDrivingTime: 0,
    totalTripTime: 0,
    estimatedArrival: "",
  };
  return (
    <div className="space-y-6">
      <RouteMap tripInput={tripPlan.tripInput} route={defaultRouteResult} />

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Trip Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium text-blue-600">Total Days</p>
            <p className="text-2xl font-bold text-blue-700">
              {tripPlan.summary.totalDays}
            </p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-sm font-medium text-green-600">Total Miles</p>
            <p className="text-2xl font-bold text-green-700">
              {tripPlan.summary.totalMiles.toFixed(0)}
            </p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <p className="text-sm font-medium text-orange-600">Driving Hours</p>
            <p className="text-2xl font-bold text-orange-700">
              {tripPlan.summary.totalDrivingHours.toFixed(1)}
            </p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-sm font-medium text-purple-600">
              Est. Fuel Cost
            </p>
            <p className="text-2xl font-bold text-purple-700">
              ${tripPlan.summary.estimatedFuelCost.toFixed(0)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapPage;
