export const propertySelect = {
  id: false,
  opaqueId: true,
  name: true,
  street: true,
  city: true,
  state: true,
  zip: true,
  country: true,
  maintenancePhoneNumber: true,
  createdAt: true,
  updatedAt: true,
  archivedAt: true,
} as const;

export const formatProperty = (property: {
  opaqueId: string;
  name: string;
  street: string;
  city: string;
  state: string | null;
  zip: string;
  country: string;
  maintenancePhoneNumber?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  archivedAt?: Date | null;
}) => ({
  id: property.opaqueId,
  name: property.name,
  street: property.street,
  city: property.city,
  state: property.state,
  zip: property.zip,
  country: property.country,
  ...(property.maintenancePhoneNumber !== undefined && {
    maintenancePhoneNumber: property.maintenancePhoneNumber,
  }),
  ...(property.createdAt !== undefined && { createdAt: property.createdAt }),
  ...(property.updatedAt !== undefined && { updatedAt: property.updatedAt }),
  ...(property.archivedAt !== undefined && { archivedAt: property.archivedAt }),
});

export type FormattedProperty = ReturnType<typeof formatProperty>;
