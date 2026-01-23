import {
  Events,
  MaintenanceEvents,
  MaintenanceCreatedPayload,
  MaintenanceAssignedPayload,
  MaintenanceStatusChangedPayload,
} from "../lib/events";
import { prisma } from "../lib/prisma";
import { emailService } from "../services/email";
import { env } from "../config/env";

// Placeholder for future Twilio integration
// import { smsService } from "../service/sms";

/**
 * Handle New Request Notifications
 */
Events.subscribe(MaintenanceEvents.CREATED, async (payload: MaintenanceCreatedPayload) => {
  const { requestId, propertyId } = payload;

  const request = await prisma.maintenanceRequest.findUnique({
    where: { id: requestId },
    include: {
      property: true,
      creator: true,
    },
  });

  if (!request) return;

  // 1. Notify All Active Property Staff via Email
  const staff = await prisma.propertyStaff.findMany({
    where: { propertyId, archivedAt: null },
    include: { user: true },
  });

  for (const s of staff) {
    if (s.user.email) {
      await emailService.send({
        to: s.user.email,
        templateKey: "STAFF_NEW_REQUEST",
        data: {
          staffName: s.user.name,
          propertyName: request.property.name,
          requestCode: request.code,
          description: request.description,
          unitNumber: request.unitNumber,
          priority: request.priority,
          link: `${env.FRONTEND_URL}/requests/${request.code}`,
        },
      });
    }
  }

  // 2. Notify the Tenant (The creator)
  if (request.creator?.email) {
    await emailService.send({
      to: request.creator.email,
      templateKey: "TENANT_CREATED",
      data: {
        tenantName: request.creator.name,
        requestCode: request.code,
        unitNumber: request.unitNumber,
      },
    });
  }

  // 3. FUTURE SMS LOGIC (Twilio)
  // If the tenant has a phone and the property has a Twilio number
  if (request.creator?.phone && request.property.maintenancePhoneNumber) {
    console.log(
      `[SMS-LOG] Ready to notify ${request.creator.phone} from ${request.property.maintenancePhoneNumber}`
    );
    /*
    await smsService.send({
      to: request.creator.phone,
      from: request.property.maintenancePhoneNumber,
      message: `Hi ${request.creator.name}, we received your request ${request.code}. Status: Pending.`
    });
    */
  }
});

/**
 * Handle Assignment Notifications
 */
Events.subscribe(MaintenanceEvents.ASSIGNED, async (payload: MaintenanceAssignedPayload) => {
  const { requestId } = payload;

  const request = await prisma.maintenanceRequest.findUnique({
    where: { id: requestId },
    include: {
      property: true,
      creator: true,
      assignee: true,
    },
  });

  if (!request || !request.assignee) return;

  // 1. Notify the Assignee (Worker)
  if (request.assignee.email) {
    await emailService.send({
      to: request.assignee.email,
      templateKey: "ASSIGNEE_ASSIGNED",
      data: {
        assigneeName: request.assignee.name,
        propertyName: request.property.name,
        requestCode: request.code,
        description: request.description,
        unitNumber: request.unitNumber,
        priority: request.priority,
        link: `${env.FRONTEND_URL}/requests/${request.code}`,
      },
    });
  }

  // 2. Notify the Tenant (Creator) that someone is coming
  if (request.creator?.email) {
    await emailService.send({
      to: request.creator.email,
      templateKey: "TENANT_ASSIGNED",
      data: {
        tenantName: request.creator.name,
        staffName: request.assignee.name,
        description: request.description,
        requestCode: request.code,
      },
    });
  }
});

Events.subscribe(
  MaintenanceEvents.STATUS_CHANGED,
  async (payload: MaintenanceStatusChangedPayload) => {
    const { requestId, newStatus } = payload;

    const request = await prisma.maintenanceRequest.findUnique({
      where: { id: requestId },
      include: { creator: true },
    });

    if (!request || !request.creator?.email) return;

    // We only notify the tenant for major status moves
    const meaningfulStatuses = ["in_progress", "completed", "cancelled"];

    if (meaningfulStatuses.includes(newStatus)) {
      await emailService.send({
        to: request.creator.email,
        templateKey: "TENANT_STATUS_UPDATE",
        data: {
          tenantName: request.creator.name,
          requestCode: request.code,
          description: request.description,
          status: newStatus,
          link: `${env.FRONTEND_URL}/requests/${request.code}`,
        },
      });
    }
  }
);
