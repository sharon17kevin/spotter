import { Outlet } from "react-router-dom";
import ScrollToTop from "../hooks/useScrollToTop";
import Navbar from "../components/Navbar";

const Layout = () => {
  return (
    <div className="bg-blue-300">
      <Navbar />
      {/* <div>
        <Outlet />
      </div> */}
      <ScrollToTop />
    </div>
  );
};

export default Layout;