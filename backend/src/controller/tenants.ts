import { asyncHandler } from "../helpers/asyncHandler";
import { tenantSelect, formatTenant } from "../helpers/tenantHelpers";
import { prisma } from "../lib/prisma";
import { TokenPayload } from "../helpers/token";

export const listTenants = asyncHandler(async (req, res, next) => {
  const { property, organization } = res.locals;
  const { userId: userOpaqueId, userType } = res.locals.user as TokenPayload;
  const { status } = res.locals.query;

  // Resolve internal userId from opaqueId
  const user = await prisma.user.findUnique({
    where: { opaqueId: userOpaqueId },
    select: { id: true }
  });

  if (!user) {
    return res.status(401).json({ error: "User not found" });
  }

  const userId = user.id;

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
    
    // If staff viewing org-level list, filter to only their properties
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

  // Use a transaction to update tenant, tickets, and handle archiving
  const updatedTenant = await prisma.$transaction(async (tx) => {
    // Update the tenant
    const tenant = await tx.tenant.update({
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

    // If unitNumber changed, update ALL tickets for the old unit to the new unit
    if (unitNumber && existingTenant.unitNumber && unitNumber !== existingTenant.unitNumber) {
      await tx.maintenanceRequest.updateMany({
        where: {
          propertyId: property.id,
          unitNumber: existingTenant.unitNumber, // Match the OLD unit number
        },
        data: {
          unitNumber: unitNumber, // Update to NEW unit number
        },
      });
    }

    // If archiving tenant (and they weren't already archived), cancel all open/in_progress tickets
    if (archived === true && existingTenant.archivedAt === null && existingTenant.unitNumber) {
      await tx.maintenanceRequest.updateMany({
        where: {
          propertyId: property.id,
          unitNumber: existingTenant.unitNumber,
          status: { in: ['open', 'in_progress'] },
        },
        data: {
          status: 'cancelled',
          cancelledAt: new Date(),
        },
      });
    }

    return tenant;
  });

  return res.status(200).json({
    message: "Tenant updated successfully",
    tenant: formatTenant(updatedTenant),
  });
});