import { Prisma } from "../lib/prisma";

export const tenantSelect = {
  unitNumber: true,
  createdAt: true,
  archivedAt: true,
  user: {
    select: {
      opaqueId: true,
      name: true,
      email: true,
      phone: true,
    },
  },
} as const;

type TenantWithSelect = Prisma.TenantGetPayload<{
  select: typeof tenantSelect;
}>;

export const formatTenant = (tenant: TenantWithSelect) => ({
  userId: tenant.user.opaqueId,
  unitNumber: tenant.unitNumber,
  createdAt: tenant.createdAt,
  archivedAt: tenant.archivedAt,
  user: {
    id: tenant.user.opaqueId,
    name: tenant.user.name,
    email: tenant.user.email,
    phone: tenant.user.phone,
  },
});

export type FormattedTenant = ReturnType<typeof formatTenant>;
