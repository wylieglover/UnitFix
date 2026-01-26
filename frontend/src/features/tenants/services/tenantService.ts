// src/features/tenants/services/tenantService.ts
import { api } from "../../../api/api";
import type { 
  Tenant, 
  TenantListResponse, 
  TenantQueryFilters 
} from "../types/tenant.types";

export const tenantService = {
  list: async (orgId: string, propertyId?: string, filters?: TenantQueryFilters) => {
    const url = propertyId 
      ? `/organizations/${orgId}/properties/${propertyId}/tenants`
      : `/organizations/${orgId}/properties/tenants`;
    
    const response = await api.get<TenantListResponse>(url, { params: filters });
    return response.data;
  },

  get: async (orgId: string, propertyId: string, userId: string) => {
    const response = await api.get<{ tenant: Tenant }>(
      `/organizations/${orgId}/properties/${propertyId}/tenants/${userId}`
    );
    return response.data;
  },
};