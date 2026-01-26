import { Prisma } from "../lib/prisma";

/* ------------------ Code Generation ------------------ */

/**
 * Generate a random 4-character alphanumeric code
 * Excludes confusing characters: O, 0, I, 1
 */
export const generateRequestCode = (): string => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

/* ------------------ Select & Format ------------------ */

export const maintenanceRequestSelect = {
  id: false,
  opaqueId: true,
  code: true,
  propertyId: false,
  description: true,
  unitNumber: true,
  status: true,
  priority: true,
  createdAt: true,
  updatedAt: true,
  completedAt: true,
  cancelledAt: true,
  archivedAt: true,
  assignedAt: true,
  createdBy: false,
  assignedTo: false,
  property: {
    select: {
      opaqueId: true,
      name: true,
    }
  },
  creator: {
    select: {
      opaqueId: true,
      name: true,
      email: true,
    },
  },
  assignee: {
    select: {
      opaqueId: true,
      name: true,
      email: true,
    },
  },
} as const;

type MaintenanceRequestWithSelect = Prisma.MaintenanceRequestGetPayload<{
  select: typeof maintenanceRequestSelect;
}>;

export const formatMaintenanceRequest = (request: MaintenanceRequestWithSelect) => ({
  id: request.opaqueId,
  code: request.code,
  description: request.description,
  unitNumber: request.unitNumber,
  status: request.status,
  priority: request.priority,
  createdAt: request.createdAt,
  updatedAt: request.updatedAt,
  completedAt: request.completedAt,
  cancelledAt: request.cancelledAt,
  archivedAt: request.archivedAt,
  assignedAt: request.assignedAt,
  property: request.property ? {
    id: request.property.opaqueId,
    name: request.property.name,
  } : null,
  creator: {
    id: request.creator.opaqueId,
    name: request.creator.name,
    email: request.creator.email,
  },
  assignee: request.assignee
    ? {
        id: request.assignee.opaqueId,
        name: request.assignee.name,
        email: request.assignee.email,
      }
    : null,
});

export type FormattedMaintenanceRequest = ReturnType<typeof formatMaintenanceRequest>;
