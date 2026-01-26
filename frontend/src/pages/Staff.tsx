// src/pages/Staff.tsx
import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { staffService } from "../features/staff/services/staffService";
import { useAuth } from "../hooks/useAuth";
import { Table } from "../components/ui/Table";
import { FilterBar } from "../components/ui/FilterBar";
import { StatusBadge } from "../components/ui/StatusBadge";
import { Button } from "../components/ui/Button";
import { InviteStaffModal } from "../features/staff/components/InviteStaffModal";
import { 
  Users, 
  ShieldCheck, 
  UserCog, 
  UserPlus, 
  SearchX 
} from "lucide-react";
import type { Staff as StaffType } from "../features/staff/types/staff.types";

type RoleFilter = 'all' | 'manager' | 'member';
type ArchiveFilter = 'all' | 'active' | 'archived';

export const Staff = () => {
  const { organizationId } = useParams<{ organizationId: string }>();
  const navigate = useNavigate();
  
  // Use userType as defined in your useAuth hook
  const { isOrgLevel, userType } = useAuth(); 
  
  // STRICT PERMISSION: Only org_owner and org_admin can invite new staff
  const canInvite = isOrgLevel && (userType === 'org_owner' || userType === 'org_admin');

  // --- State ---
  const [staffList, setStaffList] = useState<StaffType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [archiveFilter, setArchiveFilter] = useState<ArchiveFilter>('active');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  // --- Data Fetching ---
  const loadStaff = useCallback(async () => {
    if (!organizationId) return;
    setLoading(true);
    try {
      // status: 'all' ensures the backend sends archived records too
      const data = await staffService.list(organizationId, undefined, { status: 'all' });
      setStaffList(data.staff);
    } catch (err) {
      console.error("Error loading staff directory", err);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  // --- Filtering Logic ---
  const filteredStaff = useMemo(() => {
    return staffList.filter(s => {
      const matchesSearch = 
        s.user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.property.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = roleFilter === 'all' || s.role.toLowerCase() === roleFilter;
      
      // matchesArchive logic based on userType and selected filter
      const matchesArchive = isOrgLevel 
        ? (archiveFilter === 'all' || 
          (archiveFilter === 'active' && !s.archivedAt) || 
          (archiveFilter === 'archived' && s.archivedAt))
        : !s.archivedAt;
      
      return matchesSearch && matchesRole && matchesArchive;
    });
  }, [staffList, searchTerm, roleFilter, archiveFilter, isOrgLevel]);

  // --- Filter Bar Configuration ---
  const dropdownFilters = useMemo(() => {
    const filters: any[] = [
      {
        label: "Role",
        value: roleFilter,
        options: [
          { value: 'all', label: 'All Roles' },
          { value: 'manager', label: 'Managers' },
          { value: 'member', label: 'Members' },
        ],
        onChange: (val: string) => setRoleFilter(val as RoleFilter)
      }
    ];

    if (isOrgLevel) {
      filters.push({
        label: "Availability",
        value: archiveFilter,
        options: [
          { value: 'all', label: 'All' },
          { value: 'active', label: 'Active' },
          { value: 'archived', label: 'Archived' },
        ],
        onChange: (val: string) => setArchiveFilter(val as ArchiveFilter)
      });
    }

    return filters;
  }, [roleFilter, archiveFilter, isOrgLevel]);

  // --- Table Columns ---
  const columns = [
    {
      key: "user",
      header: "Team Member",
      render: (s: StaffType) => (
        <div className="flex items-center gap-3">
          <div className={`h-9 w-9 rounded-full flex items-center justify-center font-bold border shadow-sm transition-colors ${
            s.archivedAt ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-indigo-50 text-indigo-700 border-indigo-100'
          }`}>
            {s.user.name?.charAt(0) || <Users size={16} />}
          </div>
          <div>
            <div className={`font-semibold ${s.archivedAt ? 'text-gray-400' : 'text-gray-900'}`}>
              {s.user.name || "Invite Pending"}
            </div>
            <div className="text-xs text-gray-500">{s.user.email}</div>
          </div>
        </div>
      )
    },
    {
      key: "role",
      header: "Role",
      render: (s: StaffType) => (
        <div className="flex items-center gap-2">
          {s.role.toLowerCase() === 'manager' ? (
            <ShieldCheck size={14} className={s.archivedAt ? 'text-gray-400' : 'text-purple-600'} />
          ) : (
            <UserCog size={14} className={s.archivedAt ? 'text-gray-400' : 'text-blue-600'} />
          )}
          <StatusBadge type="role" value={s.role} />
        </div>
      )
    },
    {
      key: "property",
      header: "Assigned Property",
      render: (s: StaffType) => (
        <div className={`text-sm font-medium ${s.archivedAt ? 'text-gray-400' : 'text-gray-600'}`}>
          {s.property.name}
        </div>
      )
    },
    ...(isOrgLevel ? [{
      key: "availability",
      header: "Status",
      render: (s: StaffType) => (
        <StatusBadge type="availability" value={s.archivedAt ? "archived" : "active"} />
      )
    }] : []),
    {
      key: "joined",
      header: "Joined",
      render: (s: StaffType) => (
        <span className="text-xs text-gray-400 font-medium">
          {new Date(s.createdAt).toLocaleDateString()}
        </span>
      )
    }
  ];

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Staff Directory</h1>
          <p className="text-gray-500 font-medium">Manage and monitor maintenance teams across your organization.</p>
        </div>

        {canInvite && (
          <Button 
            variant="primary" 
            onClick={() => setIsInviteModalOpen(true)}
            className="shadow-indigo-100"
          >
            <UserPlus size={18} className="mr-2" />
            Invite Staff
          </Button>
        )}
      </div>

      <FilterBar
        dropdowns={dropdownFilters}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search by name, email, or property..."
        resultsCount={filteredStaff.length}
        variant="indigo"
      />

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <Table
          data={filteredStaff}
          columns={columns}
          loading={loading}
          rowClassName={(s: StaffType) => s.archivedAt ? 'opacity-60 bg-gray-50/30' : ''}
          rowKey={(s) => `${s.property.id}-${s.user.id}`}
          onRowClick={(s: StaffType) => {
            navigate(`/organizations/${organizationId}/properties/${s.property.id}/staff/${s.user.id}`);
          }}
          emptyState={{
            title: searchTerm || roleFilter !== 'all' || archiveFilter !== 'active' 
              ? "No team members found" 
              : "Staff Directory is empty",
            description: "Try adjusting your filters or invite your first staff member.",
            icon: <SearchX className="h-12 w-12 text-gray-200" />
          }}
        />
      </div>

      {isInviteModalOpen && (
        <InviteStaffModal 
          organizationId={organizationId!} 
          onClose={() => setIsInviteModalOpen(false)}
          onSuccess={loadStaff}
        />
      )}
    </div>
  );
};