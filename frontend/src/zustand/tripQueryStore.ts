import { create }  from "zustand";
import type { TripPlan } from "../types";

interface TripStore {
  tripPlan: TripPlan;
  setTripPlan: (tripPlan: TripPlan) => void;
}

export const useTripQueryStore = create<TripStore>((set) => ({
  tripPlan: {} as TripPlan,
  setTripPlan: (tripPlan: TripPlan) => set({ tripPlan }),
}));