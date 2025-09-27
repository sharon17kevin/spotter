import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar, Notebook, Truck, User } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import useCreateTrip from "../hooks/useTrip";
import NominatimLocationInput from "./NomatimLocationInput";

// Define Zod schema
const schema = z.object({
  currentLocation: z.object({
    lat: z.number().min(0.0001, "Invalid latitude"),
    lng: z.number(),
    address: z.string().nonempty(),
  }),
  pickupLocation: z.object({
    lat: z.number().min(0.0001, "Invalid latitude"),
    lng: z.number(),
    address: z.string().nonempty(),
  }),
  dropoffLocation: z.object({
    lat: z.number().min(0.0001, "Invalid latitude"),
    lng: z.number(),
    address: z.string().nonempty(),
  }),
  currentCycleUsed: z.number(),
  driverName: z.string().nonempty(),
  coDriverName: z.string().optional(),
  truckNumber: z.string().nonempty(),
  trailerNumber: z.string().optional(),
  startDate: z.string(),
});

// Infer TypeScript type from schema
type FormData = z.infer<typeof schema>;

const TripInputForm = () => {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const createTrip = useCreateTrip();

  // This is called only if validation passes
  const onSubmit = async (data: FormData) => {
    // Extra manual validation if needed
    if (
      data.currentLocation.lat === 0 ||
      data.pickupLocation.lat === 0 ||
      data.dropoffLocation.lat === 0
    ) {
      alert("Please enter valid addresses for all locations");
      return;
    }

    try {
      const result = await createTrip.mutateAsync(data);
      console.log("Trip created:", result);
    } catch (err) {
      console.error("Error creating trip:", err);
    }
  };

  return (
    <div className=" rounded-lg text-white shadow-lg p-6">
      <h2 className="text-4xl font-semibold font-darkerGrotesque mb-6 flex items-center">
        <Notebook className="h-6 w-6 mr-2" />
        Trip Planning
      </h2>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6 font-bricolageGrotesque"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium  mb-2">
              <User className="h-4 w-4 inline mr-1" />
              Driver Name
            </label>
            <input
              type="text"
              {...register("driverName")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            {errors.driverName && (
              <p className="text-red-500">{errors.driverName.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Co-Driver Name (Optional)
            </label>
            <input
              type="text"
              {...register("coDriverName")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            {errors.coDriverName && (
              <p className="text-red-500">{errors.coDriverName.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              <Truck className="h-4 w-4 inline mr-1" />
              Truck Number
            </label>
            <input
              type="text"
              {...register("truckNumber")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            {errors.truckNumber && (
              <p className="text-red-500">{errors.truckNumber.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Trailer Number (Optional)
            </label>
            <input
              type="text"
              {...register("trailerNumber")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.trailerNumber && (
              <p className="text-red-500">{errors.trailerNumber.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              <Calendar className="h-4 w-4 inline mr-1" />
              Start Date
            </label>
            <input
              type="date"
              {...register("startDate")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            {errors.startDate && (
              <p className="text-red-500">{errors.startDate.message}</p>
            )}
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
              {...register("currentCycleUsed", { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            {errors.currentCycleUsed && (
              <p className="text-red-500">{errors.currentCycleUsed.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <NominatimLocationInput
            label="Current Location"
            onSelect={(address, lat, lng) =>
              setValue("currentLocation", { address, lat, lng })
            }
          />
          <NominatimLocationInput
            label="Pickup Location"
            onSelect={(address, lat, lng) =>
              setValue("pickupLocation", { address, lat, lng })
            }
          />
          <NominatimLocationInput
            label="Dropoff Location"
            onSelect={(address, lat, lng) =>
              setValue("dropoffLocation", { address, lat, lng })
            }
          />
        </div>

        <button
          type="submit"
          disabled={createTrip.isPending}
          className="w-full bg-secondary text-white py-3 px-6 rounded-lg hover:bg-gray-600 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {createTrip.isPending
            ? "Planning Route..."
            : "Plan Route & Generate ELD Logs"}
        </button>
      </form>
    </div>
  );
};

export default TripInputForm;
