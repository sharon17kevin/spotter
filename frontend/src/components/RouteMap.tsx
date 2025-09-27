// src/components/RouteMap.tsx
import React, { useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import type { TripInput, TripPlan } from '../types'; // Using TripPlan interface
 // Using TripPlan interface
import { MapPin, Clock, Fuel } from 'lucide-react'; // Icons for stops
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface RouteMapProps {
  tripInput: TripInput;
  tripPlan: TripPlan | null;
}

const RouteMap: React.FC<RouteMapProps> = ({ tripInput, tripPlan }) => {
  const mapRef = useRef<L.Map>(null);

  // Custom icon creation function
  const createCustomIcon = (color: string) => {
    return L.divIcon({
      html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
      className: 'custom-marker',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
  };

  // Icon for stop types
  const getStopIcon = (type: string) => {
    switch (type) {
      case 'pickup':
        return <MapPin className="h-4 w-4 text-yellow-500" />;
      case 'dropoff':
        return <MapPin className="h-4 w-4 text-red-500" />;
      case 'rest':
      case 'restart':
        return <Clock className="h-4 w-4 text-purple-500" />;
      case 'fuel':
        return <Fuel className="h-4 w-4 text-blue-500" />;
      default:
        return <MapPin className="h-4 w-4 text-gray-500" />;
    }
  };

  // Calculate bounds to fit all points
  const bounds = tripPlan?.route.points.length
    ? tripPlan.route.points
    : [
        [tripInput.currentLocation.lat, tripInput.currentLocation.lng],
        [tripInput.pickupLocation.lat, tripInput.pickupLocation.lng],
        [tripInput.dropoffLocation.lat, tripInput.dropoffLocation.lng],
      ]; // Default to tripInput locations

  useEffect(() => {
    if (mapRef.current && tripPlan?.route.points.length) {
      mapRef.current.fitBounds(bounds as L.LatLngBoundsExpression);
    }
  }, [tripPlan]);

  if (!tripPlan) {
    return <div className="text-center py-4">Loading route data...</div>;
  }

  // Calculate estimated arrival
  const startTime = new Date(tripInput.startDate || '2025-09-27T22:25:00+01:00'); // 10:25 PM WAT, fallback
  const estimatedArrival = new Date(startTime.getTime() + tripPlan.summary.total_trip_hours * 60 * 60 * 1000).toLocaleString('en-US', {
    timeZone: 'Africa/Lagos',
  });

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-4 bg-gray-50 border-b">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Route Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Total Distance</p>
            <p className="font-semibold">{tripPlan.summary.total_distance_miles.toFixed(0)} miles</p>
          </div>
          <div>
            <p className="text-gray-600">Driving Time</p>
            <p className="font-semibold">{(tripPlan.summary.total_trip_hours - 2).toFixed(1)} hours</p> {/* Exclude pickup/dropoff */}
          </div>
          <div>
            <p className="text-gray-600">Total Trip Time</p>
            <p className="font-semibold">{tripPlan.summary.total_trip_hours.toFixed(1)} hours</p>
          </div>
          <div>
            <p className="text-gray-600">Est. Arrival</p>
            <p className="font-semibold">{estimatedArrival}</p>
          </div>
        </div>
      </div>

      <div className="h-[500px]">
        <MapContainer
          ref={mapRef}
          bounds={bounds as L.LatLngBoundsExpression}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Polyline for the route */}
          {tripPlan.route.points.length > 1 && (
            <Polyline
              positions={tripPlan.route.points}
              color="#2563eb"
              weight={4}
              opacity={0.7}
            />
          )}

          {/* Markers for all stops */}
          {tripPlan.route.stops.map((stop, index) => (
            <Marker
              key={index}
              position={stop.location}
              icon={createCustomIcon(
                stop.type === 'pickup' ? '#f59e0b' : // Yellow
                stop.type === 'dropoff' ? '#dc2626' : // Red
                stop.type === 'rest' || stop.type === 'restart' ? '#8b5cf6' : // Purple
                '#22c55e' // Green for fuel
              )}
            >
              <Popup>
                <div>
                  <h4 className="font-semibold flex items-center">
                    {getStopIcon(stop.type)}
                    <span className="ml-2">{stop.type.replace('_', ' ').toUpperCase()}</span>
                  </h4>
                  <p className="text-sm">
                    {stop.type === 'pickup' && tripInput.pickupLocation.address}
                    {stop.type === 'dropoff' && tripInput.dropoffLocation.address}
                    {['rest', 'restart', 'fuel'].includes(stop.type) && 'Approx. Location'}
                  </p>
                  <p className="text-sm">Duration: {stop.duration} hours</p>
                  <p className="text-sm">{stop.reason}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div className="p-4 bg-gray-50 border-t">
        <h4 className="font-medium text-gray-900 mb-3">Planned Stops</h4>
        <div className="space-y-2">
          {tripPlan.route.stops.map((stop, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
              <div className="flex items-center">
                {getStopIcon(stop.type)}
                <div className="ml-2">
                  <p className="text-sm font-medium">{stop.type.replace('_', ' ').toUpperCase()}</p>
                  <p className="text-sm">
                    {stop.type === 'pickup' && tripInput.pickupLocation.address}
                    {stop.type === 'dropoff' && tripInput.dropoffLocation.address}
                    {['rest', 'restart', 'fuel'].includes(stop.type) && 'Approx. Location'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">Duration: {stop.duration}h</p>
                <p className="text-xs text-gray-600">{stop.reason}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RouteMap;