import React, { useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import type { RouteResult, TripInput } from '../types';
import { MapPin, Clock, Fuel, Bed } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface RouteMapProps {
  tripInput: TripInput;
  route: RouteResult;
}

const RouteMap: React.FC<RouteMapProps> = ({ tripInput, route }) => {
  const mapRef = useRef<L.Map>(null);

  const getStopIcon = (type: string) => {
    switch (type) {
      case 'required_break':
        return <Clock className="h-4 w-4 text-orange-500" />;
      case 'fuel_stop':
        return <Fuel className="h-4 w-4 text-blue-500" />;
      case 'overnight':
        return <Bed className="h-4 w-4 text-purple-500" />;
      default:
        return <MapPin className="h-4 w-4 text-gray-500" />;
    }
  };

  const createCustomIcon = (color: string) => {
    return L.divIcon({
      html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
      className: 'custom-marker',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
  };

  // Calculate bounds to fit all points
  const bounds = [
    [tripInput.currentLocation.lat, tripInput.currentLocation.lng],
    [tripInput.pickupLocation.lat, tripInput.pickupLocation.lng],
    [tripInput.dropoffLocation.lat, tripInput.dropoffLocation.lng],
    ...route.restStops.map(stop => [stop.location.lat, stop.location.lng])
  ] as [number, number][];

  // Create route line coordinates
  const routeCoordinates = route.segments.flatMap(segment => segment.coordinates);

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-4 bg-gray-50 border-b">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Route Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Total Distance</p>
            <p className="font-semibold">{route.totalDistance.toFixed(0)} miles</p>
          </div>
          <div>
            <p className="text-gray-600">Driving Time</p>
            <p className="font-semibold">{route.totalDrivingTime.toFixed(1)} hours</p>
          </div>
          <div>
            <p className="text-gray-600">Total Trip Time</p>
            <p className="font-semibold">{route.totalTripTime.toFixed(1)} hours</p>
          </div>
          <div>
            <p className="text-gray-600">Est. Arrival</p>
            <p className="font-semibold">{new Date(route.estimatedArrival).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      <div className='h-[500px]'>
        <MapContainer
          ref={mapRef}
          bounds={bounds}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Route line */}
          {routeCoordinates.length > 0 && (
            <Polyline
              positions={routeCoordinates}
              color="#2563eb"
              weight={4}
              opacity={0.7}
            />
          )}

          {/* Current location */}
          <Marker
            position={[tripInput.currentLocation.lat, tripInput.currentLocation.lng]}
            icon={createCustomIcon('#10b981')}
          >
            <Popup>
              <div>
                <h4 className="font-semibold">Current Location</h4>
                <p className="text-sm">{tripInput.currentLocation.address}</p>
              </div>
            </Popup>
          </Marker>

          {/* Pickup location */}
          <Marker
            position={[tripInput.pickupLocation.lat, tripInput.pickupLocation.lng]}
            icon={createCustomIcon('#f59e0b')}
          >
            <Popup>
              <div>
                <h4 className="font-semibold">Pickup Location</h4>
                <p className="text-sm">{tripInput.pickupLocation.address}</p>
              </div>
            </Popup>
          </Marker>

          {/* Dropoff location */}
          <Marker
            position={[tripInput.dropoffLocation.lat, tripInput.dropoffLocation.lng]}
            icon={createCustomIcon('#dc2626')}
          >
            <Popup>
              <div>
                <h4 className="font-semibold">Delivery Location</h4>
                <p className="text-sm">{tripInput.dropoffLocation.address}</p>
              </div>
            </Popup>
          </Marker>

          {/* Rest stops */}
          {route.restStops.map((stop, index) => (
            <Marker
              key={index}
              position={[stop.location.lat, stop.location.lng]}
              icon={createCustomIcon('#8b5cf6')}
            >
              <Popup>
                <div>
                  <h4 className="font-semibold flex items-center">
                    {getStopIcon(stop.type)}
                    <span className="ml-2">{stop.type.replace('_', ' ').toUpperCase()}</span>
                  </h4>
                  <p className="text-sm">{stop.location.address}</p>
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
          {route.restStops.map((stop, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
              <div className="flex items-center">
                {getStopIcon(stop.type)}
                <div className="ml-2">
                  <p className="text-sm font-medium">{stop.type.replace('_', ' ').toUpperCase()}</p>
                  <p className="text-xs text-gray-600">{stop.location.address}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{stop.duration}h</p>
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