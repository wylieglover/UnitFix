// controller/invite.ts
import { asyncHandler } from "../helpers/asyncHandler";
import { prisma, Prisma } from "../lib/prisma";
import { env } from "../config/env";
import crypto from "crypto";
import { Events, UserEvents } from "../lib/events";
import bcrypt from "bcrypt";
import { TokenPayload } from "../helpers/token";
import {
  formatInviteMinimal,
  inviteWithRelationsSelect,
  validateInvite,
  formatInvite,
  createRoleRelationship,
} from "../helpers/inviteHelpers";
import { formatProperty } from "../helpers/propertyHelpers";
import { formatOrganization } from "../helpers/organizationHelpers";
import { formatUser } from "../helpers/userHelpers";
import { createSessionAndTokens } from "../helpers/authHelpers";

export const sendInvite = asyncHandler(async (req, res) => {
  const { email: sendEmail, phone: sendPhone } = res.locals.query;
  const { email, phone, role, propertyId, maintenanceRole, unitNumber } = res.locals.body;
  const { organizationId, userId } = res.locals.user as TokenPayload;

  if (!organizationId) {
    return res.status(400).json({ error: "Organization context required" });
  }

  // Validate delivery data exists
  if (sendEmail && !email) {
    return res.status(400).json({ error: "Email required when email=true" });
  }

  if (sendPhone && !phone) {
    return res.status(400).json({ error: "Phone required when phone=true" });
  }

  // Validate property ownership if applicable
  let internalPropertyId: number | undefined;
  if (propertyId) {
    const property = await prisma.property.findUnique({
      where: { opaqueId: propertyId },
      select: { id: true, organizationId: true },
    });

    if (!property || property.organizationId !== organizationId) {
      return res.status(404).json({ error: "Property not found" });
    }

    internalPropertyId = property.id;
  }

  // Check for existing users
  if (email) {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: "User with this email already exists" });
    }
  }

  if (phone) {
    const existingUser = await prisma.user.findUnique({ where: { phone } });
    if (existingUser) {
      return res.status(409).json({ error: "User with this phone number already exists" });
    }
  }

  // Check for duplicate pending invites
  const existingInvite = await prisma.invite.findFirst({
    where: {
      organizationId,
      acceptedAt: null,
      OR: [email ? { email } : undefined, phone ? { phone } : undefined].filter(Boolean) as any,
    },
  });

  if (existingInvite) {
    return res.status(409).json({ error: "Pending invite already exists" });
  }

  // Create invite
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

  const invite = await prisma.invite.create({
    data: {
      email: email ?? null,
      phone: phone ?? null,
      role,
      token,
      expiresAt,
      organizationId,
      propertyId: internalPropertyId ?? null,
      maintenanceRole: maintenanceRole ?? null,
      unitNumber: unitNumber ?? null,
      createdBy: userId!,
    },
  });

  // Send delivery
  Events.publish(UserEvents.INVITE_CREATED, {
    inviteId: invite.id,
    sendEmail: !!sendEmail,
    sendPhone: !!sendPhone,
  });

  return res.status(201).json({
    message: "Invite sent",
    delivery: {
      email: sendEmail || false,
      phone: sendPhone || false,
    },
    invite: formatInviteMinimal(invite),
  });
});

export const getInviteDetails = asyncHandler(async (req, res, next) => {
  const { token } = res.locals.params;

  const invite = await prisma.invite.findUnique({
    where: { token },
    select: inviteWithRelationsSelect,
  });

  const validation = validateInvite(invite);
  if (!validation.valid) {
    return res.status(invite ? 400 : 404).json({ error: validation.error });
  }

  return res.status(200).json({
    message: "Invite token details",
    invite: formatInvite(invite!),
  });
});

export const acceptInvite = asyncHandler(async (req, res) => {
  const { token } = res.locals.params;
  const { name, password, unitNumber } = res.locals.body;

  const invite = await prisma.invite.findUnique({
    where: { token },
    select: inviteWithRelationsSelect,
  });

  const validation = validateInvite(invite);
  if (!validation.valid || !invite) {
    return res.status(invite ? 400 : 404).json({ error: validation.error });
  }

  // Determine unique identity
  if (!invite.email && !invite.phone) {
    return res.status(500).json({ error: "Invite has no delivery identity" });
  }

  // Validate tenant-specific requirements
  if (invite.role === "tenant") {
    const finalUnitNumber = unitNumber || invite.unitNumber;
    if (!finalUnitNumber) {
      return res.status(400).json({
        error: "Unit number is required for tenant registration",
      });
    }
  }

  // Check for existing users - build OR conditions properly
  const existingUserConditions: Prisma.UserWhereInput[] = [];

  if (invite.email) {
    existingUserConditions.push({ email: invite.email });
  }

  if (invite.phone) {
    existingUserConditions.push({ phone: invite.phone });
  }

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: existingUserConditions,
    },
  });

  if (existingUser) {
    return res.status(409).json({
      error: "User with this email or phone already exists",
    });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name,
        email: invite.email ?? null,
        phone: invite.phone ?? null,
        passwordHash,
        userType: invite.role,
      },
      select: {
        id: true,
        opaqueId: true,
        name: true,
        email: true,
        phone: true,
        userType: true,
      },
    });

    await createRoleRelationship(tx, user.id, invite, unitNumber);

    await tx.invite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    });

    return user;
  });

  // Create session and tokens
  const tokenPayload: TokenPayload = {
    userId: user.id,
    userType: invite.role,
    ...(invite.organizationId && { organizationId: invite.organizationId }),
    ...(invite.propertyId && { propertyId: invite.propertyId }),
  };

  const { accessToken } = await createSessionAndTokens(tokenPayload, req, res);

  return res.status(201).json({
    message: "Invite accepted successfully",
    accessToken,
    user: formatUser(user),
    organization: invite.organization ? formatOrganization(invite.organization) : null,
    property: invite.property ? formatProperty(invite.property) : null,
  });
});
