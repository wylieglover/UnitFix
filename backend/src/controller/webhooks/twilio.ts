import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { Events, MaintenanceEvents } from "../../lib/events";
import { generateRequestCode } from "../../helpers/maintenanceRequestHelpers";
import { asyncHandler } from "../../helpers/asyncHandler";

export const handleIncomingSms = asyncHandler(async (req: Request, res: Response) => {
  const { From: senderPhone, To: twilioPhone, Body: messageBody } = res.locals.body;

  // 1. Resolve Property context
  const property = await prisma.property.findUnique({
    where: { maintenancePhoneNumber: twilioPhone },
  });

  if (!property) {
    console.error(`[Twilio Webhook] No property found for number: ${twilioPhone}`);
    return res.status(404).send("Property not found");
  }

  // 2. Resolve User/Tenant context
  const user = await prisma.user.findUnique({
    where: { phone: senderPhone },
    include: { tenant: true },
  });

  // 3. Validation: Match logic from createMaintenanceRequest (Tenant only)
  if (
    !user ||
    user.userType !== "tenant" ||
    !user.tenant ||
    user.tenant.propertyId !== property.id
  ) {
    console.log(`[Twilio Webhook] Unauthorized or unrecognized text from ${senderPhone}`);
    return res.status(200).send("User not recognized");
  }

  // 4. Generate unique code (Consistent with createMaintenanceRequest logic)
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
      // For SMS, we still want to respond nicely to the user
      res.type("text/xml");
      return res.send(`
        <Response>
          <Sms>Sorry, we encountered an error creating your request. Please try again or call management.</Sms>
        </Response>
      `);
    }
  }

  // 5. Create Request (Mapping fields same as Web API)
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

  // 6. Trigger standardized event
  Events.publish(MaintenanceEvents.CREATED, {
    requestId: request.id,
    propertyId: property.id,
  });

  // 7. TwiML Confirmation
  res.type("text/xml");
  return res.send(`
    <Response>
      <Sms>Hi ${user.name}, maintenance request #${code} has been created for unit ${user.tenant.unitNumber || "N/A"}.</Sms>
    </Response>
  `);
});
