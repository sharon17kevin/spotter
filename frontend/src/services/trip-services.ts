import APIClient from "./api-client";
import type { TripPlan } from "../types";

export default new APIClient<TripPlan>('/plan-trip/')