import { Download } from "lucide-react";
import ELDLogSheet from "../components/ELDLogSheet";
import Footer from "../components/Footer";
import { useInputQueryStore } from "../zustand/inputQueryStore";
import { useTripQueryStore } from "../zustand/tripQueryStore";

const LogPage = () => {
  const { tripPlan } = useTripQueryStore();
  const { tripInput } = useInputQueryStore();

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
            Generated {tripPlan.logs.length} daily log sheet(s) for your trip.
            Each sheet complies with DOT regulations and includes detailed duty
            status tracking.
          </p>
        </div>

        <div className="print:space-y-0 space-y-6">
          {tripPlan.logs.map((log, index) => (
            <ELDLogSheet
              key={index}
              dailyLog={{
                date: new Date().toISOString().split("T")[0],
                driverName: tripInput.driverName || "John Doe",
                truckNumber: tripInput.truckNumber || "12345",
                trailerNumber: tripInput.trailerNumber || "67890",
                startingLocation:
                  tripPlan.route.stops[0]?.location.join(", ") || "",
                endingLocation:
                  tripPlan.route.stops.at(-1)?.location.join(", ") || "",
                totalMiles: tripPlan.total_distance_miles,
                offDutyHours: 0,
                sleeperHours: 0,
                drivingHours: 0,
                onDutyHours: 0,
                violations: [],
                entries: log.gridData.timeBlocks.map((block) => ({
                  time: block.start,
                  status: block.status.toLowerCase().replace(" ", "_") as any,
                  location: "N/A",
                  odometer: 0,
                  notes: block.status,
                })),
              }}
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
