// src/features/tenants/types/tenant.types.ts

export interface CreateTenantPayload {
  name: string;
  email: string;
  unitNumber: string;
}

export interface UpdateTenantPayload {
  unitNumber?: string;
  archived?: boolean;
}

export interface Tenant {
  userId: string;
  unitNumber: string | null;
  createdAt: string;
  archivedAt: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
  // Add this optional property field
  property?: {
    id: string;
    name: string;
  };
}

export interface TenantListResponse {
  tenants: Tenant[];
}

export interface TenantQueryFilters {
  status?: 'active' | 'archived' | 'all';
}