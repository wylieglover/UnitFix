// src/pages/PropertyDetail.tsx
import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ShieldCheck, 
  UserCog, 
  Building2, 
  MapPin, 
  Search,
  Archive,
  Plus
} from "lucide-react";

// Services & Hooks
import { propertyService } from "../features/properties/services/propertyService";
import { tenantService } from "../features/tenants/services/tenantService";
import { staffService } from "../features/staff/services/staffService";
import { ticketService } from "../features/tickets/services/ticketService";
import { useAuth } from "../hooks/useAuth";

// Components
import { Button } from "../components/ui/Button";
import { Table } from "../components/ui/Table";
import { FilterBar } from "../components/ui/FilterBar";
import { BackButton } from "../components/ui/BackButton";
import { ArchiveButton } from "../components/ui/ArchiveButton";
import { StatusBadge } from "../components/ui/StatusBadge";
import { EditPropertyModal } from "../features/properties/components/EditPropertyModal";
import { InviteTenantModal } from "../features/tenants/components/InviteTenantModal";
import { InviteStaffModal } from "../features/staff/components/InviteStaffModal";
import { CreateTicketModal } from "../features/tickets/components/CreateTicketModal";

// Types
import type { Property } from "../features/properties/types/property.types";
import type { Tenant } from "../features/tenants/types/tenant.types";
import type { Staff } from "../features/staff/types/staff.types";
import type { Ticket } from "../features/tickets/types/ticket.types";

type TabType = "tenants" | "tickets" | "staff";

export const PropertyDetail = () => {
  const { organizationId, propertyId } = useParams<{ organizationId: string; propertyId: string }>();
  const navigate = useNavigate();
  const { isOrgLevel } = useAuth();

  // --- UI State ---
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("tenants");

  // --- Filter State ---
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [archiveFilter, setArchiveFilter] = useState("active");
  const [roleFilter, setRoleFilter] = useState("all");

  // --- Resource State ---
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [resourceLoading, setResourceLoading] = useState(false);

  // --- Modal State ---
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isInviteTenantModalOpen, setIsInviteTenantModalOpen] = useState(false);
  const [isInviteStaffModalOpen, setIsInviteStaffModalOpen] = useState(false); 
  const [isCreateTicketModalOpen, setIsCreateTicketModalOpen] = useState(false);

  // --- Derived State ---
  const isArchived = !!property?.archivedAt;

  // --- Data Fetching ---
  const fetchProperty = useCallback(async () => {
    if (!organizationId || !propertyId) return;
    try {
      const res = await propertyService.get(organizationId, propertyId);
      setProperty(res.property);
    } catch (err) { 
      console.error(err); 
    } finally { 
      setLoading(false); 
    }
  }, [organizationId, propertyId]);

  const fetchTenants = useCallback(async () => {
    if (!organizationId || !propertyId) return;
    setResourceLoading(true);
    try {
      const data = await tenantService.list(organizationId, propertyId);
      setTenants(data.tenants);
    } finally { setResourceLoading(false); }
  }, [organizationId, propertyId]);

  const fetchStaff = useCallback(async () => {
    if (!organizationId || !propertyId) return;
    setResourceLoading(true);
    try {
      const data = await staffService.list(organizationId, propertyId);
      setStaff(data.staff);
    } finally { setResourceLoading(false); }
  }, [organizationId, propertyId]);

  const fetchTickets = useCallback(async () => {
    if (!organizationId || !propertyId) return;
    setResourceLoading(true);
    try {
      const data = await ticketService.list(organizationId, propertyId);
      setTickets(data.requests);
    } finally { setResourceLoading(false); }
  }, [organizationId, propertyId]);

  useEffect(() => { fetchProperty(); }, [fetchProperty]);
  
  useEffect(() => {
    setSearchTerm("");
    if (activeTab === "tenants") fetchTenants();
    if (activeTab === "staff") fetchStaff();
    if (activeTab === "tickets") fetchTickets();
  }, [activeTab, fetchTenants, fetchStaff, fetchTickets]);

  // --- Logic Handlers ---
  const handleToggleArchive = async () => {
    if (!organizationId || !propertyId || !property) return;
    try {
      const res = await propertyService.update(organizationId, propertyId, {
        archived: property.archivedAt === null
      });
      setProperty(res.property);
    } catch (err) {
      console.error("Failed to toggle archive status", err);
    }
  };

  // --- Filtering Logic ---
  const filteredData = useMemo(() => {
    if (activeTab === "tenants") {
      return tenants.filter(t => {
        const matchesSearch = (t.user.name || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
                             t.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             (t.unitNumber || "").toLowerCase().includes(searchTerm.toLowerCase());
        const matchesArchive = isOrgLevel 
          ? (archiveFilter === 'all' || (archiveFilter === 'active' && !t.archivedAt) || (archiveFilter === 'archived' && t.archivedAt))
          : !t.archivedAt;
        return matchesSearch && matchesArchive;
      });
    }

    if (activeTab === "staff") {
      return staff.filter(s => {
        const matchesSearch = (s.user.name || s.user.email).toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === "all" || s.role === roleFilter;
        const matchesArchive = isOrgLevel 
          ? (archiveFilter === 'all' || (archiveFilter === 'active' && !s.archivedAt) || (archiveFilter === 'archived' && s.archivedAt))
          : !s.archivedAt;
        return matchesSearch && matchesRole && matchesArchive;
      });
    }

    if (activeTab === "tickets") {
      return tickets.filter(t => {
        const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             t.code.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === "all" || t.status === statusFilter;
        const matchesPriority = priorityFilter === "all" || t.priority === priorityFilter;
        const matchesArchive = isOrgLevel 
          ? (archiveFilter === 'all' || (archiveFilter === 'active' && !t.archivedAt) || (archiveFilter === 'archived' && t.archivedAt))
          : !t.archivedAt;
        return matchesSearch && matchesStatus && matchesPriority && matchesArchive;
      });
    }
    return [];
  }, [activeTab, tenants, staff, tickets, searchTerm, statusFilter, priorityFilter, archiveFilter, roleFilter, isOrgLevel]);

  // --- Filter Bar Config ---
  const dropdowns = useMemo(() => {
    const configs: any[] = [];
    if (isOrgLevel) {
      configs.push({
        label: "Availability",
        value: archiveFilter,
        options: [
          { value: 'all', label: 'All' },
          { value: 'active', label: 'Active' },
          { value: 'archived', label: 'Archived' },
        ],
        onChange: (v: string) => setArchiveFilter(v)
      });
    }

    if (activeTab === "staff") {
      configs.push({
        label: "Role",
        value: roleFilter,
        options: [
          { value: 'all', label: 'All Roles' },
          { value: 'manager', label: 'Manager' },
          { value: 'member', label: 'Member' },
        ],
        onChange: (v: string) => setRoleFilter(v)
      });
    }

    if (activeTab === "tickets") {
      configs.push(
        {
          label: "Status",
          value: statusFilter,
          options: [
            { value: 'all', label: 'All Statuses' },
            { value: 'open', label: 'Open' },
            { value: 'in_progress', label: 'In Progress' },
            { value: 'completed', label: 'Completed' },
            { value: 'cancelled', label: 'Cancelled' },
          ],
          onChange: (v: string) => setStatusFilter(v)
        },
        {
          label: "Priority",
          value: priorityFilter,
          options: [
            { value: 'all', label: 'All Priorities' },
            { value: 'low', label: 'Low' },
            { value: 'medium', label: 'Medium' },
            { value: 'high', label: 'High' },
            { value: 'urgent', label: 'Urgent' },
          ],
          onChange: (v: string) => setPriorityFilter(v)
        }
      );
    }
    return configs;
  }, [activeTab, isOrgLevel, archiveFilter, roleFilter, statusFilter, priorityFilter]);

  // --- Table Columns ---
  const tenantColumns = [
    { key: "unit", header: "Unit", render: (t: Tenant) => <span className="font-bold text-gray-900">{t.unitNumber || "—"}</span> },
    { key: "resident", header: "Resident", render: (t: Tenant) => (
      <div>
        <div className="font-medium text-gray-900">{t.user.name || "Invite Pending"}</div>
        <div className="text-xs text-gray-500">{t.user.email}</div>
      </div>
    )},
    ...(isOrgLevel ? [{ 
      key: "availability", 
      header: "Availability", 
      render: (t: Tenant) => <StatusBadge type="availability" value={t.archivedAt ? "archived" : "active"} /> 
    }] : []),
  ];

  const staffColumns = [
    { 
      key: "member", 
      header: "Team Member", 
      render: (s: Staff) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-700 font-bold text-xs">
            {s.user.name?.charAt(0) || <UserCog size={14} />}
          </div>
          <div className="text-sm font-medium text-gray-900">{s.user.name || s.user.email}</div>
        </div>
      )
    },
    { 
      key: "role", 
      header: "Role", 
      render: (s: Staff) => (
        <div className="flex items-center gap-2">
          {s.role === 'manager' ? <ShieldCheck size={14} className="text-purple-600" /> : <UserCog size={14} className="text-blue-600" />}
          <StatusBadge type="role" value={s.role} />
        </div>
      )
    },
    ...(isOrgLevel ? [{ 
      key: "availability", 
      header: "Availability", 
      render: (s: Staff) => <StatusBadge type="availability" value={s.archivedAt ? "archived" : "active"} /> 
    }] : []),
  ];

  const ticketColumns = [
    { key: "code", header: "ID", render: (t: Ticket) => <span className="font-mono font-bold text-indigo-600">#{t.code}</span> },
    { key: "issue", header: "Issue", render: (t: Ticket) => (
      <div>
        <div className="font-medium text-gray-900 truncate max-w-[200px]">{t.description}</div>
        <div className="text-xs text-gray-500">Unit {t.unitNumber || "Common"}</div>
      </div>
    )},
    { key: "priority", header: "Priority", render: (t: Ticket) => <StatusBadge type="priority" value={t.priority} /> },
    { key: "status", header: "Status", render: (t: Ticket) => <StatusBadge type="ticket" value={t.status} /> },
    ...(isOrgLevel ? [{ 
      key: "availability", 
      header: "Availability", 
      render: (t: Ticket) => <StatusBadge type="availability" value={t.archivedAt ? "archived" : "active"} /> 
    }] : []),
  ];

  if (loading) return <div className="p-12 text-center text-gray-400 animate-pulse">Loading property...</div>;
  if (!property) return <div className="p-12 text-center text-red-500">Property not found.</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6 px-4 pb-12">
      {/* Archive Warning Banner */}
      {isArchived && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3 text-amber-800 animate-in fade-in slide-in-from-top-2">
          <Archive size={20} className="text-amber-600" />
          <div className="text-sm font-medium">This property is currently <strong>archived</strong>. Active management and invites are disabled.</div>
        </div>
      )}

      {/* Property Header */}
      <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
        {/* Color bar indicator */}
        <div className={`absolute top-0 left-0 right-0 h-1 transition-colors duration-500 ${isArchived ? 'bg-amber-400' : 'bg-indigo-600'}`} />

        <div className="flex gap-5 items-center">
          <div className={`h-16 w-16 rounded-2xl flex items-center justify-center text-white shadow-lg transition-colors duration-500 ${isArchived ? 'bg-gray-400' : 'bg-indigo-600 shadow-indigo-100'}`}>
            <Building2 size={32} />
          </div>
          <div className="space-y-1">
            <BackButton label="All Properties" fallbackPath={`/organizations/${organizationId}/properties`} />
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{property.name}</h1>
              {isArchived && <StatusBadge type="availability" value="archived" />}
            </div>
            <div className="flex items-center gap-1 text-gray-500 text-sm italic">
              <MapPin size={14} /> {property.street}, {property.city}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {isOrgLevel && (
            <>
              <ArchiveButton 
                isArchived={isArchived}
                entityName="Property"
                onConfirm={handleToggleArchive}
              />
              <Button variant="outline" onClick={() => setIsEditModalOpen(true)}>Edit Details</Button>
            </>
          )}
          {!isArchived && (
            <Button variant="primary" onClick={() => setIsCreateTicketModalOpen(true)}>
              <Plus size={18} className="mr-2" /> New Ticket
            </Button>
          )}
        </div>
      </div>

      {/* Tabs & Filtering Area */}
      <div className="space-y-4">
        <div className="border-b border-gray-200 flex justify-between items-center">
          <nav className="-mb-px flex space-x-8">
            {(["tenants", "tickets", "staff"] as TabType[]).map((tab) => (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab)} 
                className={`py-4 px-1 border-b-2 font-bold text-sm capitalize transition-all ${
                  activeTab === tab 
                    ? "border-indigo-600 text-indigo-600" 
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
          
          {!isArchived && (
            <div className="flex gap-2 mb-2">
              {activeTab === 'tenants' && isOrgLevel && (
                <Button size="sm" variant="outline" onClick={() => setIsInviteTenantModalOpen(true)}>+ Invite Tenant</Button>
              )}
              {activeTab === 'staff' && isOrgLevel && (
                <Button size="sm" variant="outline" onClick={() => setIsInviteStaffModalOpen(true)}>+ Invite Staff</Button>
              )}
              {activeTab === 'tickets' && (
                <Button size="sm" variant="outline" onClick={() => setIsCreateTicketModalOpen(true)}>
                  <Plus size={14} className="mr-1" /> New Ticket
                </Button>
              )}
            </div>
          )}
        </div>

        <FilterBar 
          searchValue={searchTerm} 
          onSearchChange={setSearchTerm} 
          searchPlaceholder={`Search ${activeTab}...`} 
          dropdowns={dropdowns} 
          resultsCount={filteredData.length} 
          variant="indigo" 
        />
      </div>

      {/* Resource Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
        <Table
          data={filteredData as any}
          columns={(activeTab === "tenants" ? tenantColumns : activeTab === "staff" ? staffColumns : ticketColumns) as any}
          loading={resourceLoading}
          rowKey={(item: any) => item.id || item.userId || item.user?.id || item.code}
          onRowClick={(item: any) => {
            const id = item.code || item.userId || item.user?.id;
            navigate(`/organizations/${organizationId}/properties/${propertyId}/${activeTab}/${id}`);
          }}
          emptyState={{ 
            title: `No ${activeTab} found`, 
            description: "Try adjusting your filters or search terms.", 
            icon: <Search className="h-12 w-12 text-gray-200" /> 
          }}
        />
      </div>

      {/* Modals */}
      {isCreateTicketModalOpen && <CreateTicketModal organizationId={organizationId!} propertyId={propertyId!} onClose={() => setIsCreateTicketModalOpen(false)} onSuccess={fetchTickets} />}
      {isEditModalOpen && <EditPropertyModal isOpen={isEditModalOpen} property={property} onClose={() => setIsEditModalOpen(false)} onSuccess={(updated) => setProperty(updated)} onUpdate={(data) => propertyService.update(organizationId!, propertyId!, data)} />}
      {isInviteTenantModalOpen && <InviteTenantModal isOpen={isInviteTenantModalOpen} organizationId={organizationId!} propertyId={propertyId!} onClose={() => setIsInviteTenantModalOpen(false)} onSuccess={fetchTenants} />}
      {isInviteStaffModalOpen && <InviteStaffModal organizationId={organizationId!} propertyId={propertyId!} onClose={() => setIsInviteStaffModalOpen(false)} onSuccess={fetchStaff} />}
    </div>
  );
};