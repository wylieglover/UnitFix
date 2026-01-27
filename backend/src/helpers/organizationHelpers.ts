export const organizationSelect = {
  id: false,
  opaqueId: true,
  name: true,
  contactInfo: true,
  twilioPhoneNumber: true,
} as const;

export const formatOrganization = (org: {
  opaqueId: string;
  name: string;
  contactInfo?: string;
  twilioPhoneNumber?: string | null;
}) => ({
  id: org.opaqueId,
  name: org.name,
  hasPhone: !!org.twilioPhoneNumber,
  phoneNumber: org.twilioPhoneNumber,
  ...(org.contactInfo !== undefined && { contactInfo: org.contactInfo }),
});

export type FormattedOrganization = ReturnType<typeof formatOrganization>;
