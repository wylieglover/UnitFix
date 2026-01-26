import { useState, useEffect, useMemo } from "react";
import { Modal } from "../../../components/ui/Modal";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { SearchInput } from "../../../components/ui/SearchInput";
import { ticketService } from "../services/ticketService";
import { tenantService } from "../../tenants/services/tenantService";
import type { TicketPriority } from "../types/ticket.types";
import type { Tenant } from "../../tenants/types/tenant.types";
import { ChevronDown, User, Loader2 } from "lucide-react";

interface CreateTicketModalProps {
  organizationId: string;
  propertyId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateTicketModal = ({ 
  organizationId,
  propertyId, 
  onClose, 
  onSuccess 
}: CreateTicketModalProps) => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loadingTenants, setLoadingTenants] = useState(true);
  const [tenantSearch, setTenantSearch] = useState("");
  const [showTenantDropdown, setShowTenantDropdown] = useState(false);
  
  const [formData, setFormData] = useState({
    description: "",
    unitNumber: "",
    priority: "medium" as TicketPriority,
    selectedTenantId: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTenants = async () => {
      try {
        const data = await tenantService.list(organizationId, propertyId);
        setTenants(data.tenants);
      } catch (err) {
        console.error("Failed to load tenants", err);
      } finally {
        setLoadingTenants(false);
      }
    };
    fetchTenants();
  }, [organizationId, propertyId]);

  const filteredTenants = useMemo(() => {
    if (!tenantSearch) return tenants;
    const search = tenantSearch.toLowerCase();
    return tenants.filter(t => 
      t.unitNumber?.toLowerCase().includes(search) ||
      t.user.name?.toLowerCase().includes(search) ||
      t.user.email?.toLowerCase().includes(search)
    );
  }, [tenants, tenantSearch]);

  const selectedTenant = tenants.find(t => t.userId === formData.selectedTenantId);

  const handleTenantSelect = (tenantId: string) => {
    if (tenantId === "") {
      setFormData({ ...formData, selectedTenantId: "", unitNumber: "" });
    } else {
      const tenant = tenants.find(t => t.userId === tenantId);
      setFormData({ 
        ...formData, 
        selectedTenantId: tenantId,
        unitNumber: tenant?.unitNumber || "" 
      });
    }
    setShowTenantDropdown(false);
    setTenantSearch("");
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
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
      await ticketService.create(organizationId, propertyId, {
        description: formData.description,
        unitNumber: formData.unitNumber || undefined,
        priority: formData.priority,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.error || "Failed to create ticket";
      setErrors({ description: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Create Maintenance Request">
      <div className="text-gray-900">
        <p className="text-gray-600 text-sm mb-6">
          Report a maintenance issue for this property. Staff will be notified.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Tenant/Unit Selection */}
          <div className="relative">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Unit / Resident
            </label>

            <button
              type="button"
              onClick={() => setShowTenantDropdown(!showTenantDropdown)}
              disabled={loadingTenants}
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-left flex items-center justify-between transition-all disabled:opacity-50"
            >
              <div className="flex items-center gap-2">
                {loadingTenants ? (
                  <Loader2 size={16} className="text-indigo-500 animate-spin" />
                ) : (
                  <User size={16} className="text-gray-400" />
                )}
                <span className="text-sm font-medium">
                  {selectedTenant 
                    ? `${selectedTenant.unitNumber ? `Unit ${selectedTenant.unitNumber}` : "No Unit"} - ${selectedTenant.user.name || selectedTenant.user.email}`
                    : "Common Area / Other"
                  }
                </span>
              </div>
              <ChevronDown size={16} className={`text-gray-400 transition-transform ${showTenantDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showTenantDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-64 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
                <div className="p-2 border-b border-gray-100">
                  <SearchInput
                    value={tenantSearch}
                    onChange={setTenantSearch}
                    placeholder="Search directory..."
                    variant="indigo"
                  />
                </div>

                <div className="overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => handleTenantSelect("")}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 text-sm transition-colors border-b border-gray-50 ${
                      !formData.selectedTenantId ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-gray-700'
                    }`}
                  >
                    Common Area / Other
                  </button>

                  {filteredTenants.length > 0 ? (
                    filteredTenants.map((tenant) => (
                      <button
                        key={tenant.userId}
                        type="button"
                        onClick={() => handleTenantSelect(tenant.userId)}
                        className={`w-full text-left px-4 py-3 hover:bg-gray-50 text-sm transition-colors ${
                          formData.selectedTenantId === tenant.userId ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-gray-700'
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="font-semibold">
                            {tenant.unitNumber ? `Unit ${tenant.unitNumber}` : "No Unit"}
                          </span>
                          <span className="text-xs text-gray-500">
                            {tenant.user.name || tenant.user.email}
                          </span>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-6 text-center text-gray-400 text-xs italic">
                      No matches found
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Manual Unit override if Common Area selected */}
          {!formData.selectedTenantId && (
            <Input
              label="Unit Number (Optional)"
              placeholder="e.g. Lobby, 101"
              value={formData.unitNumber}
              onChange={(e) => setFormData({ ...formData, unitNumber: e.target.value })}
              className="bg-white"
            />
          )}

          {/* Priority Select */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Priority</label>
            <div className="grid grid-cols-2 gap-2">
              {(['low', 'medium', 'high', 'urgent'] as TicketPriority[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setFormData({...formData, priority: p})}
                  className={`py-2 px-3 text-xs font-bold rounded-lg border-2 transition-all ${
                    formData.priority === p 
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                      : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200'
                  }`}
                >
                  {p.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What needs to be fixed?"
              rows={4}
              className={`w-full px-4 py-2.5 text-sm bg-white border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none ${
                errors.description ? 'border-red-500' : 'border-gray-200'
              }`}
            />
            {errors.description && <p className="text-red-500 text-[10px] mt-1 font-medium">{errors.description}</p>}
          </div>

          <div className="flex flex-col gap-2 pt-4">
            <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full">
              Create Request
            </Button>
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading} className="w-full text-gray-400">
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};