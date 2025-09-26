import { useState } from "react";
import TripInputForm from "../components/TripInput";

const InputPage = () => {
  const [loading, setLoading] = useState(false);
  const handleTripSubmit = async () => {
    setLoading(true);
    
  };
  return <TripInputForm onSubmit={handleTripSubmit} loading={loading} />;
};

export default InputPage;
