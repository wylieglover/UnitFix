import { asyncHandler } from "../helpers/asyncHandler";
import { tenantSelect, formatTenant } from "../helpers/tenantHelpers";
import { prisma } from "../lib/prisma";

export const listTenants = asyncHandler(async (req, res, next) => {
  const { property } = res.locals;
  const { status } = res.locals.query;

  const tenants = await prisma.tenant.findMany({
    where: {
      propertyId: property.id,
      ...(status === "archived"
        ? { archivedAt: { not: null } }
        : status === "all"
          ? {}
          : { archivedAt: null }),
    },
    select: tenantSelect,
  });

  return res.status(200).json({
    tenants: tenants.map(formatTenant),
  });
});

export const getTenant = asyncHandler(async (req, res, next) => {
  const { targetUser, property } = res.locals;

  const tenant = await prisma.tenant.findUnique({
    where: {
      userId_propertyId: { userId: targetUser.id, propertyId: property.id },
    },
    select: tenantSelect,
  });

  if (!tenant) {
    return res.status(404).json({
      error: "Tenant not found",
    });
  }

  return res.status(200).json({
    tenant: formatTenant(tenant),
  });
});

export const updateTenant = asyncHandler(async (req, res, next) => {
  const { targetUser, property } = res.locals;
  const { unitNumber, archived } = res.locals.body;

  const existingTenant = await prisma.tenant.findUnique({
    where: {
      userId_propertyId: { userId: targetUser.id, propertyId: property.id },
    },
  });

  if (!existingTenant) {
    return res.status(404).json({
      error: "Tenant not found",
    });
  }

  const updatedTenant = await prisma.tenant.update({
    where: {
      userId_propertyId: { userId: targetUser.id, propertyId: property.id },
    },
    data: {
      ...(unitNumber && { unitNumber }),
      ...(archived !== undefined && {
        archivedAt: archived ? new Date() : null,
      }),
    },
    select: tenantSelect,
  });

  return res.status(200).json({
    message: "Tenant updated successfully",
    tenant: formatTenant(updatedTenant),
  });
});
