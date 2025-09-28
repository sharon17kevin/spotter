import { Download } from "lucide-react";
import ELDLogSheet from "../components/ELDLogSheet";
import Footer from "../components/Footer";
import { useTripQueryStore } from "../zustand/tripQueryStore";

const LogPage = () => {
  const { tripPlan } = useTripQueryStore();

  const handlePrintLogs = () => {
    window.print();
  };
  console.log("tripPlan logs:", tripPlan.logs);

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
              dailyLog={log}
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
