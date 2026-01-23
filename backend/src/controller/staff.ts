import { asyncHandler } from "../helpers/asyncHandler";
import { staffSelect, formatStaff } from "../helpers/staffHelpers";
import { prisma } from "../lib/prisma";

export const listStaff = asyncHandler(async (req, res, next) => {
  const { property } = res.locals;
  const { status } = res.locals.query;

  const staff = await prisma.propertyStaff.findMany({
    where: {
      propertyId: property.id,
      ...(status === "archived"
        ? { archivedAt: { not: null } }
        : status === "all"
          ? {}
          : { archivedAt: null }),
    },
    select: staffSelect,
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
