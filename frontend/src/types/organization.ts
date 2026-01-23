export type User = {
  id: string;
  name: string;
  email: string;
  userType: "org_owner" | "org_admin" | "tenant";
};

export type Organization = {
  id: string;
  name: string;
  contactInfo?: string;
};

export type RegisterOrganizationResponse = {
  message: string;
  accessToken: string;
  user: User;
  organization: Organization;
};
