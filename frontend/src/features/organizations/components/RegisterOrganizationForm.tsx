// src/features/organizations/components/RegisterOrganizationForm.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { organizationService } from "../services/organizationService";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";

export const RegisterOrganizationForm = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    organizationName: "",
    contactInfo: "",
    name: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); // This is crucial now that we're using a <form>
    setLoading(true);
    setError(null);

    try {
      const result = await organizationService.register(form);
      // After registration, the user is always the org_owner
      navigate(`/organizations/${result.organization.id}/dashboard`);
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto p-6 shadow-lg border-gray-100">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Organization</h2>

      {/* Wrapping in a form for accessibility and 'Enter' key support */}
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1">
          <Input 
            name="organizationName" 
            value={form.organizationName}
            onChange={onChange} 
            label="Organization Name"
            placeholder="Acme Properties" 
            required
          />
        </div>
        
        <Input 
          name="contactInfo" 
          value={form.contactInfo}
          onChange={onChange} 
          label="Contact Info (optional)"
          placeholder="(555) 123-4567" 
        />
        
        <div className="grid grid-cols-1 gap-4 pt-2 border-t border-gray-50 mt-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Owner Account</p>
          <Input 
            name="name" 
            value={form.name}
            onChange={onChange} 
            label="Your Name"
            placeholder="John Doe" 
            required
          />
          
          <Input 
            name="email" 
            type="email" 
            value={form.email}
            onChange={onChange} 
            label="Email"
            placeholder="john@acmeproperties.com" 
            required
          />
          
          <Input 
            name="password" 
            type="password" 
            value={form.password}
            onChange={onChange} 
            label="Password"
            placeholder="••••••••" 
            required
          />
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800 animate-in fade-in slide-in-from-top-1">
            {error}
          </div>
        )}

        <Button 
          type="submit" 
          disabled={loading}
          variant="primary"
          className="w-full mt-2"
        >
          {loading ? "Creating..." : "Register Organization"}
        </Button>
      </form>
    </Card>
  );
};