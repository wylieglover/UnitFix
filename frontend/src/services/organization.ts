import { api } from "../api/api";
import type { RegisterOrganizationResponse } from "../types/organization";

export type RegisterOrganizationPayload = {
  organizationName: string;
  contactInfo?: string;
  name: string;
  email: string;
  password: string;
};

export const registerOrganization = async (
  payload: RegisterOrganizationPayload
) => {
  const res = await api.post<RegisterOrganizationResponse>(
    "/organizations/register",
    payload
  );

  localStorage.setItem("accessToken", res.data.accessToken);
  return res.data;
};
