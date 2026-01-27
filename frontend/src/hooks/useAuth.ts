import { useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import { authService } from '../features/auth/services/authService';

export type UserType = 'org_owner' | 'org_admin' | 'staff' | 'tenant';

interface TokenPayload {
  userId: string; // opaqueId (UUID)
  userType: UserType;
  organizationId?: string; // opaqueId (UUID)
  propertyId?: string; // opaqueId (UUID)
  exp: number;
}

export const useAuth = () => {
  const [user, setUser] = useState<TokenPayload | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
    setIsAuthenticated(false);
    window.location.href = '/signin';
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const decoded = jwtDecode<TokenPayload>(token);
          
          // Safety: Check if token is expired
          if (decoded.exp * 1000 < Date.now()) {
            await logout();
          } else {
            setUser(decoded);
            setIsAuthenticated(true);
          }
        } catch (e) {
          await logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [logout]);

  const isOrgLevel = user?.userType === 'org_owner' || user?.userType === 'org_admin';
  const isStaff = user?.userType === 'staff';
  const isTenant = user?.userType === 'tenant';

  return { 
    isAuthenticated, 
    user, 
    userId: user?.userId,
    organizationId: user?.organizationId, 
    propertyId: user?.propertyId,
    userType: user?.userType,
    isOrgLevel,
    isStaff,
    isTenant,
    loading, 
    logout 
  };
};