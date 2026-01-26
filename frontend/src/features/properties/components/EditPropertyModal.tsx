import { useState } from "react";
import { Modal } from "../../../components/ui/Modal"; // Import your Modal
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import type { Property, UpdatePropertyPayload } from "../types/property.types";

interface EditPropertyModalProps {
  property: Property;
  onClose: () => void;
  onSuccess: (updated: Property) => void;
  onUpdate: (data: UpdatePropertyPayload) => Promise<{ property: Property }>;
  isOpen: boolean; // Add isOpen prop
}

export const EditPropertyModal = ({ 
  property, 
  onClose, 
  onSuccess, 
  onUpdate,
  isOpen 
}: EditPropertyModalProps) => {
  const [formData, setFormData] = useState<UpdatePropertyPayload>({
    name: property.name,
    street: property.street,
    city: property.city,
    state: property.state,
    zip: property.zip,
    country: property.country || "USA",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof UpdatePropertyPayload, string>>>({});
  const [loading, setLoading] = useState(false);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof UpdatePropertyPayload]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof UpdatePropertyPayload, string>> = {};
    if (formData.name && formData.name.trim().length < 2) {
      newErrors.name = "Property name must be at least 2 characters";
    }
    if (!formData.street?.trim()) newErrors.street = "Street address is required";
    if (!formData.city?.trim()) newErrors.city = "City is required";
    if (formData.state && formData.state.trim().length !== 2) {
      newErrors.state = "State must be 2 characters (e.g., NY)";
    }
    if (!formData.zip?.trim()) {
      newErrors.zip = "ZIP code is required";
    } else if (!/^\d{5}(-\d{4})?$/.test(formData.zip.trim())) {
      newErrors.zip = "Invalid ZIP code format";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const response = await onUpdate(formData);
      onSuccess(response.property);
      onClose();
    } catch (err: any) {
      const backendMessage = err.response?.data?.error || "Failed to update property details.";
      setErrors(prev => ({ ...prev, name: backendMessage }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Edit Property" 
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-gray-600 text-sm -mt-2 mb-4">
          Update the location or name for <span className="font-semibold">{property.name}</span>.
        </p>

        <Input
          label="Property Name"
          name="name"
          value={formData.name}
          onChange={onChange}
          error={errors.name}
          required
        />

        <Input
          label="Street Address"
          name="street"
          value={formData.street}
          onChange={onChange}
          error={errors.street}
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="City"
            name="city"
            value={formData.city}
            onChange={onChange}
            error={errors.city}
            required
          />
          <Input
            label="State"
            name="state"
            value={formData.state}
            onChange={onChange}
            error={errors.state}
            maxLength={2}
            placeholder="NY"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="ZIP Code"
            name="zip"
            value={formData.zip}
            onChange={onChange}
            error={errors.zip}
            required
          />
          <Input
            label="Country"
            name="country"
            value={formData.country}
            onChange={onChange}
            error={errors.country}
            required
          />
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-6">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose} 
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="primary" 
            loading={loading}
          >
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};