import Footer from "../components/Footer";
import RouteMap from "../components/RouteMap";
import { useInputQueryStore } from "../zustand/inputQueryStore";
import { useTripQueryStore } from "../zustand/tripQueryStore";

const MapPage = () => {

  const {tripInput} = useInputQueryStore();
  const {tripPlan} = useTripQueryStore();
  
  return (
    <>
      <div className="space-y-6">
        <RouteMap tripInput={tripInput} tripPlan={tripPlan} />

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Trip Summary
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-blue-600">Total Distance Miles</p>
              <p className="text-2xl font-bold text-blue-700">
                {tripPlan.summary.total_distance_miles.toFixed(0)}
              </p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm font-medium text-green-600">Total Time Hours</p>
              <p className="text-2xl font-bold text-green-700">
                {tripPlan.summary.total_trip_hours.toFixed(1)}
              </p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-blue-600">Total Driving Hours</p>
              <p className="text-2xl font-bold text-blue-700">
                {tripPlan.summary.total_driving_hours.toFixed(0)}
              </p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm font-medium text-green-600">Estimated Arrival</p>
              <p className="text-2xl font-bold text-green-700">
                {tripPlan.summary.estimated_arrival}
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer/>
    </>
  );
};

export default MapPage;
