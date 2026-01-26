export type Property = {
  id: string;
  name: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  maintenancePhoneNumber?: string;
  twilioNumber?: string; // The actual number tenants text
  twilioSid?: string; // For backend reference
  createdAt: string;
  archivedAt?: string;
};

export type ListPropertiesResponse = {
  properties: Property[];
};

export type CreatePropertyPayload = {
  name: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
};

export type CreatePropertyResponse = {
  property: Property;
};

export type UpdatePropertyPayload = {
  name?: string;
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  archived?: boolean;
};

export type PropertyQueryParams = {
  status?: 'active' | 'archived' | 'all';
};