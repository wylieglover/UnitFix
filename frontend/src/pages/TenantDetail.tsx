// src/pages/TenantDetail.tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

// Services
import { tenantService } from "../features/tenants/services/tenantService";
import { ticketService } from "../features/tickets/services/ticketService";

// Components
import { Button } from "../components/ui/Button";
import { Table } from "../components/ui/Table";
import { 
  Mail, 
  Phone, 
  MapPin, 
  ArrowLeft, 
  ShieldAlert, 
  Wrench, 
  ChevronRight 
} from "lucide-react";

// Types
import type { Tenant } from "../features/tenants/types/tenant.types";
import type { Ticket } from "../features/tickets/types/ticket.types";

export const TenantDetail = () => {
  const { organizationId, propertyId, userId } = useParams<{ 
    organizationId: string; 
    propertyId: string; 
    userId: string 
  }>();
  const navigate = useNavigate();

  // --- State ---
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [ticketsLoading, setTicketsLoading] = useState(false);

  // --- Data Fetching ---
  useEffect(() => {
    const fetchData = async () => {
      if (!organizationId || !propertyId || !userId) return;
      
      try {
        setTicketsLoading(true);
        // Fetch profile and tickets in parallel for better performance
        const [tenantRes, ticketsRes] = await Promise.all([
          tenantService.get(organizationId, propertyId, userId),
          ticketService.list(organizationId, propertyId, { createdBy: userId })
        ]);
        
        setTenant(tenantRes.tenant);
        setTickets(ticketsRes.requests);
      } catch (err) {
        console.error("Failed to fetch tenant data", err);
      } finally {
        setLoading(false);
        setTicketsLoading(false);
      }
    };

    fetchData();
  }, [organizationId, propertyId, userId]);

  // --- Table Columns for Maintenance History ---
  const ticketColumns = [
    {
      key: "code",
      header: "ID",
      render: (t: Ticket) => <span className="font-mono font-bold text-indigo-600">#{t.code}</span>
    },
    {
      key: "issue",
      header: "Issue",
      render: (t: Ticket) => (
        <span className="text-sm text-gray-700 truncate max-w-[200px] block">
          {t.description}
        </span>
      )
    },
    {
      key: "status",
      header: "Status",
      render: (t: Ticket) => {
        const colors = {
          open: "bg-blue-50 text-blue-700 border-blue-100",
          in_progress: "bg-amber-50 text-amber-700 border-amber-100",
          completed: "bg-emerald-50 text-emerald-700 border-emerald-100",
          cancelled: "bg-gray-50 text-gray-500 border-gray-100",
        };
        return (
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${colors[t.status]}`}>
            {t.status.replace('_', ' ')}
          </span>
        );
      }
    },
    {
      key: "date",
      header: "Submitted",
      render: (t: Ticket) => (
        <span className="text-xs text-gray-400">
          {new Date(t.createdAt).toLocaleDateString()}
        </span>
      )
    },
    {
      key: "action",
      header: "",
      render: () => <ChevronRight size={16} className="text-gray-300" />
    }
  ];

  if (loading) return <div className="p-12 text-center animate-pulse text-gray-400">Loading resident profile...</div>;
  if (!tenant) return <div className="p-12 text-center text-red-500">Resident not found.</div>;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Navigation */}
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors group"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-medium">Back to Property</span>
      </button>

      {/* Header Profile Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="h-24 w-24 rounded-3xl bg-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-xl shadow-indigo-100 shrink-0">
            {tenant.user.name?.charAt(0) || "?"}
          </div>
          
          <div className="flex-1 space-y-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {tenant.user.name || "Pending Invitation"}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase border ${
                  tenant.archivedAt 
                    ? "bg-gray-50 text-gray-500 border-gray-200" 
                    : "bg-emerald-50 text-emerald-700 border-emerald-100"
                }`}>
                  {tenant.archivedAt ? "Past Resident" : "Active Resident"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-8">
              <div className="flex items-center gap-3 text-gray-600">
                <Mail size={18} className="text-indigo-400" />
                <span className="text-sm font-medium">{tenant.user.email}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <Phone size={18} className="text-indigo-400" />
                <span className="text-sm font-medium">{tenant.user.phone || "No phone provided"}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <MapPin size={18} className="text-indigo-400" />
                <span className="text-sm font-medium">
                  {tenant.property?.name} — Unit {tenant.unitNumber}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <Button variant="outline" className="flex-1">Edit Profile</Button>
            <Button variant="outline" className="flex-1 text-red-600 hover:bg-red-50 border-red-100">
              Archive
            </Button>
          </div>
        </div>
      </div>

      

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Maintenance History */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Wrench size={18} className="text-indigo-500" />
                Maintenance Requests
              </h3>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-1 rounded">
                {tickets.length} Records
              </div>
            </div>

            <Table
              data={tickets}
              columns={ticketColumns}
              loading={ticketsLoading}
              rowKey="id"
              onRowClick={(t) => 
                navigate(`/organizations/${organizationId}/properties/${propertyId}/tickets/${t.code}`)
              }
              emptyState={{
                title: "No maintenance history",
                description: "This resident hasn't submitted any tickets yet.",
                icon: <Wrench className="h-10 w-10 text-gray-200" />
              }}
            />
          </div>
        </div>

        {/* Right Column: Admin Tools */}
        <div className="space-y-6">
          <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100 shadow-sm">
            <div className="flex items-center gap-2 text-amber-800 font-bold mb-3">
              <ShieldAlert size={18} />
              <h4 className="text-sm uppercase tracking-tight">Internal Admin Notes</h4>
            </div>
            <p className="text-amber-700 text-sm leading-relaxed bg-white/50 p-3 rounded-lg border border-amber-200/50">
              Resident reported a leak in the master bathroom last month. Access granted for repairs during business hours.
            </p>
            <button className="mt-4 text-xs font-bold text-amber-800 hover:underline uppercase">
              + Update Notes
            </button>
          </div>

          <div className="bg-indigo-900 rounded-2xl p-6 text-white shadow-lg shadow-indigo-100">
            <h4 className="font-bold mb-1">Quick Action</h4>
            <p className="text-indigo-200 text-xs mb-4">Create a ticket on behalf of this resident.</p>
            <Button variant="primary" className="w-full bg-white text-indigo-900 hover:bg-indigo-50 border-none">
              New Ticket
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};