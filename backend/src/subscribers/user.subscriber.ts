import { Events, UserEvents, UserInviteCreatedPayload } from "../lib/events";
import { prisma } from "../lib/prisma";
import { emailService } from "../services/email";
import { env } from "../config/env";

Events.subscribe(UserEvents.INVITE_CREATED, async (payload: UserInviteCreatedPayload) => {
  const { inviteId, sendEmail, sendPhone } = payload;

  const invite = await prisma.invite.findUnique({
    where: { id: inviteId },
    include: { organization: true },
  });

  if (!invite) return;

  if (env.NODE_ENV !== "production") {
    console.log("[INVITE-LOG] Token:", invite.token);
  }

  if (sendEmail && invite.email) {
    await emailService.send({
      to: invite.email,
      templateKey: "USER_INVITE",
      data: {
        orgName: invite.organization.name,
        role: invite.role,
        acceptLink: `${env.FRONTEND_URL}/invites/${invite.token}/accept`,
      },
    });
  }

  if (sendPhone && invite.phone) {
    // future: smsService.send(...)
    console.log(`[SMS-LOG] Invite SMS would be sent to ${invite.phone}`);
  }
});
