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
import { ProfileHeader } from "../components/layout/profile/ProfileHeader";
import { ArchiveBanner } from "../components/ui/ArchiveBanner";
import { UpdateStaffModal } from "../features/staff/components/UpdateStaffModal";
import { AssignTicketModal } from "../features/staff/components/AssignTicketModal";
import {
  Mail,
  Building2,
  ShieldCheck,
  UserCog,
  AlertCircle,
  PlusCircle,
  ClipboardList,
} from "lucide-react";
import type { Staff } from "../features/staff/types/staff.types";
import type { Ticket } from "../features/tickets/types/ticket.types";

export const StaffDetail = () => {
  const { organizationId, propertyId, userId } = useParams<{
    organizationId: string;
    propertyId: string;
    userId: string;
  }>();

  const navigate = useNavigate();
  const { isOrgLevel, userType } = useAuth();

  const [staff, setStaff] = useState<Staff | null>(null);
  const [assignedTickets, setAssignedTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [ticketsLoading, setTicketsLoading] = useState(true);

  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  const canManageAssign = useMemo(() => {
    return isOrgLevel || userType === "staff";
  }, [isOrgLevel, userType]);

  const fetchStaff = useCallback(async () => {
    if (!organizationId || !propertyId || !userId) return;
    try {
      const data = await staffService.get(organizationId, propertyId, userId);
      setStaff(data.staff);
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
        status: "all",
      });
      setAssignedTickets(data.requests);
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
    const res = await staffService.update(organizationId, propertyId, userId, {
      archived: !staff.archivedAt,
    });
    setStaff(res.staff);
  };

  if (loading)
    return (
      <div className="p-12 text-center text-gray-400 animate-pulse">
        Loading staff profile...
      </div>
    );

  if (!staff)
    return (
      <div className="p-12 text-center text-red-500">
        Staff member not found.
      </div>
    );

  const isArchived = !!staff.archivedAt;

  const ticketColumns = [
    {
      key: "code",
      header: "ID",
      render: (t: Ticket) => (
        <span className="font-mono font-bold text-indigo-600">
          #{t.code}
        </span>
      ),
    },
    {
      key: "issue",
      header: "Issue",
      render: (t: Ticket) => (
        <div className="font-medium text-gray-900 truncate max-w-[200px]">
          {t.description}
        </div>
      ),
    },
    {
      key: "priority",
      header: "Priority",
      render: (t: Ticket) => (
        <StatusBadge type="priority" value={t.priority} />
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (t: Ticket) => (
        <StatusBadge type="ticket" value={t.status} />
      ),
    },
  ];

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <ArchiveBanner 
        isArchived={isArchived} 
        message="This staff member is archived and no longer has access." 
      />

      <ProfileHeader
        back={<BackButton label="Staff Directory" />}
        title={staff.user.name || "Invite Pending"}
        subtitle={
          <div className="flex items-center gap-2">
            {staff.role === "manager" ? (
              <ShieldCheck size={14} className="text-purple-600" />
            ) : (
              <UserCog size={14} className="text-blue-600" />
            )}
            <StatusBadge type="role" value={staff.role} />
            {isArchived && (
              <StatusBadge type="availability" value="archived" />
            )}
          </div>
        }
        avatar={{
          fallback: staff.user.name?.charAt(0),
          archived: isArchived,
        }}
        meta={[
          {
            icon: <Mail size={16} />,
            value: staff.user.email,
            span: "full"
          },
          {
            icon: <Building2 size={16} />,
            value: staff.property.name,
            span: "full"
          },
          {
            icon: <PlusCircle size={16} />,
            value: `Joined ${new Date(
              staff.createdAt
            ).toLocaleDateString()}`,
          },
        ]}
        actions={
          <>
            {canManageAssign && !isArchived && (
              <Button onClick={() => setIsAssignModalOpen(true)}>
                Assign to Ticket
              </Button>
            )}
            {isOrgLevel && (
              <>
                <Button
                  variant="outline"
                  disabled={isArchived}
                  onClick={() => setIsUpdateModalOpen(true)}
                >
                  Update Staff
                </Button>
                <ArchiveButton
                  isArchived={isArchived}
                  entityName="Staff Member"
                  onConfirm={handleToggleArchive}
                />
              </>
            )}
          </>
        }
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Table
            data={assignedTickets}
            columns={ticketColumns}
            loading={ticketsLoading}
            rowKey={(t) => t.code}
            onRowClick={(t) =>
              navigate(
                `/organizations/${organizationId}/properties/${propertyId}/tickets/${t.code}`
              )
            }
            emptyState={{
              title: "No tickets assigned",
              description:
                "This team member doesn't have any active tasks.",
              icon: <ClipboardList className="h-12 w-12 text-gray-200" />,
            }}
          />
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

      {isUpdateModalOpen && (
        <UpdateStaffModal
          staff={staff}
          isOpen
          onClose={() => setIsUpdateModalOpen(false)}
          onSuccess={(updated) => setStaff(updated)}
          onUpdate={(data) =>
            staffService.update(
              organizationId!,
              propertyId!,
              userId!,
              data
            )
          }
        />
      )}

      {isAssignModalOpen && (
        <AssignTicketModal
          isOpen
          staffId={userId!}
          organizationId={organizationId!}
          propertyId={propertyId!}
          onClose={() => setIsAssignModalOpen(false)}
          onSuccess={fetchAssignedTickets}
        />
      )}
    </div>
  );
};
