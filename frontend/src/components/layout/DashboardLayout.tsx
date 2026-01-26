// src/components/layout/DashboardLayout.tsx
import { Sidebar } from "./Sidebar";
import { Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export const DashboardLayout = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="flex flex-1">
      {isAuthenticated && <Sidebar />}
      
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};