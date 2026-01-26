// src/pages/Dashboard.tsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card } from "../components/ui/Card";
import { organizationService } from "../features/organizations/services/organizationService";
import type { DashboardStats } from "../features/organizations/types/organization.types";

export const Dashboard = () => {
  const { organizationId } = useParams<{ organizationId: string }>();
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      if (!organizationId) return;
      try {
        const result = await organizationService.getDashboard(organizationId);
        setData(result);
      } catch (err: any) {
        setError(err.response?.data?.error ?? "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [organizationId]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50 p-8 text-center">
        <p className="text-red-600 font-medium">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 text-sm font-semibold text-red-700 hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {data.organization.name}
          </h1>
          <p className="text-gray-500">
            Organization Management &bull; Real-time Stats
          </p>
        </div>
        <div className="text-sm text-gray-400 font-mono">
          As of: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
        </div>
      </header>

      {/* Resource Overview */}
      <section>
        <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-400">Resources</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Properties" value={data.stats.properties} />
          <StatCard title="Staff Members" value={data.stats.staff} />
          <StatCard title="Total Tenants" value={data.stats.tenants} />
          <StatCard title="Total Requests" value={data.stats.requests.total} />
        </div>
      </section>

      {/* Maintenance Request Status */}
      <section>
        <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-400">Request Status</h2>
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-3">
          <StatCard 
            title="Open" 
            value={data.stats.requests.open} 
            color="text-amber-600" 
            bgColor="bg-amber-50/50"
            description="Awaiting assignment"
          />
          <StatCard 
            title="In Progress" 
            value={data.stats.requests.inProgress} 
            color="text-blue-600" 
            bgColor="bg-blue-50/50"
            description="Actively being worked"
          />
          <StatCard 
            title="Completed" 
            value={data.stats.requests.completed} 
            color="text-emerald-600" 
            bgColor="bg-emerald-50/50"
            description="Resolved requests"
          />
        </div>
      </section>
    </div>
  );
};

/* --- Helper Components --- */

interface StatCardProps {
  title: string;
  value: number;
  color?: string;
  bgColor?: string;
  description?: string;
}

const StatCard = ({ title, value, color = "text-gray-900", bgColor = "bg-white", description }: StatCardProps) => (
  <Card className={`border-gray-100 ${bgColor} p-6 transition-all hover:shadow-md`}>
    <h3 className="text-sm font-semibold text-gray-500">{title}</h3>
    <p className={`mt-2 text-4xl font-extrabold tracking-tight ${color}`}>{value}</p>
    {description && (
      <p className="mt-2 text-xs text-gray-400 italic">{description}</p>
    )}
  </Card>
);