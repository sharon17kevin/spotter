import { Circle, MenuIcon, Truck } from "lucide-react";
import { motion, useMotionValueEvent, useScroll } from "motion/react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useNavbarModalStore } from "../zustand/navbarModalStore";

const Navbar = () => {
  const { openModal } = useNavbarModalStore();
  const location = useLocation();
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious();
    if (previous != null) {
      if (latest > previous && latest > 150) {
        setHidden(true);
      } else {
        setHidden(false);
      }
    }
  });

  return (
    <motion.nav
      variants={{
        visible: { y: 0 },
        hidden: { y: -100 },
      }}
      animate={hidden ? "hidden" : "visible"}
      transition={{ duration: 0.35, ease: "easeInOut" }}
      className="w-full z-50 bg-primary text-white sticky top-0 flex"
    >
      <div className=" xl:max-w-[90vw] w-full mx-auto px-4 sm:px-2 lg:px-8">
        <div className=" flex h-16 justify-between">
          <div className=" flex items-center">
            <Truck className="h-8 w-8" />
            <span className="ml-3 text-base lg:text-xl font-darkerGrotesque">
              Route Planner
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className=" hidden lg:flex flex-1 justify-around items-center">
            <div className=" space-x-1 lg:space-x-10 font-darkerGrotesque text-base">
              <Link
                to="/"
                className={`group pt-1 pb-2 px-3 rounded-full items-center justify-center space-x-1 ${
                  location.pathname === "/" ? "bg-white/30" : "bg-transparent"
                }`}
              >
                <span>Trip Input</span>
                <Circle
                  width={10}
                  height={10}
                  className={`inline-block fill-white ${
                    location.pathname === "/"
                      ? "opacity-100"
                      : "opacity-0 group-hover:opacity-100"
                  }`}
                />
              </Link>
              <Link
                to="/map"
                className={`group pt-1 pb-2 px-3 rounded-full items-center justify-center space-x-1 ${
                  location.pathname === "/gallery"
                    ? "bg-white/30"
                    : "bg-transparent"
                }`}
              >
                <span>Route & Map</span>
                <Circle
                  width={10}
                  height={10}
                  className={`inline-block fill-white ${
                    location.pathname === "/map"
                      ? "opacity-100"
                      : "opacity-0 group-hover:opacity-100"
                  }`}
                />
              </Link>
              <Link
                to="/log"
                className={`group pt-1 pb-2 px-3 rounded-full items-center justify-center space-x-1 ${
                  location.pathname === "/order"
                    ? "bg-white/30"
                    : "bg-transparent"
                }`}
              >
                <span>ELD Log Sheets</span>
                <Circle
                  width={10}
                  height={10}
                  className={`inline-block fill-white ${
                    location.pathname === "/log"
                      ? "opacity-100"
                      : "opacity-0 group-hover:opacity-100"
                  }`}
                />
              </Link>
            </div>
          </div>
          {/* <div className="hidden lg:flex font-darkerGrotesque text-base items-center justify-items-end space-x-2">
            
          </div> */}

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center">
            <button
              onClick={openModal}
              className="text-white hover:text-gray-200 focus:outline-none"
            >
              {<MenuIcon className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
