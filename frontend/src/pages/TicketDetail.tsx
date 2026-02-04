import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { ticketService } from "../features/tickets/services/ticketService";
import { staffService } from "../features/staff/services/staffService";
import { Button } from "../components/ui/Button";
import { BackButton } from "../components/ui/BackButton";
import { ArchiveButton } from "../components/ui/ArchiveButton";
import { TicketTimeline } from "../features/tickets/components/TicketTimeline";
import { StatusBadge } from "../components/ui/StatusBadge";
import { 
  Clock, 
  CheckCircle2, 
  User, 
  Building2, 
  Hash,
  AlertCircle,
  XCircle,
  Calendar,
  Circle,
  Zap
} from "lucide-react";
import type { Ticket, TicketStatus, TicketPriority } from "../features/tickets/types/ticket.types";
import type { Staff } from "../features/staff/types/staff.types";

export const TicketDetail = () => {
  const { organizationId, propertyId, ticketId } = useParams();
  const { user } = useAuth();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [propertyStaff, setPropertyStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [selectedPriority, setSelectedPriority] = useState<TicketPriority>("medium");

  // Permissions
  const canArchive = user?.userType === "org_admin" || user?.userType === "org_owner";
  const canManage = user?.userType === "org_admin" || user?.userType === "org_owner" || user?.userType === "staff";
  const isTenant = user?.userType === "tenant";

  const loadTicket = async () => {
    if (!organizationId || !propertyId || !ticketId) return;
    try {
      const ticketData = await ticketService.get(organizationId, propertyId, ticketId);
      setTicket(ticketData.request);
      // Set current assignee and priority
      if (ticketData.request.assignee) {
        setSelectedStaffId(ticketData.request.assignee.id);
      }
      setSelectedPriority(ticketData.request.priority);
    } catch (err) {
      console.error("Failed to load ticket details", err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      if (!organizationId || !propertyId || !ticketId) return;
      setLoading(true);
      try {
        const ticketData = await ticketService.get(organizationId, propertyId, ticketId);
        setTicket(ticketData.request);
        setSelectedPriority(ticketData.request.priority);
        
        // Only load staff if user can manage tickets
        if (canManage) {
          const staffData = await staffService.list(organizationId, propertyId, { status: 'active' });
          setPropertyStaff(staffData.staff);
          
          if (ticketData.request.assignee) {
            setSelectedStaffId(ticketData.request.assignee.id);
          }
        }
      } catch (err) {
        console.error("Failed to load ticket details", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [organizationId, propertyId, ticketId, canManage]);

  const handleArchiveToggle = async () => {
    if (!organizationId || !propertyId || !ticketId || !ticket) return;

    await ticketService.update(organizationId, propertyId, ticketId, {
      archived: !ticket.archivedAt,
    });
    
    await loadTicket();
  };

  const handleStatusChange = async (newStatus: TicketStatus) => {
    if (!organizationId || !propertyId || !ticketId || !ticket) return;

    setUpdating(true);
    try {
      await ticketService.update(organizationId, propertyId, ticketId, {
        status: newStatus,
      });
      await loadTicket();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to update ticket status");
    } finally {
      setUpdating(false);
    }
  };

  const handleAssignmentUpdate = async () => {
    if (!organizationId || !propertyId || !ticketId || !ticket) return;
    
    if (!selectedStaffId) {
      alert("Please select a staff member");
      return;
    }

    // Don't update if assignment hasn't changed
    if (selectedStaffId === ticket.assignee?.id) {
      return;
    }

    setUpdating(true);
    try {
      await ticketService.update(organizationId, propertyId, ticketId, {
        assignedTo: selectedStaffId,
      });
      await loadTicket();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to update assignment");
    } finally {
      setUpdating(false);
    }
  };

  const handlePriorityUpdate = async () => {
    if (!organizationId || !propertyId || !ticketId || !ticket) return;

    // Don't update if priority hasn't changed
    if (selectedPriority === ticket.priority) {
      return;
    }

    setUpdating(true);
    try {
      await ticketService.update(organizationId, propertyId, ticketId, {
        priority: selectedPriority,
      });
      await loadTicket();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to update priority");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-gray-400 animate-pulse">
        Loading ticket details...
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="p-12 text-center text-red-500">
        Ticket not found.
      </div>
    );
  }

  const isArchived = !!ticket.archivedAt;
  const canChangeStatus = !isArchived && ticket.status !== 'completed' && ticket.status !== 'cancelled';

  const priorityDescriptions: Record<TicketPriority, string> = {
    urgent: "Urgent priority - requires immediate attention from maintenance staff.",
    high: "High priority - should be addressed as soon as possible.",
    medium: "Medium priority - normal ticket timeline.",
    low: "Low priority - can be scheduled during routine maintenance.",
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Archive Warning */}
      {isArchived && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3 text-amber-800">
          <AlertCircle size={20} className="text-amber-600" />
          <div className="text-sm font-medium">
            This ticket is <strong>archived</strong> and has been removed from active views.
          </div>
        </div>
      )}

      {/* Ticket Header Card */}
      <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
        {/* Color bar indicator */}
        <div className={`absolute top-0 left-0 right-0 h-1 transition-colors duration-500 ${
          isArchived ? 'bg-amber-400' : 'bg-indigo-600'
        }`} />

        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="space-y-3">
              <BackButton 
                label="Ticket Board" 
                fallbackPath={`/organizations/${organizationId}/properties/${propertyId}/tickets`} 
              />
              
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 text-gray-400 font-mono text-sm">
                  <Hash size={16} />
                  <span className="font-bold">{ticket.code}</span>
                </div>
                <StatusBadge type="ticket" value={ticket.status} />
                <StatusBadge type="priority" value={ticket.priority} />
                {isArchived && <StatusBadge type="availability" value="archived" />}
              </div>

              <h1 className="text-2xl font-bold text-gray-900">
                {ticket.description}
              </h1>
            </div>

            <div className="flex flex-wrap gap-3">
              {canArchive && (
                <ArchiveButton 
                  isArchived={isArchived} 
                  entityName="Ticket" 
                  onConfirm={handleArchiveToggle} 
                />
              )}
            </div>
          </div>

          {/* Ticket Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-gray-50">
            <div>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
                Reported By
              </span>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 border border-slate-200">
                  <User size={16} />
                </div>
                <div className="text-sm min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{ticket.creator.name}</p>
                  <p className="text-gray-500 text-xs truncate">{ticket.creator.email}</p>
                </div>
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
                Location
              </span>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 border border-slate-200">
                  <Building2 size={16} />
                </div>
                <div className="text-sm min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{ticket.property.name}</p>
                  <p className="text-gray-500 text-xs truncate">
                    Unit: {ticket.unitNumber || "Common Area"}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
                Created
              </span>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 border border-slate-200">
                  <Calendar size={16} />
                </div>
                <div className="text-sm">
                  <p className="font-semibold text-gray-900">
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-gray-500 text-xs">
                    {new Date(ticket.createdAt).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Assignment Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4">Assignment</h3>
            
            {ticket.assignee ? (
              <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 mb-4">
                <p className="text-xs text-indigo-600 font-bold uppercase mb-2">Current Assignee</p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
                    {ticket.assignee.name?.charAt(0) || <User size={20} />}
                  </div>
                  <div className="text-sm">
                    <p className="font-bold text-indigo-900">{ticket.assignee.name}</p>
                    <p className="text-indigo-700/70 text-xs">
                      Assigned {ticket.assignedAt ? new Date(ticket.assignedAt).toLocaleDateString() : ''}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 border-dashed mb-4 text-center">
                <p className="text-sm text-slate-500">Unassigned</p>
              </div>
            )}

            {/* Only show assignment controls to staff/admin/owner */}
            {canManage && (
              <div className="space-y-3">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  {ticket.assignee ? "Reassign To" : "Assign To"}
                </label>
                <select 
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isArchived || updating}
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                >
                  <option value="" className="text-gray-500">Select Staff Member...</option>
                  {propertyStaff.map(s => (
                    <option key={s.user.id} value={s.user.id} className="text-gray-900">
                      {s.user.name} ({s.role})
                    </option>
                  ))}
                </select>
                <Button 
                  className="w-full" 
                  disabled={isArchived || updating || !selectedStaffId || selectedStaffId === ticket.assignee?.id}
                  loading={updating}
                  onClick={handleAssignmentUpdate}
                >
                  Update Assignment
                </Button>
              </div>
            )}
          </div>

          {ticket.comments && ticket.comments.length > 0 && (
            <TicketTimeline comments={ticket.comments} />
          )}
        </div>
        
        {/* Sidebar Actions - Only for staff/admin/owner */}
        <div className="space-y-6">
          {canManage && (
            <>
              {/* Priority Selector */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Zap size={18} className="text-indigo-600" />
                  <h3 className="font-bold text-gray-900">Priority Level</h3>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Change Priority
                  </label>
                  <select 
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isArchived || updating}
                    value={selectedPriority}
                    onChange={(e) => setSelectedPriority(e.target.value as TicketPriority)}
                  >
                    <option value="low" className="text-gray-900">Low Priority</option>
                    <option value="medium" className="text-gray-900">Medium Priority</option>
                    <option value="high" className="text-gray-900">High Priority</option>
                    <option value="urgent" className="text-gray-900">Urgent Priority</option>
                  </select>

                  <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                    <p className="text-indigo-800/80 text-xs leading-relaxed">
                      {priorityDescriptions[selectedPriority]}
                    </p>
                  </div>

                  <Button 
                    className="w-full" 
                    disabled={isArchived || updating || selectedPriority === ticket.priority}
                    loading={updating}
                    onClick={handlePriorityUpdate}
                  >
                    Update Priority
                  </Button>
                </div>
              </div>

              {/* Status Actions */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-3">
                <h3 className="font-bold text-gray-900 mb-2">Status Actions</h3>
                
                <Button 
                  variant="outline" 
                  className={`w-full justify-start gap-2 ${
                    ticket.status === 'open' 
                      ? 'opacity-50 cursor-not-allowed' 
                      : ''
                  }`}
                  disabled={isArchived || updating || ticket.status === 'open' || !canChangeStatus}
                  onClick={() => handleStatusChange('open')}
                >
                  <Circle size={16} /> Mark Open
                </Button>

                <Button 
                  variant="outline" 
                  className={`w-full justify-start gap-2 ${
                    ticket.status === 'in_progress'
                      ? 'opacity-50 cursor-not-allowed' 
                      : ''
                  }`}
                  disabled={isArchived || updating || ticket.status === 'in_progress' || !canChangeStatus}
                  onClick={() => handleStatusChange('in_progress')}
                >
                  <Clock size={16} /> Mark In Progress
                </Button>
                
                <Button 
                  variant="outline" 
                  className={`w-full justify-start gap-2 text-emerald-600 hover:bg-emerald-50 border-emerald-100 ${
                    ticket.status === 'completed' 
                      ? 'opacity-50 cursor-not-allowed' 
                      : ''
                  }`}
                  disabled={isArchived || updating || ticket.status === 'completed' || ticket.status === 'cancelled'}
                  onClick={() => handleStatusChange('completed')}
                >
                  <CheckCircle2 size={16} /> Mark Completed
                </Button>
                
                <Button 
                  variant="outline" 
                  className={`w-full justify-start gap-2 text-red-600 hover:bg-red-50 border-red-100 ${
                    ticket.status === 'cancelled' 
                      ? 'opacity-50 cursor-not-allowed' 
                      : ''
                  }`}
                  disabled={isArchived || updating || ticket.status === 'cancelled' || ticket.status === 'completed'}
                  onClick={() => handleStatusChange('cancelled')}
                >
                  <XCircle size={16} /> Cancel Ticket
                </Button>
              </div>
            </>
          )}

          {/* Tenant View - Just show priority info */}
          {isTenant && (
            <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100">
              <div className="flex items-center gap-2 text-indigo-900 font-bold mb-2 text-sm">
                <AlertCircle size={16} />
                <h4>Ticket Status</h4>
              </div>
              <p className="text-indigo-800/80 text-xs leading-relaxed mb-3">
                Your ticket is currently <strong>{ticket.status.replace('_', ' ')}</strong> with <strong>{ticket.priority}</strong> priority.
              </p>
              <p className="text-indigo-800/80 text-xs leading-relaxed">
                {ticket.assignee 
                  ? `This ticket has been assigned to ${ticket.assignee.name} from our maintenance team.`
                  : "This ticket is pending assignment to a maintenance team member."
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};