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

// export interface TripPlan {
//   tripInput: TripInput;
//   route: RouteResult;
//   dailyLogs: DailyLog[];
//   summary: {
//     totalDays: number;
//     totalMiles: number;
//     totalDrivingHours: number;
//     estimatedFuelCost: number;
//   };
// }