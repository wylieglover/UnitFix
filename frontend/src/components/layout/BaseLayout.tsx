// src/components/layout/BaseLayout.tsx
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { Outlet } from "react-router-dom";

export const BaseLayout = () => {
  return (
    <div className="relative min-h-screen flex flex-col bg-gradient-to-b from-white via-white to-gray-50">
      {/* Decorative blob - Rendered once for the entire app */}
      <div className="pointer-events-none absolute inset-x-0 -top-40 -z-10 blur-3xl">
        <div
          className="mx-auto h-80 max-w-2xl rotate-6 bg-gradient-to-tr from-blue-500/30 via-indigo-400/30 to-emerald-400/30 opacity-60"
          style={{
            clipPath: "polygon(0% 20%, 15% 0%, 60% 10%, 100% 0%, 85% 65%, 20% 100%, 0% 75%)",
          }}
        />
      </div>

      <Navbar />

      {/* This is where the specific layout (Sidebar or Full Width) will inject its content */}
      <div className="flex-1 flex flex-col">
        <Outlet />
      </div>

      <Footer />
    </div>
  );
};