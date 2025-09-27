import { useState } from "react";
import axios from "axios";

interface LocationInputProps {
  label: string;
  onSelect: (address: string, lat: number, lng: number) => void;
}

export default function NominatimLocationInput({ label, onSelect }: LocationInputProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const searchLocation = async (val: string) => {
    setQuery(val);
    if (val.length < 3) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    try {
      const res = await axios.get("https://nominatim.openstreetmap.org/search", {
        params: {
          q: val,
          format: "json",
          addressdetails: 1,
          limit: 5,
        },
        headers: {
          "User-Agent": "TripPlanner/1.0", // required by Nominatim TOS
        },
      });
      setSuggestions(res.data);
    } catch (err) {
      console.error("Nominatim error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (place: any) => {
    setQuery(place.display_name);
    setSuggestions([]);
    onSelect(place.display_name, parseFloat(place.lat), parseFloat(place.lon));
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium mb-2">{label}</label>
      <input
        type="text"
        value={query}
        onChange={(e) => searchLocation(e.target.value)}
        placeholder="Type to search..."
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {loading && <div className="absolute bg-white p-2">Loading...</div>}
      {suggestions.length > 0 && (
        <div className="absolute bg-white border text-primary  border-gray-300 rounded-lg mt-1 w-full z-10">
          {suggestions.map((s) => (
            <div
              key={s.place_id}
              className="p-2 hover:bg-blue-500 hover:text-white cursor-pointer"
              onClick={() => handleSelect(s)}
            >
              {s.display_name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}