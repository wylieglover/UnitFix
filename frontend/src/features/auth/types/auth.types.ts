// src/features/auth/types/auth.types.ts

export type UserType = 'org_owner' | 'org_admin' | 'staff' | 'tenant';

export type LoginPayload = {
  email: string;
  password: string;
};

export type LoginResponse = {
  message: string;
  accessToken: string;
  organization: {
    id: string;
    name: string;
  };
  properties?: Array<{
    id: string;
    name: string;
  }>;
  property?: {
    id: string;
    name: string;
  };
  user: {
    id: string;
    email: string;
    name: string;
    userType: UserType;
    propertyId?: string;
  };
};