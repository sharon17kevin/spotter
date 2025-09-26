import { useState } from "react";
import TripInputForm from "../components/TripInput";
import Footer from "../components/Footer";

const InputPage = () => {
  const [loading, setLoading] = useState(false);
  const handleTripSubmit = async () => {
    setLoading(true);
  };
  return (
    <>
      <TripInputForm onSubmit={handleTripSubmit} loading={loading} />
      <Footer/>
    </>
  );
};

export default InputPage;
