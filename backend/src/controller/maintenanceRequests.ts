import { asyncHandler } from "../helpers/asyncHandler";
import { prisma } from "../lib/prisma";
import { TokenPayload } from "../helpers/token";
import {
  generateRequestCode,
  maintenanceRequestSelect,
  formatMaintenanceRequest,
} from "../helpers/maintenanceRequestHelpers";
import { Events, MaintenanceEvents } from "../lib/events";

export const createMaintenanceRequest = asyncHandler(async (req, res, next) => {
  const { property } = res.locals;
  const { userId, userType } = res.locals.user as TokenPayload;
  const { description, unitNumber, priority } = res.locals.body;

  // Handle unit number based on user type
  let finalUnitNumber: string | null = null;

  if (userType === "tenant") {
    // Auto-fill from tenant record
    const tenant = await prisma.tenant.findUnique({
      where: { userId_propertyId: { userId, propertyId: property.id } },
    });
    finalUnitNumber = tenant?.unitNumber || null;
  } else {
    // Staff/admin must provide it
    finalUnitNumber = unitNumber || null;
    if (!finalUnitNumber) {
      return res.status(400).json({ error: "Unit number is required" });
    }
  }

  // Generate unique code for this property
  let code: string;
  let attempts = 0;
  const maxAttempts = 10;

  do {
    code = generateRequestCode();
    const existing = await prisma.maintenanceRequest.findUnique({
      where: {
        propertyId_code: { propertyId: property.id, code },
      },
    });

    if (!existing) break;

    attempts++;
    if (attempts >= maxAttempts) {
      return res.status(500).json({
        error: "Unable to generate unique code. Please try again.",
      });
    }
  } while (true);

  // Create the maintenance request
  const request = await prisma.maintenanceRequest.create({
    data: {
      code,
      propertyId: property.id,
      createdBy: userId,
      description,
      unitNumber: finalUnitNumber,
      priority,
      status: "open",
    },
    include: {
      creator: true,
      assignee: true,
    },
  });

  Events.publish(MaintenanceEvents.CREATED, {
    requestId: request.id,
    propertyId: property.id,
  });

  return res.status(201).json({
    message: "Maintenance request created successfully",
    request: formatMaintenanceRequest(request),
  });
});

export const listMaintenanceRequests = asyncHandler(async (req, res, next) => {
  const { property } = res.locals;
  const { userId, userType } = res.locals.user as TokenPayload;
  const { status, priority, assignedTo, createdBy } = res.locals.query;

  // Build where clause
  const where: any = {
    propertyId: property.id,
  };

  // Status filter
  if (status === "open") {
    where.status = "open";
    where.archivedAt = null;
  } else if (status === "in_progress") {
    where.status = "in_progress";
    where.archivedAt = null;
  } else if (status === "completed") {
    where.status = "completed";
    where.archivedAt = null;
  } else if (status === "cancelled") {
    where.status = "cancelled";
    where.archivedAt = null;
  } else if (status === "all") {
    where.archivedAt = null;
  }

  // Priority filter
  if (priority) {
    where.priority = priority;
  }

  // AssignedTo filter
  if (assignedTo) {
    const assignedUser = await prisma.user.findUnique({
      where: { opaqueId: assignedTo },
      select: { id: true },
    });
    if (assignedUser) {
      where.assignedTo = assignedUser.id;
    }
  }

  // CreatedBy filter
  if (createdBy) {
    const creatorUser = await prisma.user.findUnique({
      where: { opaqueId: createdBy },
      select: { id: true },
    });
    if (creatorUser) {
      where.createdBy = creatorUser.id;
    }
  }

  // Tenants can only see their own requests
  if (userType === "tenant") {
    where.createdBy = userId;
  }

  const requests = await prisma.maintenanceRequest.findMany({
    where,
    select: maintenanceRequestSelect,
    orderBy: { createdAt: "desc" },
  });

  return res.status(200).json({
    requests: requests.map(formatMaintenanceRequest),
  });
});

export const getMaintenanceRequest = asyncHandler(async (req, res, next) => {
  const { property } = res.locals;
  const { userId, userType } = res.locals.user as TokenPayload;
  const { code } = res.locals.params;

  const request = await prisma.maintenanceRequest.findUnique({
    where: {
      propertyId_code: { propertyId: property.id, code },
    },
    select: {
      ...maintenanceRequestSelect,
      createdBy: true, // Include for tenant check
    },
  });

  if (!request) {
    return res.status(404).json({ error: "Maintenance request not found" });
  }

  // Tenants can only view their own requests
  if (userType === "tenant" && request.createdBy !== userId) {
    return res.status(403).json({ error: "Access denied" });
  }

  return res.status(200).json({
    request: formatMaintenanceRequest(request),
  });
});

export const updateMaintenanceRequest = asyncHandler(async (req, res, next) => {
  const { property } = res.locals;
  const { code } = res.locals.params;
  const { description, priority, status, assignedTo, unitNumber, archived } = res.locals.body;

  // 1. Check if request exists
  const existingRequest = await prisma.maintenanceRequest.findUnique({
    where: { propertyId_code: { propertyId: property.id, code } },
  });

  if (!existingRequest) {
    return res.status(404).json({ error: "Maintenance request not found" });
  }

  // 2. Build update data
  const updateData: any = {
    ...(description && { description }),
    ...(priority && { priority }),
    ...(unitNumber !== undefined && { unitNumber }),
  };

  // 3. Status logic with timestamp resets
  let shouldNotifyStatus = false;
  if (status) {
    updateData.status = status;

    if (status !== existingRequest.status) {
      shouldNotifyStatus = true;

      // Handle Completed timestamp
      if (status === "completed") {
        updateData.completedAt = new Date();
      } else {
        updateData.completedAt = null;
      }

      // Handle Cancelled timestamp
      if (status === "cancelled") {
        updateData.cancelledAt = new Date();
      } else {
        updateData.cancelledAt = null;
      }
    }
  }

  // 4. Assignment logic
  let shouldNotifyAssignment = false;
  let newAssigneeInternalId: number | null = null;

  if (assignedTo !== undefined) {
    if (assignedTo === null) {
      updateData.assignedTo = null;
      updateData.assignedAt = null;
    } else {
      const assignedUser = await prisma.user.findUnique({
        where: { opaqueId: assignedTo },
        select: { id: true },
      });

      if (!assignedUser) {
        return res.status(404).json({ error: "Assigned user not found" });
      }

      newAssigneeInternalId = assignedUser.id;
      updateData.assignedTo = newAssigneeInternalId;

      // Only notify if the assignee has actually changed
      if (existingRequest.assignedTo !== newAssigneeInternalId) {
        updateData.assignedAt = new Date();
        shouldNotifyAssignment = true;
      }
    }
  }

  // 5. Archiving logic
  if (archived !== undefined) {
    updateData.archivedAt = archived ? new Date() : null;
  }

  // 6. Execute Update
  const updatedRequest = await prisma.maintenanceRequest.update({
    where: { propertyId_code: { propertyId: property.id, code } },
    data: updateData,
    include: {
      creator: true,
      assignee: true,
      property: true,
    },
  });

  // 7. Trigger Events
  // Notify Assignment Change
  if (shouldNotifyAssignment && newAssigneeInternalId) {
    Events.publish(MaintenanceEvents.ASSIGNED, {
      requestId: updatedRequest.id,
      assigneeId: newAssigneeInternalId,
    });
  }

  // Notify Status Change (In Progress, Completed, Cancelled)
  if (shouldNotifyStatus) {
    Events.publish(MaintenanceEvents.STATUS_CHANGED, {
      requestId: updatedRequest.id,
      oldStatus: existingRequest.status,
      newStatus: updatedRequest.status,
    });
  }

  return res.status(200).json({
    message: "Maintenance request updated successfully",
    request: formatMaintenanceRequest(updatedRequest as any),
  });
});
