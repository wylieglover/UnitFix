import { asyncHandler } from "../helpers/asyncHandler";
import { tenantSelect, formatTenant } from "../helpers/tenantHelpers";
import { prisma } from "../lib/prisma";
import { TokenPayload } from "../helpers/token";

export const listTenants = asyncHandler(async (req, res, next) => {
  const { property, organization } = res.locals;
  const { userId, userType } = res.locals.user as TokenPayload;
  const { status } = res.locals.query;

  const statusFilter =
    status === "archived"
      ? { archivedAt: { not: null } }
      : status === "all"
        ? {}
        : { archivedAt: null };

  // Build base where clause
  let whereClause: any = {
    ...statusFilter,
  };

  // Property-specific or org-level logic
  if (property) {
    // Specific property context
    whereClause.propertyId = property.id;
  } else {
    // Organization-level context
    whereClause.property = { organizationId: organization.id };
    
    // ✅ If staff viewing org-level list, filter to only their properties
    if (userType === "staff") {
      const staffAssignments = await prisma.propertyStaff.findMany({
        where: { userId },
        select: { propertyId: true }
      });
      
      const allowedPropertyIds = staffAssignments.map(a => a.propertyId);
      whereClause.propertyId = { in: allowedPropertyIds };
    }
  }

  const tenants = await prisma.tenant.findMany({
    where: whereClause,
    select: {
      ...tenantSelect,
      // Include property info when listing org-wide
      ...(!property && {
        property: {
          select: {
            opaqueId: true,
            name: true,
          },
        },
      }),
    },
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