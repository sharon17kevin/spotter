import { useMutation } from "@tanstack/react-query";
import type { TripInput, TripPlan } from "../types";
import tripServices from "../services/trip-services";


const useCreateTrip = () => {
  return useMutation<TripPlan, Error, TripInput>({
    mutationFn: (tripInput: TripInput) =>
      tripServices.post({ data: tripInput }),
  });
};



export default useCreateTrip;