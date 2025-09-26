import { useState } from "react";
import type { TripInput } from "../types";
import { MapPin, User, Truck, Calendar, Notebook } from "lucide-react";

interface TripInputFormProps {
  onSubmit: (tripInput: TripInput) => void;
  loading: boolean;
}

const TripInput: React.FC<TripInputFormProps> = ({ onSubmit, loading }) => {

  const [formData, setFormData] = useState<TripInput>({
    currentLocation: { lat: 0, lng: 0, address: '' },
    pickupLocation: { lat: 0, lng: 0, address: '' },
    dropoffLocation: { lat: 0, lng: 0, address: '' },
    currentCycleUsed: 0,
    driverName: '',
    coDriverName: '',
    truckNumber: '',
    trailerNumber: '',
    startDate: new Date().toISOString().split('T')[0],
  });

  const geocodeAddress = async (address: string) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
      );
      const data = await response.json();
      if (data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          address: data[0].display_name,
        };
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
    return null;
  };

  const handleAddressChange = async (field: 'currentLocation' | 'pickupLocation' | 'dropoffLocation', address: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: { ...prev[field], address }
    }));

    if (address.length > 5) {
      const coords = await geocodeAddress(address);
      if (coords) {
        setFormData(prev => ({
          ...prev,
          [field]: coords
        }));
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.currentLocation.lat === 0 || formData.pickupLocation.lat === 0 || formData.dropoffLocation.lat === 0) {
      alert('Please enter valid addresses for all locations');
      return;
    }
    onSubmit(formData);
  };

  return (
    <div className=" rounded-lg text-white shadow-lg p-6">
      <h2 className="text-4xl font-semibold font-darkerGrotesque mb-6 flex items-center">
        <Notebook className="h-6 w-6 mr-2" />
        Trip Planning
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6 font-bricolageGrotesque">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium  mb-2">
              <User className="h-4 w-4 inline mr-1" />
              Driver Name
            </label>
            <input
              type="text"
              value={formData.driverName}
              onChange={(e) =>
                setFormData({ ...formData, driverName: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Co-Driver Name (Optional)
            </label>
            <input
              type="text"
              value={formData.coDriverName}
              onChange={(e) =>
                setFormData({ ...formData, coDriverName: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              <Truck className="h-4 w-4 inline mr-1" />
              Truck Number
            </label>
            <input
              type="text"
              value={formData.truckNumber}
              onChange={(e) =>
                setFormData({ ...formData, truckNumber: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Trailer Number (Optional)
            </label>
            <input
              type="text"
              value={formData.trailerNumber}
              onChange={(e) =>
                setFormData({ ...formData, trailerNumber: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              <Calendar className="h-4 w-4 inline mr-1" />
              Start Date
            </label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) =>
                setFormData({ ...formData, startDate: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Current Cycle Used (Hours)
            </label>
            <input
              type="number"
              min="0"
              max="70"
              step="0.25"
              value={formData.currentCycleUsed}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  currentCycleUsed: Number(e.target.value),
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Current Location
            </label>
            <input
              type="text"
              value={formData.currentLocation.address}
              onChange={(e) =>
                handleAddressChange("currentLocation", e.target.value)
              }
              placeholder="Enter current address or city, state"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Pickup Location
            </label>
            <input
              type="text"
              value={formData.pickupLocation.address}
              onChange={(e) =>
                handleAddressChange("pickupLocation", e.target.value)
              }
              placeholder="Enter pickup address or city, state"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Dropoff Location
            </label>
            <input
              type="text"
              value={formData.dropoffLocation.address}
              onChange={(e) =>
                handleAddressChange("dropoffLocation", e.target.value)
              }
              placeholder="Enter delivery address or city, state"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-secondary text-white py-3 px-6 rounded-lg hover:bg-gray-600 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Planning Route..." : "Plan Route & Generate ELD Logs"}
        </button>
      </form>
    </div>
  );
};

export default TripInput;
