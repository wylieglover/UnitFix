// src/features/organizations/types/organization.types.ts
import type { UserType } from "../../auth/types/auth.types";

export type RegisterOrganizationPayload = {
  organizationName: string;
  contactInfo?: string;
  name: string;
  email: string;
  password: string;
};

export type RegisterOrganizationResponse = {
  message: string;
  accessToken: string;
  organization: {
    id: string;
    name: string;
    contactInfo?: string;
  };
  user: {
    id: string;
    email: string;
    name: string;
    userType: UserType;
  };
};

export type DashboardStats = {
  organization: {
    id: string;
    name: string;
  };
  stats: {
    properties: number;
    staff: number;
    tenants: number;
    requests: {
      open: number;
      inProgress: number;
      completed: number;
      total: number;
    };
  };
  alerts: {
    urgentUnassigned: number;
    propertiesWithoutStaff: number;
    pendingInvites: number;
  };
};

export type OrganizationDetails = {
  organization: {
    id: string;
    name: string;
    hasPhone: boolean;
    phoneNumber: string | null;
    contactInfo?: string;
  };
};

export type ProvisionPhonePayload = {
  areaCode: string;
};

export type ProvisionPhoneResponse = {
  message: string;
  organization: {
    id: string;
    name: string;
    hasPhone: boolean;
    phoneNumber: string | null;
  };
  phoneNumber: string;
};