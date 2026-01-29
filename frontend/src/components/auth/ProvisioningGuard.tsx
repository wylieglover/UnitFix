// src/components/auth/ProvisioningGuard.tsx
import { useEffect, useState } from 'react';
import { useNavigate, useParams, Outlet } from 'react-router-dom';
import { organizationService } from '../../features/organizations/services/organizationService';
import { Phone, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';

export const ProvisioningGuard = () => {
  const { organizationId } = useParams<{ organizationId: string }>();
  const navigate = useNavigate();
  const [hasPhone, setHasPhone] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [orgName, setOrgName] = useState('');

  useEffect(() => {
    const checkProvisioning = async () => {
      if (!organizationId) return;

      try {
        const res = await organizationService.getDetails(organizationId);
        setHasPhone(res.organization.hasPhone);
        setOrgName(res.organization.name);
      } catch (err) {
        console.error('Failed to check provisioning', err);
      } finally {
        setLoading(false);
      }
    };

    checkProvisioning();
  }, [organizationId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // If no phone provisioned, show setup page
  if (hasPhone === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
            <Phone className="text-indigo-600" size={32} />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Phone Setup Required
          </h2>
          
          <p className="text-gray-600 mb-6">
            {orgName} needs a phone number to enable SMS notifications, invite delivery, and maintenance request updates.
          </p>

          <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
            <p className="text-sm text-yellow-800 text-left">
              Only organization owners can provision phone numbers. Please contact your org owner to complete setup.
            </p>
          </div>

          <Button
            onClick={() => navigate(`/organizations/${organizationId}/setup/phone`)}
            variant="primary"
            size="lg"
            className="w-full"
          >
            Set Up Phone Number
          </Button>
        </div>
      </div>
    );
  }

  // If phone is provisioned, render child routes
  return <Outlet />;
};