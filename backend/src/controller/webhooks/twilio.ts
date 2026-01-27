import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { Events, MaintenanceEvents } from "../../lib/events";
import { generateRequestCode } from "../../helpers/maintenanceRequestHelpers";
import { asyncHandler } from "../../helpers/asyncHandler";

export const handleIncomingSms = asyncHandler(async (req: Request, res: Response) => {
  const { From: senderPhone, To: twilioPhone, Body: messageBody } = res.locals.body;

  // 1. Verify the Twilio number belongs to an organization
  const organization = await prisma.organization.findUnique({
    where: { twilioPhoneNumber: twilioPhone },
  });

  if (!organization) {
    console.error(`[Twilio Webhook] No organization found for number: ${twilioPhone}`);
    return res.status(404).send("Organization not found");
  }

  // 2. Resolve User/Tenant context
  const user = await prisma.user.findUnique({
    where: { phone: senderPhone },
    include: { 
      tenant: {
        include: {
          property: true
        }
      } 
    },
  });

  // 3. Validation: User must be a tenant with an active tenancy
  if (!user || user.userType !== "tenant" || !user.tenant) {
    console.log(`[Twilio Webhook] Unauthorized or unrecognized text from ${senderPhone}`);
    return res.status(200).send("User not recognized");
  }

  // 4. Verify tenant's property belongs to this organization
  if (user.tenant.property.organizationId !== organization.id) {
    console.log(`[Twilio Webhook] Tenant ${user.id} does not belong to organization ${organization.id}`);
    return res.status(200).send("User not recognized");
  }

  const property = user.tenant.property;

  // 5. Generate unique code (Consistent with createMaintenanceRequest logic)
  let code: string;
  let attempts = 0;
  const maxAttempts = 10;

  while (true) {
    code = generateRequestCode();
    const existing = await prisma.maintenanceRequest.findUnique({
      where: {
        propertyId_code: { propertyId: property.id, code },
      },
    });

    if (!existing) break;

    attempts++;
    if (attempts >= maxAttempts) {
      res.type("text/xml");
      return res.send(`
        <Response>
          <Sms>Sorry, we encountered an error creating your request. Please try again or call management.</Sms>
        </Response>
      `);
    }
  }

  // 6. Create Request (Mapping fields same as Web API)
  const request = await prisma.maintenanceRequest.create({
    data: {
      code,
      propertyId: property.id,
      createdBy: user.id,
      description: messageBody,
      unitNumber: user.tenant.unitNumber, // Auto-filled from tenant record
      priority: "medium", // Default priority for SMS
      status: "open",
    },
    include: {
      creator: true,
      assignee: true,
    },
  });

  // 7. Trigger standardized event
  Events.publish(MaintenanceEvents.CREATED, {
    requestId: request.id,
    propertyId: property.id,
  });

  // 8. TwiML Confirmation
  res.type("text/xml");
  return res.send(`
    <Response>
      <Sms>Hi ${user.name}, maintenance request #${code} has been created for ${property.name}, unit ${user.tenant.unitNumber || "N/A"}.</Sms>
    </Response>
  `);
});