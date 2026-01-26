// src/features/organizations/types/organization.types.ts
import type { UserType } from "../../auth/types/auth.types"; // Import the type we fixed earlier

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
    userType: UserType; // Strict type instead of string
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
};