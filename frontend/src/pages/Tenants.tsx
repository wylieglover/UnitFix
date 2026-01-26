// src/pages/Tenants.tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { tenantService } from "../features/tenants/services/tenantService";
import { Table } from "../components/ui/Table";
import { FilterBar } from "../components/ui/FilterBar";
import { StatusBadge } from "../components/ui/StatusBadge";
import { Button } from "../components/ui/Button";
import { InviteTenantModal } from "../features/tenants/components/InviteTenantModal";
import { UserCircle, UserPlus } from "lucide-react";
import type { Tenant } from "../features/tenants/types/tenant.types";

type ArchiveFilter = 'all' | 'active' | 'archived';

export const Tenants = () => {
  const { organizationId } = useParams<{ organizationId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [archiveFilter, setArchiveFilter] = useState<ArchiveFilter>('active');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const canInvite = user?.userType === "org_admin" || user?.userType === "org_owner";

  const loadTenants = async () => {
    if (!organizationId) return;
    setLoading(true);
    try {
      const data = await tenantService.list(organizationId, undefined, { 
        status: archiveFilter 
      });
      setTenants(data.tenants);
    } catch (err) {
      console.error("Error loading global tenants", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTenants();
  }, [organizationId, archiveFilter]);

  const filteredTenants = tenants.filter(t => {
    const matchesSearch = 
      t.user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.unitNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.property?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const dropdownFilters = [
    {
      label: "Archive",
      value: archiveFilter,
      options: [
        { value: 'all', label: 'All' },
        { value: 'active', label: 'Active' },
        { value: 'archived', label: 'Archived' },
      ],
      onChange: (val: string) => setArchiveFilter(val as ArchiveFilter)
    }
  ];

  const columns = [
    {
      key: "user",
      header: "Tenant",
      render: (t: Tenant) => (
        <div className="flex items-center gap-3">
          <div className={`h-9 w-9 rounded-full flex items-center justify-center font-bold border shadow-sm transition-colors ${
            t.archivedAt 
              ? 'bg-gray-100 text-gray-400 border-gray-200' 
              : 'bg-indigo-50 text-indigo-700 border-indigo-100'
          }`}>
            {t.user.name?.charAt(0) || <UserCircle size={20} />}
          </div>
          <div>
            <div className={`font-semibold ${t.archivedAt ? 'text-gray-400' : 'text-gray-900'}`}>
              {t.user.name || "Invite Pending"}
            </div>
            <div className="text-xs text-gray-500">{t.user.email}</div>
          </div>
        </div>
      )
    },
    {
      key: "location",
      header: "Location",
      render: (t: Tenant) => (
        <div>
          <div className={`text-sm font-medium ${t.archivedAt ? 'text-gray-400' : 'text-gray-900'}`}>
            {t.property?.name || "N/A"}
          </div>
          <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">
            Unit: {t.unitNumber || "N/A"}
          </div>
        </div>
      )
    },
    {
      key: "status",
      header: "Status",
      render: (t: Tenant) => {
        if (t.archivedAt) {
          return <StatusBadge type="availability" value="archived" />;
        }
        
        return (
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
            !t.user.name 
              ? "bg-amber-50 text-amber-700 border-amber-100" 
              : "bg-emerald-50 text-emerald-700 border-emerald-100"
          }`}>
            {!t.user.name ? "Pending" : "Active"}
          </span>
        );
      }
    }
  ];

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Tenant Directory</h1>
          <p className="text-gray-500">Managing {tenants.length} tenants across the organization.</p>
        </div>
        
        {canInvite && (
          <Button 
            onClick={() => setIsInviteModalOpen(true)}
            variant="primary"
            className="flex items-center gap-2 shadow-md"
          >
            <UserPlus size={18} />
            Invite Tenant
          </Button>
        )}
      </div>

      {/* FilterBar */}
      <FilterBar
        dropdowns={dropdownFilters}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search by name, email, unit, or property..."
        resultsCount={filteredTenants.length}
        variant="blue"
      />

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <Table
          data={filteredTenants}
          columns={columns}
          loading={loading}
          rowClassName={(t: Tenant) => t.archivedAt ? 'opacity-60 bg-gray-50/30' : ''}
          rowKey="userId"
          onRowClick={(t) => {
            if (t.property?.id) {
              navigate(`/organizations/${organizationId}/properties/${t.property.id}/tenants/${t.userId}`);
            }
          }}
          emptyState={{
            title: searchTerm || archiveFilter !== 'active' ? "No tenants match your search" : "No tenants found",
            description: "Start by inviting new tenants to your properties.",
            icon: <UserCircle className="h-12 w-12 text-gray-200" />
          }}
        />
      </div>

      {isInviteModalOpen && canInvite && organizationId && (
        <InviteTenantModal
          isOpen={isInviteModalOpen}
          organizationId={organizationId}
          onClose={() => setIsInviteModalOpen(false)}
          onSuccess={() => {
            loadTenants();
            setIsInviteModalOpen(false);
          }}
        />
      )}
    </div>
  );
};