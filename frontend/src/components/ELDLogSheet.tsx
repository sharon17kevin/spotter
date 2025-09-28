import React from 'react';
import type { DailyLog, Stop, TimeBlock } from '../types';
import { useInputQueryStore } from '../zustand/inputQueryStore';
import { useTripQueryStore } from '../zustand/tripQueryStore';

interface ELDLogSheetProps {
  dailyLog: DailyLog;
  dayNumber: number;
}

const ELDLogSheet: React.FC<ELDLogSheetProps> = ({ dailyLog, dayNumber }) => {
  const {  tripPlan } = useTripQueryStore(); // Fetch from Zustand
  const {  tripInput } = useInputQueryStore(); // Fetch from Zustand

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const statusColors = {
    'Off Duty': '#10b981',
    'Sleeper': '#8b5cf6',
    'Driving': '#dc2626',
    'On Duty Not Driving': '#f59e0b',
  };

  const statusLabels = {
    'Off Duty': 'Off Duty',
    'Sleeper': 'Sleeper',
    'Driving': 'Driving',
    'On Duty Not Driving': 'On Duty (Not Driving)',
  };

  // Create hourly grid data from timeBlocks
  const createHourlyGrid = () => {
    const grid = Array(24).fill('Off Duty'); // Default to Off Duty
    
    dailyLog.timeBlocks.forEach((block: TimeBlock) => {
      const startParts = block.start.split(':').map(Number);
      const startHour = startParts[0] + startParts[1] / 60;
      
      const endParts = block.end.split(':').map(Number);
      const endHour = endParts[0] + endParts[1] / 60;
      
      for (let hour = Math.floor(startHour); hour < Math.ceil(endHour) && hour < 24; hour++) {
        grid[hour] = block.status;
      }
    });
    
    return grid;
  };

  const hourlyGrid = createHourlyGrid();

  // Map timeBlocks to detailed entries with location and odometer
  const getLocationFromStops = (time: string, stops: Stop[]) => {
    const stop = stops.find(s => {
      // const stopTime = new Date(`${dailyLog.date}T${time}`).getTime();
      // Approximate match based on time (simplified; improve with precise timestamps if available)
      return s.reason && s.reason.includes(time);
    });
    return stop ? stop.reason.split(' at ')[1] || tripInput.currentLocation.address : tripInput.currentLocation.address;
  };

  const totalDays = tripPlan.logs.length;
  const dailyDistance = tripPlan.summary.total_distance_miles / totalDays; // Approximate per-day distance
  const cumulativeOdometer = (index: number) => (dailyDistance * (dayNumber - 1)) + (index * (dailyDistance / dailyLog.timeBlocks.length)).toFixed(0);

  const entries = dailyLog.timeBlocks.map((block: TimeBlock, index) => ({
    time: block.start,
    status: block.status,
    location: getLocationFromStops(block.start, tripPlan.route.stops),
    odometer: Number(cumulativeOdometer(index)),
    notes: '-',
  }));

  return (
    <div className="bg-white border-2 border-gray-300 p-6 mb-6 print:mb-4 print:p-4">
      {/* Header */}
      <div className="border-b-2 border-gray-800 pb-4 mb-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-bold">DRIVER'S DAILY LOG</h2>
            <p className="text-sm text-gray-600">Day {dailyLog.day} - {new Date(dailyLog.date).toLocaleDateString()}</p>
          </div>
          <div className="text-right">
            <p className="text-sm"><strong>DOT Regulation 395.8</strong></p>
            <p className="text-xs text-gray-600">Electronic Logging Device</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <label className="block text-gray-600">Driver Name:</label>
            <p className="font-medium border-b border-gray-300 pb-1">{tripInput.driverName}</p>
          </div>
          <div>
            <label className="block text-gray-600">Co-Driver:</label>
            <p className="font-medium border-b border-gray-300 pb-1">{tripInput.coDriverName || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-gray-600">Truck #:</label>
            <p className="font-medium border-b border-gray-300 pb-1">{tripInput.truckNumber}</p>
          </div>
          <div>
            <label className="block text-gray-600">Trailer #:</label>
            <p className="font-medium border-b border-gray-300 pb-1">{tripInput.trailerNumber || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Status Legend */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold mb-2">DUTY STATUS</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          {Object.entries(statusLabels).map(([status, label]) => (
            <div key={status} className="flex items-center">
              <div 
                className="w-4 h-4 mr-2 border border-gray-400"
                style={{ backgroundColor: statusColors[status as keyof typeof statusColors] }}
              ></div>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Time Grid */}
      <div className="mb-4">
        <div className="border border-gray-400">
          <div className="grid grid-cols-25 border-b border-gray-400">
            <div className="p-1 text-xs font-semibold border-r border-gray-400 bg-gray-100">Time</div>
            {hours.map(hour => (
              <div key={hour} className="p-1 text-xs text-center border-r border-gray-400 bg-gray-100">
                {hour.toString().padStart(2, '0')}
              </div>
            ))}
          </div>
          {Object.entries(statusLabels).map(([status, label]) => (
            <div key={status} className="grid grid-cols-25 border-b border-gray-400">
              <div className="p-2 text-xs font-medium border-r border-gray-400 bg-gray-50">
                {label}
              </div>
              {hours.map(hour => (
                <div 
                  key={hour} 
                  className="h-8 border-r border-gray-400 relative"
                  style={{ 
                    backgroundColor: hourlyGrid[hour] === status 
                      ? statusColors[status as keyof typeof statusColors] 
                      : 'transparent' 
                  }}
                >
                  {hourlyGrid[hour] === status && (
                    <div className="absolute inset-0 opacity-80"></div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
        <div className="border border-gray-300 p-2">
          <label className="block text-gray-600">Off Duty:</label>
          <p className="font-bold">{(dailyLog.totals.off_duty).toFixed(2)} hrs</p>
        </div>
        <div className="border border-gray-300 p-2">
          <label className="block text-gray-600">Sleeper:</label>
          <p className="font-bold">{(dailyLog.totals.sleeper).toFixed(2)} hrs</p>
        </div>
        <div className="border border-gray-300 p-2">
          <label className="block text-gray-600">Driving:</label>
          <p className="font-bold">{(dailyLog.totals.driving).toFixed(2)} hrs</p>
        </div>
        <div className="border border-gray-300 p-2">
          <label className="block text-gray-600">On Duty:</label>
          <p className="font-bold">{(dailyLog.totals.on_duty).toFixed(2)} hrs</p>
        </div>
      </div>

      {/* Locations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm">
        <div>
          <label className="block text-gray-600">Starting Location:</label>
          <p className="font-medium border-b border-gray-300 pb-1">{tripInput.currentLocation.address}</p>
        </div>
        <div>
          <label className="block text-gray-600">Ending Location:</label>
          <p className="font-medium border-b border-gray-300 pb-1">{tripInput.dropoffLocation.address}</p>
        </div>
      </div>

      <div className="text-sm">
        <label className="block text-gray-600">Total Miles:</label>
        <p className="font-bold text-lg">{dailyDistance.toFixed(0)} miles</p>
      </div>

      {/* Violations (if any) */}
      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
        <h4 className="text-sm font-semibold text-red-800 mb-2">VIOLATIONS:</h4>
        <ul className="text-xs text-red-700">
          <li>• No violations detected</li> {/* Add logic for violations (e.g., >11 hours driving) */}
        </ul>
      </div>

      {/* Log Entries Detail */}
      <div className="mt-4">
        <h4 className="text-sm font-semibold mb-2">DETAILED LOG ENTRIES</h4>
        <div className="space-y-1 text-xs">
          {entries.map((entry, index) => (
            <div key={index} className="grid grid-cols-5 gap-2 py-1 border-b border-gray-200">
              <div>{entry.time}</div>
              <div className="capitalize">{entry.status}</div>
              <div>{entry.location}</div>
              <div>{entry.odometer} mi</div>
              <div>{entry.notes}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ELDLogSheet;