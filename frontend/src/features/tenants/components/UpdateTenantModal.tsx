// src/features/tenants/components/UpdateTenantModal.tsx
import { useState } from "react";
import { Modal } from "../../../components/ui/Modal";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import type { Tenant, UpdateTenantPayload } from "../types/tenant.types";

interface UpdateTenantModalProps {
  tenant: Tenant;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedTenant: Tenant) => void;
  onUpdate: (data: UpdateTenantPayload) => Promise<{ tenant: Tenant }>;
}

export const UpdateTenantModal = ({
  tenant,
  isOpen,
  onClose,
  onSuccess,
  onUpdate,
}: UpdateTenantModalProps) => {
  const [unitNumber, setUnitNumber] = useState(tenant.unitNumber || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate that something changed
    if (unitNumber === (tenant.unitNumber || "")) {
      setError("No changes detected");
      return;
    }

    // Validate unit number is not empty
    if (!unitNumber.trim()) {
      setError("Unit number is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await onUpdate({ unitNumber: unitNumber.trim() });
      onSuccess(response.tenant);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to update tenant");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Tenant">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          {/* Display tenant info */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Tenant Name</span>
                <span className="font-medium text-gray-900">
                  {tenant.user.name || "Invite Pending"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Email</span>
                <span className="font-medium text-gray-900">{tenant.user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Property</span>
                <span className="font-medium text-gray-900">
                  {tenant.property?.name || "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* Unit Number Input */}
          <Input
            label="Unit Number"
            value={unitNumber}
            onChange={(e) => {
              setUnitNumber(e.target.value);
              setError("");
            }}
            placeholder="e.g., 302, A-5, etc."
            error={error}
            required
          />
        </div>

        <div className="flex gap-3">
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            disabled={loading}
            className="flex-1"
          >
            Save Changes
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
};