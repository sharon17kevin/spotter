import { useRef } from "react";
import ELDLogSheet from "../components/ELDLogSheet";
import Footer from "../components/Footer";
import { useTripQueryStore } from "../zustand/tripQueryStore";

const LogPage = () => {
  const { tripPlan } = useTripQueryStore();

  const logSheetRef = useRef<HTMLDivElement>(null);

  // const handleGeneratePDF = async () => {
  //   if (!logSheetRef.current) return;

  //   try {
  //     const canvas = await html2canvas(logSheetRef.current, {
  //       scale: 2, // Higher scale for better quality
  //       useCORS: true, // If images are from external sources
  //     });

  //     const imgData = canvas.toDataURL('image/png');
  //     const pdf = new jsPDF({
  //       orientation: 'portrait',
  //       unit: 'mm',
  //       format: 'a4',
  //     });

  //     // Calculate dimensions (A4 is 210mm x 297mm)
  //     const imgWidth = 210;
  //     const pageHeight = 297;
  //     const imgHeight = (canvas.height * imgWidth) / canvas.width;
  //     let heightLeft = imgHeight;
  //     let position = 0;

  //     pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
  //     heightLeft -= pageHeight;

  //     while (heightLeft > 0) {
  //       position = heightLeft - imgHeight;
  //       pdf.addPage();
  //       pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
  //       heightLeft -= pageHeight;
  //     }

  //     pdf.save(`eld_log_day.pdf`);
  //   } catch (error) {
  //     console.error('Error generating PDF:', error);
  //     alert('Failed to generate PDF. Check console for details.');
  //   }
  // };

  return (
    <>
      <div className="space-y-6 min-h-screen">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              ELD Daily Log Sheets
            </h3>
            {/* <button
              onClick={handleGeneratePDF}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Print Logs
            </button> */}
          </div>
          <p className="text-sm text-gray-600 mb-6">
            Generated {tripPlan.logs.length} daily log sheet(s) for your trip.
            Each sheet complies with DOT regulations and includes detailed duty
            status tracking.
          </p>
        </div>

        <div className="print:space-y-0 space-y-6" ref={logSheetRef}>
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
