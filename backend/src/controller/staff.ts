import { asyncHandler } from "../helpers/asyncHandler";
import { staffSelect, formatStaff } from "../helpers/staffHelpers";
import { prisma } from "../lib/prisma";
import { TokenPayload } from "../helpers/token";

export const listStaff = asyncHandler(async (req, res, next) => {
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

  const staff = await prisma.propertyStaff.findMany({
    where: whereClause,
    select: {
      ...staffSelect,
      // If we are looking at the Org level, include property info
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
    staff: staff.map(formatStaff),
  });
});

export const getStaff = asyncHandler(async (req, res, next) => {
  const { targetUser, property } = res.locals;

  const staff = await prisma.propertyStaff.findUnique({
    where: {
      userId_propertyId: { userId: targetUser.id, propertyId: property.id },
    },
    select: staffSelect,
  });

  if (!staff) {
    return res.status(404).json({
      error: "Staff member not found",
    });
  }

  return res.status(200).json({
    staff: formatStaff(staff),
  });
});

export const updateStaff = asyncHandler(async (req, res, next) => {
  const { targetUser, property } = res.locals;
  const { role, archived } = res.locals.body;

  const existingStaff = await prisma.propertyStaff.findUnique({
    where: {
      userId_propertyId: { userId: targetUser.id, propertyId: property.id },
    },
  });

  if (!existingStaff) {
    return res.status(404).json({ error: "Staff member not found" });
  }

  const updatedStaff = await prisma.propertyStaff.update({
    where: {
      userId_propertyId: { userId: targetUser.id, propertyId: property.id },
    },
    data: {
      ...(role && { role }),
      ...(archived !== undefined && {
        archivedAt: archived ? new Date() : null,
      }),
    },
    select: staffSelect,
  });

  return res.status(200).json({
    message: "Staff updated successfully",
    staff: formatStaff(updatedStaff),
  });
});

export const assignStaffToProperty = asyncHandler(async (req, res) => {
  const { organization } = res.locals;
  const { userId, propertyId, role } = res.locals.body;

  // 1. Resolve user by opaqueId
  const user = await prisma.user.findUnique({
    where: { opaqueId: userId },
    select: {
      id: true,
      opaqueId: true,
      name: true,
      email: true,
      userType: true,
    },
  });

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  // 2. Verify user is staff type
  if (user.userType !== "staff") {
    return res.status(400).json({
      error: `Cannot assign ${user.userType} user as staff`,
    });
  }

  // 3. Resolve property by opaqueId and verify it belongs to this org
  const property = await prisma.property.findUnique({
    where: { opaqueId: propertyId },
    select: {
      id: true,
      opaqueId: true,
      name: true,
      organizationId: true,
    },
  });

  if (!property) {
    return res.status(404).json({ error: "Property not found" });
  }

  if (property.organizationId !== organization.id) {
    return res.status(403).json({
      error: "Property does not belong to this organization",
    });
  }

  // 4. Check if already assigned to this property
  const existingAssignment = await prisma.propertyStaff.findUnique({
    where: {
      userId_propertyId: {
        userId: user.id,
        propertyId: property.id,
      },
    },
  });

  if (existingAssignment) {
    return res.status(409).json({
      error: "Staff member is already assigned to this property",
    });
  }

  // 5. Create the assignment
  const assignment = await prisma.propertyStaff.create({
    data: {
      userId: user.id,
      propertyId: property.id,
      role,
    },
    select: staffSelect, // Reuse your existing select
  });

  return res.status(201).json({
    message: "Staff member assigned to property successfully",
    staff: formatStaff(assignment), // Reuse your existing formatter
  });
});