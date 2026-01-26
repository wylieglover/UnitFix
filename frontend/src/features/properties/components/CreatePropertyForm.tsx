// src/features/properties/components/CreatePropertyForm.tsx
import { useState } from "react";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { propertyService } from "../services/propertyService";
import type { CreatePropertyPayload } from "../types/property.types";

interface CreatePropertyFormProps {
  organizationId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const CreatePropertyForm = ({
  organizationId,
  onSuccess,
  onCancel,
}: CreatePropertyFormProps) => {
  const [form, setForm] = useState<CreatePropertyPayload>({
    name: "",
    street: "",
    city: "",
    state: "",
    zip: "",
    country: "USA",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof CreatePropertyPayload, string>>>({});
  const [loading, setLoading] = useState(false);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof CreatePropertyPayload]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof CreatePropertyPayload, string>> = {};

    if (form.name.trim().length < 2) {
      newErrors.name = "Property name must be at least 2 characters";
    }
    if (!form.street.trim()) {
      newErrors.street = "Street address is required";
    }
    if (!form.city.trim()) {
      newErrors.city = "City is required";
    }
    if (form.state && form.state.trim().length !== 2) {
      newErrors.state = "State must be 2 characters (e.g., NY)";
    }
    if (!form.zip.trim()) {
      newErrors.zip = "ZIP code is required";
    } else if (!/^\d{5}(-\d{4})?$/.test(form.zip.trim())) {
      newErrors.zip = "Invalid ZIP code format";
    }
    if (!form.country.trim()) {
      newErrors.country = "Country is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevents page reload on submit
    
    if (!validate()) return;
    setLoading(true);

    try {
      await propertyService.create(organizationId, form);
      onSuccess();
    } catch (err: any) {
      // Handle validation errors from backend
      const backendMessage = err.response?.data?.error || "Failed to create property";
      
      // If it's a generic error, we attach it to the 'name' field for visibility
      setErrors(prev => ({ 
        ...prev, 
        name: backendMessage 
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <Input
        name="name"
        value={form.name}
        onChange={onChange}
        label="Property Name"
        placeholder="Sunset Apartments"
        required
        error={errors.name}
      />

      <Input
        name="street"
        value={form.street}
        onChange={onChange}
        label="Street Address"
        placeholder="123 Main St"
        required
        error={errors.street}
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          name="city"
          value={form.city}
          onChange={onChange}
          label="City"
          placeholder="San Francisco"
          required
          error={errors.city}
        />

        <Input
          name="state"
          value={form.state}
          onChange={onChange}
          label="State"
          placeholder="CA"
          maxLength={2}
          error={errors.state}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          name="zip"
          value={form.zip}
          onChange={onChange}
          label="ZIP Code"
          placeholder="94102"
          required
          error={errors.zip}
        />

        <Input
          name="country"
          value={form.country}
          onChange={onChange}
          label="Country"
          placeholder="USA"
          required
          error={errors.country}
        />
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-6">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel} 
          disabled={loading}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          variant="primary" 
          disabled={loading}
        >
          {loading ? "Creating..." : "Create Property"}
        </Button>
      </div>
    </form>
  );
};