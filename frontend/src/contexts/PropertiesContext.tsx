// src/contexts/PropertiesContext.tsx
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { propertyService } from '../features/properties/services/propertyService';

interface Property {
  id: string;
  name: string;
}

interface PropertiesContextType {
  properties: Property[];
  loading: boolean;
  refresh: () => Promise<void>;
}

const PropertiesContext = createContext<PropertiesContextType | undefined>(undefined);

export const PropertiesProvider = ({ children }: { children: ReactNode }) => {
  const { organizationId, isStaff, isOrgLevel } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProperties = async () => {
    if (!organizationId) {
      setLoading(false);
      return;
    }
    
    try {
      // Only fetch for staff and org-level users
      if (isStaff || isOrgLevel) {
        const data = await propertyService.list(organizationId, { status: 'active' });
        setProperties(data.properties.map(p => ({ id: p.id, name: p.name })));
      }
    } catch (err) {
      console.error('Failed to load properties', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProperties();
  }, [organizationId, isStaff, isOrgLevel]);

  return (
    <PropertiesContext.Provider value={{ properties, loading, refresh: loadProperties }}>
      {children}
    </PropertiesContext.Provider>
  );
};

export const useProperties = () => {
  const context = useContext(PropertiesContext);
  if (!context) {
    throw new Error('useProperties must be used within PropertiesProvider');
  }
  return context;
};