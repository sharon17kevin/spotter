import { create }  from "zustand";
import type { TripPlan } from "../types";

interface TripStore {
  tripPlan: TripPlan;
  setTripPlan: (tripPlan: TripPlan) => void;
}

export const useTripStore = create<TripStore>((set) => ({
  tripPlan: {} as TripPlan,
  setTripPlan: (tripPlan: TripPlan) => set({ tripPlan }),
}));