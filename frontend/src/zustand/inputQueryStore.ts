import { create } from "zustand";
import type { TripInput } from "../types";

interface InputStore {
  tripInput: TripInput;
  setTripInput: (tripInput: TripInput) => void;
}

export const useInputQueryStore = create<InputStore>((set) => ({
  tripInput: {} as TripInput,
  setTripInput: (tripInput: TripInput) => set({ tripInput }),
}));