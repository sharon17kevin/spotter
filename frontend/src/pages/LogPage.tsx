import { Download } from "lucide-react";
import ELDLogSheet from "../components/ELDLogSheet";
import { useState } from "react";
import type { TripPlan } from "../types";
import Footer from "../components/Footer";

const LogPage = () => {
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

  const handlePrintLogs = () => {
    window.print();
  };

  return (
    <>
      <div className="space-y-6 min-h-screen">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              ELD Daily Log Sheets
            </h3>
            <button
              onClick={handlePrintLogs}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Print Logs
            </button>
          </div>
          <p className="text-sm text-gray-600 mb-6">
            Generated {tripPlan.dailyLogs.length} daily log sheet(s) for your
            trip. Each sheet complies with DOT regulations and includes detailed
            duty status tracking.
          </p>
        </div>

        <div className="print:space-y-0 space-y-6">
          {tripPlan.dailyLogs.map((dailyLog, index) => (
            <ELDLogSheet
              key={index}
              dailyLog={dailyLog}
              dayNumber={index + 1}
            />
          ))}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default LogPage;
