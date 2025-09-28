export interface TripInput {
  currentLocation: {
    lat: number;
    lng: number;
    address: string;
  };
  pickupLocation: {
    lat: number;
    lng: number;
    address: string;
  };
  dropoffLocation: {
    lat: number;
    lng: number;
    address: string;
  };
  currentCycleUsed: number; // Hours already used in current cycle
  driverName: string;
  coDriverName?: string;
  truckNumber: string;
  trailerNumber?: string;
  startDate: string;
}

export interface RouteSegment {
  from: string;
  to: string;
  distance: number; // miles
  duration: number; // hours
  coordinates: [number, number][];
}

export interface RestStop {
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  type: 'required_break' | 'rest_area' | 'fuel_stop' | 'overnight';
  duration: number; // hours
  reason: string;
}

export interface RouteResult {
  segments: RouteSegment[];
  restStops: RestStop[];
  totalDistance: number;
  totalDrivingTime: number;
  totalTripTime: number;
  estimatedArrival: string;
}

export interface ELDLogEntry {
  time: string;
  status: 'off_duty' | 'sleeper' | 'driving' | 'on_duty';
  location: string;
  odometer: number;
  notes?: string;
}

export interface Stop {
  type: "pickup" | "dropoff" | "fuel" | "rest" | "restart"; 
  location: [number, number]; // [lat, lng]
  duration: number; // hours
  reason: string;
}

// A block of duty status time (used inside logs + timeline)
export interface TimeBlock {
  start: string;   // e.g. "05:30"
  end: string;     // e.g. "07:00"
  status: "Off Duty" | "Sleeper" | "Driving" | "On Duty Not Driving";
  day: number;
}

export interface DailyTotals {
  driving: number;   // hours
  on_duty: number;   // hours (On Duty Not Driving)
  off_duty: number;  // hours
  sleeper: number;   // hours
}

// A per-day log sheet
export interface DailyLog {
  day: number;
  date: string; // "YYYY-MM-DD"
  timeBlocks: TimeBlock[];
  totals: DailyTotals;
  remarks: string;
}
export interface TripPlanSummary {
  total_distance_miles: number;
  total_driving_hours: number;
  total_trip_hours: number;
  estimated_arrival: string; // ISO date
}
export interface TripPlan {
  route: {
    points: [number, number][]; // [lat, lon]
    stops: Stop[];
  };
  timeline: TimeBlock[];
  logs: DailyLog[];
  summary: TripPlanSummary;
}


