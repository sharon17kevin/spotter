import { Outlet } from "react-router-dom";
import ScrollToTop from "../hooks/useScrollToTop";

const Layout = () => {
  return (
    <div className="bg-primary">
      {/* Add the Navbar here */}
      <div>
        <Outlet />
      </div>
      <ScrollToTop />
    </div>
  );
};

export default Layout;