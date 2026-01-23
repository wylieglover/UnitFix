export const organizationSelect = {
  id: false,
  opaqueId: true,
  name: true,
  contactInfo: true,
} as const;

export const formatOrganization = (org: {
  opaqueId: string;
  name: string;
  contactInfo?: string;
}) => ({
  id: org.opaqueId,
  name: org.name,
  ...(org.contactInfo !== undefined && { contactInfo: org.contactInfo }),
});

export type FormattedOrganization = ReturnType<typeof formatOrganization>;
