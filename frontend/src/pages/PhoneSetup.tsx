// src/pages/PhoneSetup.tsx
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { organizationService } from '../features/organizations/services/organizationService';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Phone, CheckCircle } from 'lucide-react';

export const PhoneSetup = () => {
  const { organizationId } = useParams<{ organizationId: string }>();
  const navigate = useNavigate();
  const [areaCode, setAreaCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleProvision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationId) return;

    setLoading(true);
    setError('');

    try {
      await organizationService.provisionPhone(organizationId, { areaCode });
      setSuccess(true);
      
      // Force a full page reload to refresh the ProvisioningGuard
      setTimeout(() => {
        window.location.href = `/organizations/${organizationId}/dashboard`; // CHANGED: Use window.location instead of navigate
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to provision phone number');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="text-green-600" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Success!</h2>
          <p className="text-gray-600">
            Phone number provisioned successfully. Redirecting...
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Trial Number: {"+1 (888) 906-8142"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
        <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-6">
          <Phone className="text-indigo-600" size={32} />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
          Provision Phone Number
        </h2>
        
        <p className="text-gray-600 text-center mb-2">
          Choose your preferred area code to get started with SMS notifications.
        </p>
        
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-6">
          <p className="text-xs text-blue-800">
            <strong>Development Mode:</strong> Using trial number for testing. No charges will apply.
          </p>
        </div>

        <form onSubmit={handleProvision} className="space-y-6">
          <Input
            label="Area Code"
            type="text"
            placeholder="e.g., 415, 212, 305"
            value={areaCode}
            onChange={(e) => setAreaCode(e.target.value)}
            required
            maxLength={3}
            pattern="[0-9]{3}"
            error={error}
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            className="w-full"
          >
            Provision Number
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate(-1)}
            className="w-full text-gray-400"
          >
            Go Back
          </Button>
        </form>
      </div>
    </div>
  );
};