import React from 'react';
import type { DailyLog } from '../types';
import { Clock, MapPin, Truck, User } from 'lucide-react';

interface ELDLogSheetProps {
  dailyLog: DailyLog;
  dayNumber: number;
}

const ELDLogSheet: React.FC<ELDLogSheetProps> = ({ dailyLog, dayNumber }) => {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const statusColors = {
    off_duty: '#10b981',
    sleeper: '#8b5cf6',
    driving: '#dc2626',
    on_duty: '#f59e0b',
  };

  const statusLabels = {
    off_duty: 'Off Duty',
    sleeper: 'Sleeper Berth',
    driving: 'Driving',
    on_duty: 'On Duty (Not Driving)',
  };

  // Create hourly grid data
  const createHourlyGrid = () => {
    const grid = Array(24).fill('off_duty');
    
    dailyLog.entries.forEach((entry, index) => {
      const startTime = new Date(`${dailyLog.date}T${entry.time}`);
      const startHour = startTime.getHours() + startTime.getMinutes() / 60;
      
      const nextEntry = dailyLog.entries[index + 1];
      const endTime = nextEntry 
        ? new Date(`${dailyLog.date}T${nextEntry.time}`)
        : new Date(`${dailyLog.date}T23:59`);
      const endHour = endTime.getHours() + endTime.getMinutes() / 60;
      
      for (let hour = Math.floor(startHour); hour < Math.ceil(endHour) && hour < 24; hour++) {
        grid[hour] = entry.status;
      }
    });
    
    return grid;
  };

  const hourlyGrid = createHourlyGrid();

  return (
    <div className="bg-white border-2 border-gray-300 p-6 mb-6 print:mb-4 print:p-4">
      {/* Header */}
      <div className="border-b-2 border-gray-800 pb-4 mb-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-bold">DRIVER'S DAILY LOG</h2>
            <p className="text-sm text-gray-600">Day {dayNumber} - {new Date(dailyLog.date).toLocaleDateString()}</p>
          </div>
          <div className="text-right">
            <p className="text-sm"><strong>DOT Regulation 395.8</strong></p>
            <p className="text-xs text-gray-600">Electronic Logging Device</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <label className="block text-gray-600">Driver Name:</label>
            <p className="font-medium border-b border-gray-300 pb-1">{dailyLog.driverName}</p>
          </div>
          <div>
            <label className="block text-gray-600">Co-Driver:</label>
            <p className="font-medium border-b border-gray-300 pb-1">{dailyLog.coDriverName || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-gray-600">Truck #:</label>
            <p className="font-medium border-b border-gray-300 pb-1">{dailyLog.truckNumber}</p>
          </div>
          <div>
            <label className="block text-gray-600">Trailer #:</label>
            <p className="font-medium border-b border-gray-300 pb-1">{dailyLog.trailerNumber || 'N/A'}</p>
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
          {/* Hour headers */}
          <div className="grid grid-cols-25 border-b border-gray-400">
            <div className="p-1 text-xs font-semibold border-r border-gray-400 bg-gray-100">Time</div>
            {hours.map(hour => (
              <div key={hour} className="p-1 text-xs text-center border-r border-gray-400 bg-gray-100">
                {hour.toString().padStart(2, '0')}
              </div>
            ))}
          </div>

          {/* Status rows */}
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
          <p className="font-bold">{dailyLog.offDutyHours.toFixed(2)} hrs</p>
        </div>
        <div className="border border-gray-300 p-2">
          <label className="block text-gray-600">Sleeper:</label>
          <p className="font-bold">{dailyLog.sleeperHours.toFixed(2)} hrs</p>
        </div>
        <div className="border border-gray-300 p-2">
          <label className="block text-gray-600">Driving:</label>
          <p className="font-bold">{dailyLog.drivingHours.toFixed(2)} hrs</p>
        </div>
        <div className="border border-gray-300 p-2">
          <label className="block text-gray-600">On Duty:</label>
          <p className="font-bold">{dailyLog.onDutyHours.toFixed(2)} hrs</p>
        </div>
      </div>

      {/* Locations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm">
        <div>
          <label className="block text-gray-600">Starting Location:</label>
          <p className="font-medium border-b border-gray-300 pb-1">{dailyLog.startingLocation}</p>
        </div>
        <div>
          <label className="block text-gray-600">Ending Location:</label>
          <p className="font-medium border-b border-gray-300 pb-1">{dailyLog.endingLocation}</p>
        </div>
      </div>

      <div className="text-sm">
        <label className="block text-gray-600">Total Miles:</label>
        <p className="font-bold text-lg">{dailyLog.totalMiles.toFixed(0)} miles</p>
      </div>

      {/* Violations */}
      {dailyLog.violations.length > 0 && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
          <h4 className="text-sm font-semibold text-red-800 mb-2">VIOLATIONS:</h4>
          <ul className="text-xs text-red-700">
            {dailyLog.violations.map((violation, index) => (
              <li key={index}>• {violation}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Log Entries Detail */}
      <div className="mt-4">
        <h4 className="text-sm font-semibold mb-2">DETAILED LOG ENTRIES</h4>
        <div className="space-y-1 text-xs">
          {dailyLog.entries.map((entry, index) => (
            <div key={index} className="grid grid-cols-5 gap-2 py-1 border-b border-gray-200">
              <div>{entry.time}</div>
              <div className="capitalize">{entry.status.replace('_', ' ')}</div>
              <div>{entry.location}</div>
              <div>{entry.odometer.toLocaleString()} mi</div>
              <div>{entry.notes || '-'}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ELDLogSheet;