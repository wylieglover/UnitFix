import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ticketService } from "../features/tickets/services/ticketService";
import { staffService } from "../features/staff/services/staffService";
import { Button } from "../components/ui/Button";
import { 
  ArrowLeft, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  User, 
  Building2, 
  Hash,
  MessageSquare
} from "lucide-react";
import type { Ticket, TicketStatus } from "../features/tickets/types/ticket.types";
import type { Staff } from "../features/staff/types/staff.types";

export const TicketDetail = () => {
  const { organizationId, propertyId, ticketId } = useParams();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [propertyStaff, setPropertyStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!organizationId || !propertyId || !ticketId) return;
      try {
        const [ticketData, staffData] = await Promise.all([
          ticketService.get(organizationId, propertyId, ticketId),
          staffService.list(organizationId, propertyId)
        ]);
        setTicket(ticketData.request);
        setPropertyStaff(staffData.staff);
      } catch (err) {
        console.error("Failed to load ticket details", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [organizationId, propertyId, ticketId]);

  if (loading) return <div className="p-8 text-center">Loading ticket...</div>;
  if (!ticket) return <div className="p-8 text-center">Ticket not found.</div>;

  const statusColors: Record<TicketStatus, string> = {
    open: "bg-blue-50 text-blue-700 border-blue-100",
    in_progress: "bg-amber-50 text-amber-700 border-amber-100",
    completed: "bg-emerald-50 text-emerald-700 border-emerald-100",
    cancelled: "bg-gray-50 text-gray-700 border-gray-100",
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft size={18} />
        <span className="text-sm font-medium">Back to Board</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
            <div className="flex justify-between items-start mb-6">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-gray-900">Issue Description</h1>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${statusColors[ticket.status]}`}>
                    {ticket.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-400 font-mono text-sm">
                  <Hash size={14} />
                  <span>{ticket.code}</span>
                </div>
              </div>
            </div>

            <p className="text-gray-700 leading-relaxed text-lg">
              {ticket.description}
            </p>

            <div className="mt-8 pt-8 border-t border-gray-50 grid grid-cols-2 gap-6">
              <div>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Reported By</span>
                <div className="flex items-center gap-3 mt-2">
                  <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                    <User size={16} />
                  </div>
                  <div className="text-sm">
                    <p className="font-semibold text-gray-900">{ticket.creator.name}</p>
                    <p className="text-gray-500">{ticket.creator.email}</p>
                  </div>
                </div>
              </div>
              <div>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Location</span>
                <div className="flex items-center gap-3 mt-2">
                  <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                    <Building2 size={16} />
                  </div>
                  <div className="text-sm">
                    <p className="font-semibold text-gray-900">{ticket.property.name}</p>
                    <p className="text-gray-500">Unit: {ticket.unitNumber || "Common Area"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Timeline (Placeholder) */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
              <MessageSquare size={18} className="text-indigo-500" />
              Activity Log
            </h3>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="mt-1"><CheckCircle2 size={16} className="text-blue-500" /></div>
                <div>
                  <p className="text-sm text-gray-900 font-medium">Ticket Created</p>
                  <p className="text-xs text-gray-500">{new Date(ticket.createdAt).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Controls */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4">Assignment</h3>
            
            {ticket.assignee ? (
              <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 mb-4">
                <p className="text-xs text-indigo-600 font-bold uppercase mb-2">Current Assignee</p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
                    {ticket.assignee.name.charAt(0)}
                  </div>
                  <div className="text-sm">
                    <p className="font-bold text-indigo-900">{ticket.assignee.name}</p>
                    <p className="text-indigo-700/70 text-xs">Assigned {ticket.assignedAt ? new Date(ticket.assignedAt).toLocaleDateString() : ''}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 border-dashed mb-4 text-center">
                <p className="text-sm text-slate-500">Unassigned</p>
              </div>
            )}

            <div className="space-y-3">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Reassign To</label>
              <select className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20">
                <option>Select Staff Member...</option>
                {propertyStaff.map(s => (
                  <option key={s.user.id} value={s.user.id}>
                    {s.user.name} ({s.role})
                  </option>
                ))}
              </select>
              <Button className="w-full">Update Assignment</Button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-gray-900 mb-2">Quick Actions</h3>
            <Button variant="outline" className="w-full justify-start gap-2">
              <Clock size={16} /> Mark In Progress
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2 text-emerald-600 hover:bg-emerald-50 border-emerald-100">
              <CheckCircle2 size={16} /> Mark Completed
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2 text-red-600 hover:bg-red-50 border-red-100">
              <AlertTriangle size={16} /> Cancel Ticket
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};