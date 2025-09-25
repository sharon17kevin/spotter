import { Truck, X } from "lucide-react";
import { useEffect } from "react";
import { useNavbarModalStore } from "../zustand/useNavbarModalStore";

const NavbarModal = () => {
  const { isOpen, closeModal } = useNavbarModalStore();

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, closeModal]);

  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === "Escape") closeModal();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center font-darkerGrotesque">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={closeModal}
      />
      <div className="relative w-full max-w-lg rounded-lg bg-white p-6 shadow-xl z-50 mx-4">
        <div className="flex items-center justify-between mb-4">
          <div className=" flex items-center">
            <Truck className="h-8 w-8" />
            <span className="ml-3 text-base lg:text-xl font-darkerGrotesque">
              Route Planner
            </span>
          </div>
          <button
            onClick={closeModal}
            className="rounded-full p-1 hover:bg-gray-100 transition-colors"
          >
            {<X className="h-5 w-5" />}
          </button>
        </div>
        <div className="w-full z-50 p-6 font-darkerGrotesque">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <div
              onClick={() => {}}
              className="flex  px-3 py-2 cursor-pointer text-secondary hover:text-indigo-500 w-full border-black border-b-[1px] justify-center"
            >
              Trip Input
            </div>
            <div
              onClick={() => {}}
              className="flex  px-3 py-2 cursor-pointer text-secondary hover:text-indigo-500 w-full border-black border-b-[1px] justify-center"
            >
              Route & Map
            </div>
            <div
              onClick={() => {}}
              className="flex  px-3 py-2 cursor-pointer text-secondary hover:text-indigo-500 w-full border-black border-b-[1px] justify-center"
            >
              ELD Log Sheets
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NavbarModal;