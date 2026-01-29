import { useState, useEffect, useMemo } from "react";
import { Modal } from "../../../components/ui/Modal";
import { Button } from "../../../components/ui/Button";
import { Table } from "../../../components/ui/Table";
import { SearchInput } from "../../../components/ui/SearchInput";
import { ticketService } from "../services/ticketService";
import { tenantService } from "../../tenants/services/tenantService";
import { api } from "../../../api/api";
import { 
  Building2, 
  ArrowRight, 
  Loader2,
  AlertCircle,
  User
} from "lucide-react";
import type { TicketPriority } from "../types/ticket.types";
import type { Tenant } from "../../tenants/types/tenant.types";

interface Property {
  id: string;
  name: string;
}

interface CreateTicketModalProps {
  organizationId: string;
  propertyId?: string; // Optional - if not provided, show property selection
  isTenant?: boolean; // Is the user a tenant?
  tenantUserId?: string; // Tenant's userId (for fetching their info)
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateTicketModal = ({
  organizationId,
  propertyId: initialPropertyId,
  isTenant = false,
  tenantUserId,
  onClose,
  onSuccess
}: CreateTicketModalProps) => {
  const [formData, setFormData] = useState({
    propertyId: initialPropertyId || "",
    description: "",
    priority: "medium" as TicketPriority,
    unitNumber: "",
    tenantId: "",
  });

  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [searchProperty, setSearchProperty] = useState("");
  const [searchTenant, setSearchTenant] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [tenantInfo, setTenantInfo] = useState<Tenant | null>(null);

  // Load properties (only if not a tenant and no propertyId provided)
  useEffect(() => {
    const loadProperties = async () => {
      if (initialPropertyId || isTenant) {
        setFetchingData(false);
        return;
      }

      setFetchingData(true);
      try {
        const res = await api.get(`/organizations/${organizationId}/properties`);
        setProperties(res.data.properties || []);
      } catch (err) {
        console.error("Failed to load properties", err);
      } finally {
        setFetchingData(false);
      }
    };

    loadProperties();
  }, [organizationId, initialPropertyId, isTenant]);

  // Load tenants for selected property (only if not a tenant)
  useEffect(() => {
    const loadTenants = async () => {
      if (!formData.propertyId || isTenant) return;

      setFetchingData(true);
      try {
        const data = await tenantService.list(organizationId, formData.propertyId);
        setTenants(data.tenants || []);
      } catch (err) {
        console.error("Failed to load tenants", err);
      } finally {
        setFetchingData(false);
      }
    };

    loadTenants();
  }, [organizationId, formData.propertyId, isTenant]);

  // For tenants, auto-populate their info
  useEffect(() => {
    const loadTenantInfo = async () => {
      if (!isTenant || !tenantUserId) return;

      setFetchingData(true);
      try {
        const res = await api.get(`/organizations/${organizationId}/tenants/${tenantUserId}`);
        const tenant = res.data.tenant;
        
        setTenantInfo(tenant);
        setFormData(prev => ({
          ...prev,
          propertyId: tenant.property.id,
          unitNumber: tenant.unitNumber || "",
          tenantId: tenant.userId,
        }));
      } catch (err) {
        console.error("Failed to load tenant info", err);
      } finally {
        setFetchingData(false);
      }
    };

    loadTenantInfo();
  }, [isTenant, tenantUserId, organizationId]);

  const filteredProperties = useMemo(() => {
    return properties.filter(p =>
      p.name.toLowerCase().includes(searchProperty.toLowerCase())
    );
  }, [properties, searchProperty]);

  const filteredTenants = useMemo(() => {
    if (!searchTenant) return tenants;
    const search = searchTenant.toLowerCase();
    return tenants.filter(t =>
      t.unitNumber?.toLowerCase().includes(search) ||
      t.user.name?.toLowerCase().includes(search) ||
      t.user.email?.toLowerCase().includes(search)
    );
  }, [tenants, searchTenant]);

  const propertyColumns = [
    {
      key: 'name',
      header: 'Property Name',
      render: (p: Property) => (
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-gray-100 rounded-lg text-gray-500">
            <Building2 size={14} />
          </div>
          <span className="font-medium text-gray-900">{p.name}</span>
        </div>
      )
    },
    {
      key: 'action',
      header: '',
      className: 'w-10',
      render: () => <ArrowRight size={16} className="text-gray-300" />
    }
  ];
  
  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.propertyId) {
      newErrors.propertyId = "Property is required";
    }
    
    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    } else if (formData.description.length < 10) {
      newErrors.description = "Description must be at least 10 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);

    try {
      await ticketService.create(organizationId, formData.propertyId, {
        description: formData.description,
        unitNumber: formData.unitNumber || undefined,
        priority: formData.priority,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.error || "Failed to create ticket";
      setErrors({ submit: msg });
    } finally {
      setLoading(false);
    }
  };

  const selectedPropertyName = properties.find(p => p.id === formData.propertyId)?.name;

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Create Maintenance Request"
      size={!formData.propertyId && !isTenant ? "lg" : "md"}
    >
      <form onSubmit={handleSubmit} className="space-y-6 text-gray-900">
        {/* Step 1: Property Selection (only if not provided and not a tenant) */}
        {!initialPropertyId && !isTenant && (
          <div className="space-y-4 text-left">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-gray-700">
                {formData.propertyId ? 'Selected Property' : 'Step 1: Select Property'}
              </label>
              {formData.propertyId && (
                <button
                  type="button"
                  onClick={() => setFormData(p => ({ ...p, propertyId: "", unitNumber: "", tenantId: "" }))}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                >
                  Change Property
                </button>
              )}
            </div>

            {formData.propertyId ? (
              <div className="flex items-center gap-3 p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-sm">
                  <Building2 size={18} />
                </div>
                <div>
                  <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">Selected Property</p>
                  <p className="font-bold text-indigo-900 leading-tight">{selectedPropertyName}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <SearchInput
                  value={searchProperty}
                  onChange={setSearchProperty}
                  placeholder="Search for a property..."
                />
                <div className="max-h-[280px] overflow-hidden">
                  <Table<Property>
                    data={filteredProperties}
                    columns={propertyColumns}
                    rowKey="id"
                    loading={fetchingData}
                    onRowClick={(p) => setFormData(prev => ({ ...prev, propertyId: p.id }))}
                    emptyState={{
                      title: "No properties found",
                      description: "Try adjusting your search.",
                    }}
                  />
                </div>
              </div>
            )}
            {errors.propertyId && <p className="text-red-500 text-xs font-bold">{errors.propertyId}</p>}
          </div>
        )}

        {/* Tenant Info Display (for tenants only) */}
        {isTenant && tenantInfo && (
          <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl">
            <div className="p-2.5 bg-blue-600 rounded-xl text-white shadow-sm">
              <User size={18} />
            </div>
            <div>
              <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">Your Unit</p>
              <p className="font-bold text-blue-900 leading-tight">
                {tenantInfo.unitNumber ? `Unit ${tenantInfo.unitNumber}` : 'Common Area'}
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Ticket Form (only show when property is selected) */}
        {(formData.propertyId || initialPropertyId) && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-5">
            {!isTenant && !initialPropertyId && <hr className="border-gray-100" />}

            {/* Tenant/Unit Selection (only for non-tenants) */}
            {!isTenant && (
              <div className="space-y-3 text-left">
                <label className="block text-sm font-semibold text-gray-700">
                  Tenant / Unit <span className="text-gray-400">(optional)</span>
                </label>
                <SearchInput
                  value={searchTenant}
                  onChange={setSearchTenant}
                  placeholder="Search tenant or leave blank for common area..."
                />
                <div className="max-h-40 overflow-y-auto border border-gray-100 rounded-xl divide-y bg-gray-50/30">
                  {fetchingData ? (
                    <div className="p-8 flex flex-col items-center gap-2 text-gray-400">
                      <Loader2 className="animate-spin" size={20} />
                      <span className="text-xs font-medium">Loading Tenants...</span>
                    </div>
                  ) : filteredTenants.length > 0 ? (
                    filteredTenants.map((t) => (
                      <button
                        key={t.userId}
                        type="button"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            unitNumber: t.unitNumber || "",
                            tenantId: t.userId,
                          });
                          setSearchTenant("");
                        }}
                        className="w-full p-3 flex items-center justify-between transition-colors hover:bg-white"
                      >
                        <div className="flex items-center gap-3">
                          <User size={16} className="text-gray-400" />
                          <div className="text-left">
                            <p className="text-sm font-bold text-gray-900">{t.user.name || 'Pending'}</p>
                            <p className="text-xs text-gray-500">
                              {t.unitNumber ? `Unit ${t.unitNumber}` : 'No Unit'} • {t.user.email}
                            </p>
                          </div>
                        </div>
                        <ArrowRight size={16} className="text-gray-300" />
                      </button>
                    ))
                  ) : (
                    <div className="p-8 text-center text-gray-400 text-xs italic">
                      No tenants found
                    </div>
                  )}
                </div>
                {formData.unitNumber && (
                  <div className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3">
                    Selected: <span className="font-bold">Unit {formData.unitNumber}</span>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, unitNumber: "", tenantId: "" })}
                      className="ml-2 text-indigo-600 hover:text-indigo-700 font-bold"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Priority */}
            <div className="text-left">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Priority</label>
              <div className="grid grid-cols-2 gap-3">
                {(['low', 'medium', 'high', 'urgent'] as TicketPriority[]).map((priority) => (
                  <button
                    key={priority}
                    type="button"
                    onClick={() => setFormData({ ...formData, priority })}
                    className={`py-3 px-4 rounded-xl border-2 text-xs font-bold transition-all ${
                      formData.priority === priority
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200'
                    }`}
                  >
                    {priority.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="text-left">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Issue Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                rows={4}
                className={`w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none ${
                  errors.description ? 'border-red-500' : 'border-gray-200'
                }`}
                placeholder="Describe the maintenance issue..."
              />
              {errors.description && (
                <p className="text-red-500 text-xs font-medium mt-1">{errors.description}</p>
              )}
            </div>

            {/* Error Message */}
            {errors.submit && (
              <div className="rounded-md bg-red-50 p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm font-medium text-red-800">{errors.submit}</p>
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex flex-col gap-2 pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                disabled={!formData.description.trim()}
                className="w-full"
              >
                Create Request
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={loading}
                className="w-full text-gray-400"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
};