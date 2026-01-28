// src/pages/InviteAccept.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { inviteService } from '../features/invites/services/inviteService';
import type { InviteDetailsResponse } from '../features/invites/types/invite.types';

export const InviteAccept = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [invite, setInvite] = useState<InviteDetailsResponse['invite'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    password: '',
    phone: '',
    unitNumber: '',
  });

  // Fetch invite details
  useEffect(() => {
    const fetchInvite = async () => {
      if (!token) {
        setError('Invalid invite link');
        setLoading(false);
        return;
      }

      try {
        const response = await inviteService.getDetails(token);
        setInvite(response.invite);
        
        // Pre-fill unit number if provided
        if (response.invite.unitNumber) {
          setFormData(prev => ({ ...prev, unitNumber: response.invite.unitNumber || '' }));
        }
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load invite');
      } finally {
        setLoading(false);
      }
    };

    fetchInvite();
  }, [token]);

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = () => {
      const accessToken = localStorage.getItem('accessToken');
      if (accessToken && invite) {
        setWarning('You are currently logged in. If this invite is for a different account, please log out first.');
      }
    };
    
    if (invite) {
      checkAuth();
    }
  }, [invite]);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    setWarning(null);
    window.location.reload(); // Refresh to clear any cached state
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !invite) return;

    setSubmitting(true);
    setError(null);

    try {
      // Build payload - only include fields that have values
      const payload: any = {};
      
      if (formData.name.trim()) payload.name = formData.name.trim();
      if (formData.password) payload.password = formData.password;
      if (formData.phone.trim()) payload.phone = formData.phone.trim();
      if (invite.role === 'tenant' && formData.unitNumber.trim()) {
        payload.unitNumber = formData.unitNumber.trim();
      }

      const response = await inviteService.accept(token, payload);

      // Save token
      localStorage.setItem('accessToken', response.accessToken);

      // Redirect based on role
      if (response.organization) {
        const orgId = response.organization.id;
        
        switch (response.user.userType) {
          case 'org_admin':
          case 'org_owner':
            navigate(`/organizations/${orgId}/dashboard`);
            break;
          
          case 'staff':
            navigate(`/organizations/${orgId}/properties`);
            break;
          
          case 'tenant':
            navigate(`/organizations/${orgId}/tickets`);
            break;
          
          default:
            navigate('/');
        }
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to accept invite');
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading invite...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !invite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="mt-4 text-2xl font-bold text-gray-900">Invalid Invite</h2>
            <p className="mt-2 text-gray-600">{error}</p>
            <Link 
              to="/signin" 
              className="mt-4 inline-block text-blue-600 hover:text-blue-500 font-medium"
            >
              Go to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!invite) return null;

  // Get role-specific content
  const getRoleContent = () => {
    switch (invite.role) {
      case 'org_admin':
        return {
          title: 'Join as Organization Admin',
          description: `You've been invited to manage ${invite.organization?.name || 'this organization'}`,
        };
      case 'staff':
        return {
          title: 'Join as Maintenance Staff',
          description: `You've been invited to ${invite.property?.name || 'this property'}`,
        };
      case 'tenant':
        return {
          title: 'Welcome to Your New Home',
          description: `You've been invited as a tenant at ${invite.property?.name || 'this property'}`,
        };
    }
  };

  const content = getRoleContent();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {content.title}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {content.description}
          </p>

          {/* Property/Org Info Card */}
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            {invite.organization && (
              <div className="text-sm">
                <p className="font-semibold text-blue-900">{invite.organization.name}</p>
              </div>
            )}
            {invite.property && (
              <div className="text-sm mt-2">
                <p className="font-medium text-blue-900">{invite.property.name}</p>
                <p className="text-blue-700">
                  {invite.property.street}, {invite.property.city}
                  {invite.property.state && `, ${invite.property.state}`} {invite.property.zip}
                </p>
              </div>
            )}
            {invite.email && (
              <p className="text-xs text-blue-600 mt-2">Invite sent to: {invite.email}</p>
            )}
          </div>

          {/* Warning Message - if user is already logged in */}
          {warning && (
            <div className="mt-4 rounded-md bg-yellow-50 border border-yellow-200 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm text-yellow-800">{warning}</p>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="mt-2 text-sm font-medium text-yellow-800 hover:text-yellow-900 underline"
                  >
                    Log out now
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            {/* Name - Required for new users */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="John Doe"
              />
              <p className="mt-1 text-xs text-gray-500">
                Leave blank if you already have an account
              </p>
            </div>

            {/* Password - Required for new users */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="••••••••"
              />
              <p className="mt-1 text-xs text-gray-500">
                Must be 8+ characters with uppercase, lowercase, number, and special character
              </p>
            </div>

            {/* Phone - Optional */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone Number <span className="text-gray-400">(optional)</span>
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="+1 (555) 123-4567"
              />
            </div>

            {/* Unit Number - Only for tenants */}
            {invite.role === 'tenant' && (
              <div>
                <label htmlFor="unitNumber" className="block text-sm font-medium text-gray-700">
                  Unit Number
                </label>
                <input
                  id="unitNumber"
                  name="unitNumber"
                  type="text"
                  required
                  value={formData.unitNumber}
                  onChange={(e) => setFormData({ ...formData, unitNumber: e.target.value })}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Apt 101"
                />
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Accepting...' : 'Accept Invite'}
          </button>
        </form>
      </div>
    </div>
  );
};