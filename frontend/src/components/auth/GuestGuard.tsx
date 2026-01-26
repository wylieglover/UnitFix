import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export const GuestGuard = () => {
  const { isAuthenticated, organizationId, userType, loading } = useAuth();

  // Show nothing while we determine the auth state to prevent flickering
  if (loading) return null;

  if (isAuthenticated && organizationId) {
    // Determine the default redirect path based on user type
    let path = `/organizations/${organizationId}/dashboard`;
    
    if (userType === 'tenant') {
      path = `/organizations/${organizationId}/tickets`;
    } else if (userType === 'staff') {
      path = `/organizations/${organizationId}/properties`;
    }

    return <Navigate to={path} replace />;
  }

  // If not authenticated, render the child routes (SignIn/SignUp)
  return <Outlet />;
};