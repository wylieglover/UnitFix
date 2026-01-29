import { api } from "../../../api/api";
import type { 
  RegisterOrganizationPayload, 
  RegisterOrganizationResponse,
  DashboardStats,
  OrganizationDetails,
  ProvisionPhonePayload,
  ProvisionPhoneResponse
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

  // NEW: Get organization details (includes provisioning status)
  getDetails: async (organizationId: string) => {
    const res = await api.get<OrganizationDetails>(
      `/organizations/${organizationId}`
    );
    return res.data;
  },

  // NEW: Provision phone number for organization
  provisionPhone: async (organizationId: string, payload: ProvisionPhonePayload) => {
    const res = await api.post<ProvisionPhoneResponse>(
      `/organizations/${organizationId}/phone`,
      payload
    );
    return res.data;
  },
};