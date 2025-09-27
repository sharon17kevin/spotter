import { useMutation } from "@tanstack/react-query";
import type { TripInput, TripPlan } from "../types";
import tripServices from "../services/trip-services";


const useCreateTrip = () => {
  return useMutation<TripPlan, Error, TripInput>({
    mutationFn: async (tripInput: TripInput) => {
      const payload = {
        current_location: tripInput.currentLocation,
        pickup_location: tripInput.pickupLocation,
        dropoff_location: tripInput.dropoffLocation,
        current_cycle_used: tripInput.currentCycleUsed,
        driver_name: tripInput.driverName,
        co_driver_name: tripInput.coDriverName,
        truck_number: tripInput.truckNumber,
        trailer_number: tripInput.trailerNumber,
        start_date: tripInput.startDate,
      };

      const res = await tripServices.post({ data: payload });
      return res;
    },
  });
};



export default useCreateTrip;