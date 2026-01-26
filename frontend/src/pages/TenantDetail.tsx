import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { tenantService } from "../features/tenants/services/tenantService";
import { ticketService } from "../features/tickets/services/ticketService";
import { Button } from "../components/ui/Button";
import { BackButton } from "../components/ui/BackButton";
import { ArchiveButton } from "../components/ui/ArchiveButton";
import { StatusBadge } from "../components/ui/StatusBadge";
import { Table } from "../components/ui/Table";
import { UpdateTenantModal } from "../features/tenants/components/UpdateTenantModal";
import { 
  Building2, 
  Mail, 
  Phone, 
  Calendar,
  Edit3,
  User,
  AlertCircle,
  ClipboardList
} from "lucide-react";
import type { Tenant } from "../features/tenants/types/tenant.types";
import type { Ticket } from "../features/tickets/types/ticket.types";

export const TenantDetail = () => {
  const { organizationId, propertyId, userId } = useParams();
  const navigate = useNavigate();

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [tenantTickets, setTenantTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  const loadTenant = async () => {
    if (!organizationId || !propertyId || !userId) return;
    setLoading(true);
    try {
      const data = await tenantService.get(organizationId, propertyId, userId);
      setTenant(data.tenant);
    } catch (err) {
      console.error("Failed to load tenant details", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTenantTickets = useCallback(async () => {
    if (!organizationId || !propertyId || !userId) return;
    setTicketsLoading(true);
    try {
      const data = await ticketService.list(organizationId, propertyId, { 
        relatedTo: userId,
        status: "all" 
      });
      
      setTenantTickets(data.requests);
    } catch (err) {
      console.error("Failed to fetch tenant tickets", err);
    } finally {
      setTicketsLoading(false);
    }
  }, [organizationId, propertyId, userId]);

  useEffect(() => {
    loadTenant();
    fetchTenantTickets();
  }, [organizationId, propertyId, userId, fetchTenantTickets]);

  const handleArchiveToggle = async () => {
    if (!organizationId || !propertyId || !userId || !tenant) return;

    await tenantService.update(organizationId, propertyId, userId, {
      archived: !tenant.archivedAt,
    });
    
    await loadTenant();
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-gray-400 animate-pulse">
        Loading tenant profile...
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="p-12 text-center text-red-500">
        Tenant not found.
      </div>
    );
  }

  const isArchived = !!tenant.archivedAt;

  // Table Configuration
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
    }
  ];

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Archive Warning */}
      {isArchived && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3 text-amber-800">
          <AlertCircle size={20} className="text-amber-600" />
          <div className="text-sm font-medium">
            This tenant is currently <strong>archived</strong>. They can no longer access the property portal or submit maintenance requests.
          </div>
        </div>
      )}

      {/* Profile Header */}
      <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
        {/* Color bar indicator */}
        <div className={`absolute top-0 left-0 right-0 h-1 transition-colors duration-500 ${
          isArchived ? 'bg-amber-400' : 'bg-indigo-600'
        }`} />
        
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className={`h-24 w-24 flex-shrink-0 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg transition-colors duration-500 ${
            isArchived 
              ? 'bg-gray-400' 
              : 'bg-indigo-600 shadow-indigo-100'
          }`}>
            {tenant.user.name?.charAt(0) || <User size={32} />}
          </div>
          
          <div className="flex-1 min-w-0 space-y-3">
            <div className="space-y-1">
              <BackButton 
                label="Tenants" 
                fallbackPath={`/organizations/${organizationId}/properties/${propertyId}`} 
              />
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-bold text-gray-900">
                  {tenant.user.name || "Invite Pending"}
                </h1>
                {isArchived && <StatusBadge type="availability" value="archived" />}
              </div>
              {tenant.unitNumber && (
                <div className="flex items-center gap-2 text-gray-500">
                  <Building2 size={14} />
                  <span className="text-sm font-medium">Unit {tenant.unitNumber}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6">
              <div className="flex items-center gap-3 text-gray-600 min-w-0">
                <Mail size={18} className="text-gray-400 flex-shrink-0" />
                <span className="text-sm truncate">{tenant.user.email}</span>
              </div>
              {tenant.user.phone && (
                <div className="flex items-center gap-3 text-gray-600 min-w-0">
                  <Phone size={18} className="text-gray-400 flex-shrink-0" />
                  <span className="text-sm truncate">{tenant.user.phone}</span>
                </div>
              )}
              {tenant.property && (
                <div className="flex items-center gap-3 text-gray-600 min-w-0">
                  <Building2 size={18} className="text-gray-400 flex-shrink-0" />
                  <span className="text-sm truncate">{tenant.property.name}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-gray-600">
                <Calendar size={18} className="text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-500">
                  Joined {new Date(tenant.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              disabled={isArchived}
              onClick={() => setIsUpdateModalOpen(true)}
            >
              <Edit3 size={16} className="mr-2" />
              Edit Tenant
            </Button>
            <ArchiveButton 
              isArchived={isArchived} 
              entityName="Tenant" 
              onConfirm={handleArchiveToggle} 
            />
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Maintenance Requests Table */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-900">Maintenance Requests</h3>
              <div className="px-3 py-1 bg-gray-50 rounded-full text-xs font-bold text-gray-500">
                {tenantTickets.length} Total
              </div>
            </div>
            
            <Table
              data={tenantTickets}
              columns={ticketColumns}
              loading={ticketsLoading}
              rowKey={(t) => t.code}
              onRowClick={(t) => navigate(`/organizations/${organizationId}/properties/${propertyId}/tickets/${t.code}`)}
              emptyState={{ 
                title: "No maintenance requests", 
                description: "This tenant hasn't submitted any maintenance requests yet.", 
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
              <h4>Tenant Access</h4>
            </div>
            <p className="text-indigo-800/80 text-xs leading-relaxed">
              {isArchived 
                ? "This tenant's access has been revoked. They cannot log in or submit maintenance requests."
                : "This tenant can access the property portal to submit and track maintenance requests for their unit."
              }
            </p>
          </div>

          {tenant.unitNumber && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h4 className="font-bold text-gray-900 mb-3 text-sm">Unit Information</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Unit Number</span>
                  <span className="text-sm font-bold text-gray-900">{tenant.unitNumber}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Property</span>
                  <span className="text-sm font-medium text-gray-700">
                    {tenant.property?.name || "N/A"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Update Modal */}
      {isUpdateModalOpen && tenant && (
        <UpdateTenantModal
          tenant={tenant}
          isOpen={isUpdateModalOpen}
          onClose={() => setIsUpdateModalOpen(false)}
          onSuccess={(updatedTenant) => setTenant(updatedTenant)}
          onUpdate={(data) => tenantService.update(organizationId!, propertyId!, userId!, data)}
        />
      )}
    </div>
  );
};