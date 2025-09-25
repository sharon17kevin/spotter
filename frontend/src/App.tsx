import React, { useState } from 'react';
import { TripInput, TripPlan } from './types';
import TripInputForm from './components/TripInputForm';
import RouteMap from './components/RouteMap';
import ELDLogSheet from './components/ELDLogSheet';
import { RouteService } from './services/routeService';
import { ELDService } from './services/eldService';
import { Truck, MapPin, FileText, Download } from 'lucide-react';

function App() {
  const [tripPlan, setTripPlan] = useState<TripPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'input' | 'route' | 'logs'>('input');

  const handleTripSubmit = async (tripInput: TripInput) => {
    setLoading(true);
    try {
      // Calculate route with rest stops
      const route = await RouteService.calculateRoute(tripInput);
      
      // Generate ELD logs
      const plan = ELDService.generateTripPlan(tripInput, route);
      
      setTripPlan(plan);
      setActiveTab('route');
    } catch (error) {
      console.error('Error planning trip:', error);
      alert('Error planning trip. Please check your inputs and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintLogs = () => {
    window.print();
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'input':
        return (
          <TripInputForm 
            onSubmit={handleTripSubmit} 
            loading={loading}
          />
        );
      
      case 'route':
        return tripPlan ? (
          <div className="space-y-6">
            <RouteMap 
              tripInput={tripPlan.tripInput} 
              route={tripPlan.route} 
            />
            
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Trip Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-600">Total Days</p>
                  <p className="text-2xl font-bold text-blue-700">{tripPlan.summary.totalDays}</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-sm font-medium text-green-600">Total Miles</p>
                  <p className="text-2xl font-bold text-green-700">{tripPlan.summary.totalMiles.toFixed(0)}</p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <p className="text-sm font-medium text-orange-600">Driving Hours</p>
                  <p className="text-2xl font-bold text-orange-700">{tripPlan.summary.totalDrivingHours.toFixed(1)}</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm font-medium text-purple-600">Est. Fuel Cost</p>
                  <p className="text-2xl font-bold text-purple-700">${tripPlan.summary.estimatedFuelCost.toFixed(0)}</p>
                </div>
              </div>
            </div>
          </div>
        ) : null;
      
      case 'logs':
        return tripPlan ? (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">ELD Daily Log Sheets</h3>
                <button
                  onClick={handlePrintLogs}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Print Logs
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-6">
                Generated {tripPlan.dailyLogs.length} daily log sheet(s) for your trip.
                Each sheet complies with DOT regulations and includes detailed duty status tracking.
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
        ) : null;
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center">
            <Truck className="h-8 w-8 mr-3" />
            <h1 className="text-2xl font-bold">ELD Route Planner</h1>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex">
            <button
              onClick={() => setActiveTab('input')}
              className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-colors duration-200 ${
                activeTab === 'input'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <MapPin className="h-5 w-5 mr-2" />
              Trip Input
            </button>
            
            <button
              onClick={() => setActiveTab('route')}
              disabled={!tripPlan}
              className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-colors duration-200 ${
                activeTab === 'route' && tripPlan
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 disabled:text-gray-300 disabled:cursor-not-allowed'
              }`}
            >
              <MapPin className="h-5 w-5 mr-2" />
              Route & Map
            </button>
            
            <button
              onClick={() => setActiveTab('logs')}
              disabled={!tripPlan}
              className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-colors duration-200 ${
                activeTab === 'logs' && tripPlan
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 disabled:text-gray-300 disabled:cursor-not-allowed'
              }`}
            >
              <FileText className="h-5 w-5 mr-2" />
              ELD Log Sheets
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {renderTabContent()}
      </main>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:space-y-0 > *,
          .print\\:space-y-0 > * * {
            visibility: visible;
          }
          .print\\:space-y-0 {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print\\:mb-4 {
            margin-bottom: 1rem;
          }
          .print\\:p-4 {
            padding: 1rem;
          }
          @page {
            margin: 0.5in;
            size: letter;
          }
        }
        
        .grid-cols-25 {
          grid-template-columns: 120px repeat(24, 1fr);
        }
      `}</style>
    </div>
  );
}

export default App;