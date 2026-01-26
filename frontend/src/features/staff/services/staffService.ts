import { api } from "../../../api/api";
import type { 
  Staff, 
  StaffListResponse, 
  StaffQueryFilters,
  UpdateStaffPayload 
} from "../types/staff.types";

export const staffService = {
  // list handles both /properties/staff AND /properties/:id/staff
  list: async (orgId: string, propertyId?: string, filters?: StaffQueryFilters) => {
    const url = propertyId 
      ? `/organizations/${orgId}/properties/${propertyId}/staff`
      : `/organizations/${orgId}/properties/staff`;
    
    const response = await api.get<StaffListResponse>(url, { params: filters });
    return response.data;
  },

  get: async (orgId: string, propertyId: string, userId: string) => {
    const response = await api.get<{ staff: Staff }>(
      `/organizations/${orgId}/properties/${propertyId}/staff/${userId}`
    );
    return response.data;
  },

  update: async (orgId: string, propertyId: string, userId: string, payload: UpdateStaffPayload) => {
    const response = await api.put<{ staff: Staff }>(
      `/organizations/${orgId}/properties/${propertyId}/staff/${userId}`,
      payload
    );
    return response.data;
  },
  
  assignToProperty: async (
    organizationId: string,
    payload: {
      userId: string;
      propertyId: string;
      role: "member" | "manager";
    }
  ) => {
    const response = await api.post(
      `/organizations/${organizationId}/properties/staff/assign`,
      payload
    );
    return response.data;
  },
};