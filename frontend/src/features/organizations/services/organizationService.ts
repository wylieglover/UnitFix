import { api } from "../../../api/api";
import type { 
  RegisterOrganizationPayload, 
  RegisterOrganizationResponse,
  DashboardStats
} from "../types/organization.types";

export const organizationService = {
  register: async (payload: RegisterOrganizationPayload) => {
    const res = await api.post<RegisterOrganizationResponse>(
      "/organizations/register",
      payload
    );
    localStorage.setItem("accessToken", res.data.accessToken);
    return res.data;
  },

  getDashboard: async (organizationId: string) => {
    const res = await api.get<DashboardStats>(
      `/organizations/${organizationId}/dashboard`
    );
    return res.data;
  },
};