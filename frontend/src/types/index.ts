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
  engineHours: number;
  notes?: string;
}

export interface DailyLog {
  date: string;
  driverName: string;
  coDriverName?: string;
  truckNumber: string;
  trailerNumber?: string;
  startingLocation: string;
  endingLocation: string;
  totalMiles: number;
  entries: ELDLogEntry[];
  offDutyHours: number;
  sleeperHours: number;
  drivingHours: number;
  onDutyHours: number;
  violations: string[];
}


export interface TripPlan {
  tripInput: TripInput;
  route?: RouteResult;
  dailyLogs: DailyLog[];
  summary: {
    totalDays: number;
    totalMiles: number;
    totalDrivingHours: number;
    estimatedFuelCost: number;
  };
}