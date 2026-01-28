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
    phone: string | null;
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
  propertyId?: string;
  maintenanceRole?: "manager" | "member";
  invites: BulkInviteItem[];
}

export interface BulkInviteResponse {
  total: number;
  successful: number;
  failed: number;
  invites: {
    id: string;  
    email: string;
    phone: string | null; 
    role: string;
    unitNumber: string | null; 
    expiresAt: string;
  }[];
  errors: {
    email: string;
    error: string;
  }[];
}

export interface AcceptInvitePayload {
  name?: string;   
  password?: string;  
  phone?: string;   
  unitNumber?: string;
}

export interface AcceptInviteResponse {
  message: string;
  accessToken: string;
  user: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null; 
    userType: string;
  };
  organization: {
    id: string;
    name: string;
  } | null;
  property?: {
    id: string;
    name: string;
    street: string;     
    city: string;
    state: string | null;
    zip: string;
  } | null;
  properties?: Array<{
    id: string;
    name: string;
  }>;
}

export interface InviteDetailsResponse {
  message: string;
  invite: {
    id: string;
    role: InviteRole;
    email: string | null;
    phone: string | null;
    unitNumber: string | null;
    expiresAt: string;
    organization: {
      id: string;
      name: string;
    } | null;
    property: {
      id: string;
      name: string;
      street: string;
      city: string;
      state: string | null;
      zip: string;
    } | null;
  };
}