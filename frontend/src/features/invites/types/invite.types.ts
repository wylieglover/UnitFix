// src/features/invites/types/invite.types.ts
export type InviteRole = "org_admin" | "staff" | "tenant";
export type MaintenanceRole = "manager" | "member";

export interface SendInvitePayload {
  role: InviteRole;
  email: string;
  phone?: string;
  propertyId?: string;
  unitNumber?: string;
  maintenanceRole?: MaintenanceRole;
}

export interface InviteResponse {
  message: string;
  delivery: {
    email: boolean;
    phone: boolean;
  };
  invite: {
    id: string;
    email: string | null;
    role: InviteRole;
    expiresAt: string;
  };
}

export interface InviteQueryFilters {
  email?: boolean;
  phone?: boolean;
}

export interface BulkInviteItem {
  email: string;
  phone?: string;
  unitNumber?: string;
}

export interface BulkSendInvitePayload {
  role: "org_admin" | "staff" | "tenant";
  propertyId?: string; // Opaque ID
  maintenanceRole?: "manager" | "member";
  invites: BulkInviteItem[];
}

export interface BulkInviteResponse {
  total: number;
  successful: number;
  failed: number;
  invites: {
    id: number;
    email: string;
    role: string;
    expiresAt: string;
  }[];
  errors: {
    email: string;
    error: string;
  }[];
}

export interface AcceptInvitePayload {
  name: string;
  password: string;
  unitNumber?: string; // For tenants
}

export interface AcceptInviteResponse {
  message: string;
  accessToken: string;
  user: {
    id: string;
    name: string;
    email: string | null;
    userType: string;
  };
  organization: {
    id: string;
    name: string;
  } | null;
  property?: {
    id: string;
    name: string;
  };
  properties?: Array<{ // For staff with multiple properties
    id: string;
    name: string;
  }>;
}