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
      property: true
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
  const { property, organization } = res.locals;
  const { userId, userType } = res.locals.user as TokenPayload;
  const { status, priority, assignedTo, createdBy, relatedTo, archived } = res.locals.query;

  // Base filter
  const where: any = property 
    ? { propertyId: property.id }
    : { property: { organizationId: organization.id } };

  // Status Filter
  if (status && status !== "all") {
    where.status = status;
  }

  // Archive Filter (Supports 'active', 'archived', 'all')
  if (archived === "archived") {
    where.archivedAt = { not: null };
  } else if (archived === "all") {
    // Do nothing, show both
  } else {
    // Default to 'active'
    where.archivedAt = null;
  }

  // Priority Filter
  if (priority) {
    where.priority = priority;
  }

  // OpaqueID resolution for assignedTo
  if (assignedTo) {
    const user = await prisma.user.findUnique({ 
      where: { opaqueId: assignedTo }, 
      select: { id: true } 
    });
    if (user) where.assignedTo = user.id;
  }

  // OpaqueID resolution for createdBy
  if (createdBy) {
    const user = await prisma.user.findUnique({ 
      where: { opaqueId: createdBy }, 
      select: { id: true } 
    });
    if (user) where.createdBy = user.id;
  }

  // ✅ NEW: relatedTo filter - finds tickets created by OR related to the user's unit
  if (relatedTo) {
    const user = await prisma.user.findUnique({ 
      where: { opaqueId: relatedTo }, 
      select: { id: true, userType: true } 
    });
    
    if (user) {
      if (user.userType === 'tenant') {
        // For tenants, find tickets created by them OR for their unit
        const tenant = await prisma.tenant.findUnique({
          where: { userId: user.id },
          select: { unitNumber: true, propertyId: true }
        });
        
        if (tenant && tenant.unitNumber) {
          // Tickets created by tenant OR for their unit at their property
          where.OR = [
            { createdBy: user.id },
            { 
              unitNumber: tenant.unitNumber,
              propertyId: tenant.propertyId 
            }
          ];
        } else {
          // No unit number, just show tickets they created
          where.createdBy = user.id;
        }
      } else {
        // For staff/admins, just show tickets they created
        where.createdBy = user.id;
      }
    }
  }

  // ✅ SECURITY: Tenants can only see their own requests
  if (userType === "tenant") {
    where.createdBy = userId;
  }

  // ✅ Staff can only see requests from their assigned properties
  if (userType === "staff" && !property) {
    // Get all property IDs the staff is assigned to
    const staffAssignments = await prisma.propertyStaff.findMany({
      where: { userId },
      select: { propertyId: true }
    });
    
    const allowedPropertyIds = staffAssignments.map(a => a.propertyId);
    
    // Filter to only those properties
    where.propertyId = { in: allowedPropertyIds };
  }

  const requests = await prisma.maintenanceRequest.findMany({
    where,
    select: {
      ...maintenanceRequestSelect,
      ...(!property && {
        property: {
          select: { opaqueId: true, name: true }
        }
      })
    },
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
