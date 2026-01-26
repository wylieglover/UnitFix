// src/features/staff/components/UpdateStaffModal.tsx
import { useState } from "react";
import { Modal } from "../../../components/ui/Modal";
import { Button } from "../../../components/ui/Button";
import { ShieldCheck, UserCog, Info } from "lucide-react";
// Import MaintenanceRole to fix the type mismatch
import type { Staff, MaintenanceRole } from "../types/staff.types";

interface UpdateStaffModalProps {
  staff: Staff;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedStaff: Staff) => void;
  // Use MaintenanceRole instead of string
  onUpdate: (data: { role: MaintenanceRole }) => Promise<any>;
}

export const UpdateStaffModal = ({ 
  staff, 
  isOpen, 
  onClose, 
  onSuccess, 
  onUpdate 
}: UpdateStaffModalProps) => {
  // Explicitly type the state as MaintenanceRole
  const [role, setRole] = useState<MaintenanceRole>(staff.role);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Now 'role' is guaranteed to be "manager" | "member"
      const res = await onUpdate({ role });
      onSuccess(res.staff);
      onClose();
    } catch (err) {
      console.error("Failed to update staff:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal 
      title="Update Staff Member" 
      isOpen={isOpen} 
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-3">
            System Role
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setRole("manager")}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                role === "manager"
                  ? "border-indigo-600 bg-indigo-50/50"
                  : "border-gray-100 hover:border-gray-200"
              }`}
            >
              <ShieldCheck className={role === "manager" ? "text-indigo-600" : "text-gray-400"} size={24} />
              <div className="mt-2 font-bold text-gray-900">Manager</div>
              <div className="text-xs text-gray-500 leading-tight mt-1">Full access to property & staff management.</div>
            </button>

            <button
              type="button"
              onClick={() => setRole("member")}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                role === "member"
                  ? "border-indigo-600 bg-indigo-50/50"
                  : "border-gray-100 hover:border-gray-200"
              }`}
            >
              <UserCog className={role === "member" ? "text-indigo-600" : "text-gray-400"} size={24} />
              <div className="mt-2 font-bold text-gray-900">Member</div>
              <div className="text-xs text-gray-500 leading-tight mt-1">Can view and update assigned tickets only.</div>
            </button>
          </div>
        </div>

        <div className="bg-blue-50 rounded-xl p-4 flex gap-3">
          <Info size={18} className="text-blue-600 shrink-0" />
          <p className="text-xs text-blue-800 leading-relaxed">
            Changing <strong>{staff.user.name}</strong>'s role will immediately update their permissions for the <strong>{staff.property.name}</strong> dashboard.
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t">
          <Button variant="outline" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" type="submit" loading={loading}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};