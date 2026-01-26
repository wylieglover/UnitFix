// src/pages/StaffDetail.tsx
import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { staffService } from "../features/staff/services/staffService";
import { ticketService } from "../features/tickets/services/ticketService";
import { useAuth } from "../hooks/useAuth";
import { Button } from "../components/ui/Button";
import { Table } from "../components/ui/Table";
import { BackButton } from "../components/ui/BackButton";
import { ArchiveButton } from "../components/ui/ArchiveButton";
import { StatusBadge } from "../components/ui/StatusBadge";
import { UpdateStaffModal } from "../features/staff/components/UpdateStaffModal";
import { AssignTicketModal } from "../features/staff/components/AssignTicketModal";
import { 
  Mail, 
  Building2, 
  ShieldCheck, 
  UserCog, 
  AlertCircle,
  PlusCircle,
  ClipboardList
} from "lucide-react";
import type { Staff } from "../features/staff/types/staff.types";
import type { Ticket } from "../features/tickets/types/ticket.types";

export const StaffDetail = () => {
  const { organizationId, propertyId, userId } = useParams<{ 
    organizationId: string; 
    propertyId: string; 
    userId: string 
  }>();
  const navigate = useNavigate();
  
  const { isOrgLevel, userType } = useAuth();

  // --- State ---
  const [staff, setStaff] = useState<Staff | null>(null);
  const [assignedTickets, setAssignedTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  
  // --- Modals ---
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  // --- Permissions ---
  const canManageAssign = useMemo(() => {
  // If they are an Org Admin OR any type of Staff, let them assign
    return isOrgLevel || userType === "staff";
  }, [isOrgLevel, userType]);

  // --- Data Fetching ---
  const fetchStaff = useCallback(async () => {
    if (!organizationId || !propertyId || !userId) return;
    try {
      const data = await staffService.get(organizationId, propertyId, userId);
      setStaff(data.staff);
    } catch (err) {
      console.error("Failed to fetch staff details", err);
    } finally {
      setLoading(false);
    }
  }, [organizationId, propertyId, userId]);

  const fetchAssignedTickets = useCallback(async () => {
    if (!organizationId || !propertyId || !userId) return;
    setTicketsLoading(true);
    try {
      const data = await ticketService.list(organizationId, propertyId, { 
        assignedTo: userId,
        status: "all" 
      });
      
      setAssignedTickets(data.requests);
    } catch (err) {
      console.error("Failed to fetch assigned tickets", err);
    } finally {
      setTicketsLoading(false);
    }
  }, [organizationId, propertyId, userId]);

  useEffect(() => {
    fetchStaff();
    fetchAssignedTickets();
  }, [fetchStaff, fetchAssignedTickets]);

  const handleToggleArchive = async () => {
    if (!organizationId || !propertyId || !userId || !staff) return;
    try {
      const res = await staffService.update(organizationId, propertyId, userId, {
        archived: !staff.archivedAt
      });
      setStaff(res.staff);
    } catch (err) {
      console.error("Failed to toggle staff archive status", err);
    }
  };

  // --- Table Configuration ---
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
        <div className="font-medium text-gray-900 truncate max-w-[200px]">{t.description}</div>
      )
    },
    { 
      key: "priority", 
      header: "Priority", 
      render: (t: Ticket) => <StatusBadge type="priority" value={t.priority} /> 
    },
    { 
      key: "status", 
      header: "Status", 
      render: (t: Ticket) => <StatusBadge type="ticket" value={t.status} /> 
    },
  ];

  if (loading) return <div className="p-12 text-center text-gray-400 animate-pulse">Loading staff profile...</div>;
  if (!staff) return <div className="p-12 text-center text-red-500">Staff member not found.</div>;

  const isArchived = !!staff.archivedAt;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">

      {/* Archive Warning - Moved below header */}
      {isArchived && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3 text-amber-800">
          <AlertCircle size={20} className="text-amber-600" />
          <div className="text-sm font-medium">
            This staff member is currently <strong>archived</strong>. They can no longer access property dashboards.
          </div>
        </div>
      )}
      
      {/* Profile Header */}
      <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
        {/* Color bar indicator */}
        <div className={`absolute top-0 left-0 right-0 h-1 transition-colors duration-500 ${isArchived ? 'bg-amber-400' : 'bg-indigo-600'}`} />
        
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className={`h-24 w-24 flex-shrink-0 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg transition-colors duration-500 ${isArchived ? 'bg-gray-400' : 'bg-indigo-600 shadow-indigo-100'}`}>
            {staff.user.name?.charAt(0) || <UserCog size={32} />}
          </div>
          
          <div className="flex-1 min-w-0 space-y-3">
            <div className="space-y-1">
              <BackButton 
                label="Staff Directory" 
                fallbackPath={`/organizations/${organizationId}/properties/${propertyId}`} 
              />
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-bold text-gray-900">{staff.user.name || "Invite Pending"}</h1>
                {isArchived && <StatusBadge type="availability" value="archived" />}
              </div>
              <div className="flex items-center gap-2">
                {staff.role === 'manager' ? (
                  <ShieldCheck size={14} className="text-purple-600" />
                ) : (
                  <UserCog size={14} className="text-blue-600" />
                )}
                <StatusBadge type="role" value={staff.role} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6">
              <div className="flex items-center gap-3 text-gray-600 min-w-0">
                <Mail size={18} className="text-gray-400 flex-shrink-0" />
                <span className="text-sm truncate">{staff.user.email}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600 min-w-0">
                <Building2 size={18} className="text-gray-400 flex-shrink-0" />
                <span className="text-sm truncate">{staff.property.name}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <PlusCircle size={18} className="text-gray-400" />
                <span className="text-sm text-gray-500">Joined {new Date(staff.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {canManageAssign && !isArchived && (
              <Button variant="primary" size="md" onClick={() => setIsAssignModalOpen(true)}>
                Assign to Ticket
              </Button>
            )}
            {isOrgLevel && (
              <>
                <Button variant="outline" size="sm" disabled={isArchived} onClick={() => setIsUpdateModalOpen(true)}>
                  Update Staff
                </Button>
                <ArchiveButton 
                  isArchived={isArchived} 
                  entityName="Staff Member" 
                  onConfirm={handleToggleArchive} 
                />
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Assigned Tickets Table */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-900">Assigned Maintenance Tasks</h3>
              <div className="px-3 py-1 bg-gray-50 rounded-full text-xs font-bold text-gray-500">
                {assignedTickets.length} Total
              </div>
            </div>
            
            <Table
              data={assignedTickets}
              columns={ticketColumns}
              loading={ticketsLoading}
              rowKey={(t) => t.code}
              onRowClick={(t) => navigate(`/organizations/${organizationId}/properties/${propertyId}/tickets/${t.code}`)}
              emptyState={{ 
                title: "No tickets assigned", 
                description: "This team member doesn't have any active tasks.", 
                icon: <ClipboardList className="h-12 w-12 text-gray-200" /> 
              }}
            />
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100">
            <div className="flex items-center gap-2 text-indigo-900 font-bold mb-2 text-sm">
              <AlertCircle size={16} />
              <h4>Role Permissions</h4>
            </div>
            <p className="text-indigo-800/80 text-xs leading-relaxed">
              {staff.role === 'manager' 
                ? "As a Manager, this user can oversee property tickets, and manage property-level settings."
                : "As a Member, this user can oversee assigned tickets and update their status."
              }
            </p>
          </div>
        </div>
      </div>

      {/* Modals */}
      {isUpdateModalOpen && staff && (
        <UpdateStaffModal
          staff={staff}
          isOpen={isUpdateModalOpen}
          onClose={() => setIsUpdateModalOpen(false)}
          onSuccess={(updated) => setStaff(updated)}
          onUpdate={(data) => staffService.update(organizationId!, propertyId!, userId!, data)}
        />
      )}

      {isAssignModalOpen && (
        <AssignTicketModal
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          staffId={userId!}
          organizationId={organizationId!}
          propertyId={propertyId!}
          onSuccess={fetchAssignedTickets}
        />
      )}
    </div>
  );
};