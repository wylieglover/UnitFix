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
  formatInviteBatchItem
} from "../helpers/inviteHelpers";
import { formatProperty } from "../helpers/propertyHelpers";
import { formatOrganization } from "../helpers/organizationHelpers";
import { formatUser } from "../helpers/userHelpers";
import { createSessionAndTokens } from "../helpers/authHelpers";

export const sendInvite = asyncHandler(async (req, res) => {
  const { email: sendEmail, phone: sendPhone } = res.locals.query;
  const { email, phone, role, propertyId, maintenanceRole, unitNumber } = res.locals.body;
  const { organizationId: orgOpaqueId, userId: userOpaqueId } = res.locals.user as TokenPayload;

  if (!orgOpaqueId) {
    return res.status(400).json({ error: "Organization context required" });
  }

  if (!userOpaqueId) {
    return res.status(401).json({ error: "User context required" });
  }

  // Resolve internal organizationId from opaqueId
  const org = await prisma.organization.findUnique({
    where: { opaqueId: orgOpaqueId },
    select: { id: true }
  });

  if (!org) {
    return res.status(404).json({ error: "Organization not found" });
  }

  const organizationId = org.id;

  // Resolve internal userId from opaqueId
  const user = await prisma.user.findUnique({
    where: { opaqueId: userOpaqueId },
    select: { id: true }
  });

  if (!user) {
    return res.status(401).json({ error: "User not found" });
  }

  const userId = user.id;

  if (sendEmail && !email) {
    return res.status(400).json({ error: "Email required when email=true" });
  }

  if (sendPhone && !phone) {
    return res.status(400).json({ error: "Cannot send via phone - no phone number provided" });
  }

  const actualSendEmail = sendEmail !== false;
  const actualSendPhone = sendPhone === true && !!phone;

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
    if (existingUser && existingUser.userType === "tenant") {
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
      createdBy: userId,
    }
  });

  // Send delivery
  Events.publish(UserEvents.INVITE_CREATED, {
    inviteId: invite.id,
    sendEmail: actualSendEmail,
    sendPhone: actualSendPhone,
  });

  return res.status(201).json({
    message: "Invite sent",
    delivery: {
      email: actualSendEmail,
      phone: actualSendPhone,
    },
    invite: formatInviteMinimal(invite),
  });
});

export const bulkSendInvites = asyncHandler(async (req, res) => {
  const { email: sendEmail, phone: sendPhone } = res.locals.query;
  const { role, propertyId, maintenanceRole, invites } = res.locals.body;
  const { organizationId: orgOpaqueId, userId: userOpaqueId } = res.locals.user as TokenPayload;

  if (!orgOpaqueId) {
    return res.status(400).json({ error: "Organization context required" });
  }

  if (!userOpaqueId) {
    return res.status(401).json({ error: "User context required" });
  }

  // Resolve internal organizationId from opaqueId
  const org = await prisma.organization.findUnique({
    where: { opaqueId: orgOpaqueId },
    select: { id: true }
  });

  if (!org) {
    return res.status(404).json({ error: "Organization not found" });
  }

  const organizationId = org.id;

  // Resolve internal userId from opaqueId
  const user = await prisma.user.findUnique({
    where: { opaqueId: userOpaqueId },
    select: { id: true }
  });

  if (!user) {
    return res.status(401).json({ error: "User not found" });
  }

  const userId = user.id;

  const actualSendEmail = sendEmail !== false;
  const actualSendPhone = sendPhone === true;

  // Validate Property
  const property = await prisma.property.findUnique({
    where: { opaqueId: propertyId },
    select: { id: true, organizationId: true },
  });

  if (!property || property.organizationId !== organizationId) {
    return res.status(404).json({ error: "Property context not found" });
  }

  const results = {
    total: invites.length,
    successful: 0,
    failed: 0,
    errors: [] as { email: string; error: string }[],
    invites: [] as any[],
  };

  // Process Invites
  for (const item of invites) {
    try {
      // Check for existing user
      const existingUser = await prisma.user.findUnique({ where: { email: item.email } });
      if (existingUser) {
        throw new Error(`User with email ${item.email} already exists`);
      }

      // Check for pending invite
      const existingInvite = await prisma.invite.findFirst({
        where: { email: item.email, organizationId, acceptedAt: null },
      });
      if (existingInvite) {
        throw new Error("A pending invite already exists for this email");
      }

      // Create Invite
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

      const invite = await prisma.invite.create({
        data: {
          email: item.email,
          phone: item.phone ?? null,
          role,
          token,
          expiresAt,
          organizationId,
          propertyId: property.id,
          maintenanceRole: maintenanceRole ?? null,
          unitNumber: item.unitNumber ?? null,
          createdBy: userId,
        }
      });

      // Publish Event for Delivery
      Events.publish(UserEvents.INVITE_CREATED, {
        inviteId: invite.id,
        sendEmail: actualSendEmail,
        sendPhone: actualSendPhone,
      });

      results.successful++;
      results.invites.push(formatInviteBatchItem(invite));
    } catch (err: any) {
      results.failed++;
      results.errors.push({
        email: item.email,
        error: err.message || "Failed to process invite",
      });
    }
  }
  
  const status = results.failed > 0 ? 207 : 201;
  return res.status(status).json(results);
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

  const currentUser = res.locals.user as TokenPayload | undefined;

  const invite = await prisma.invite.findUnique({
    where: { token },
    select: {
      ...inviteWithRelationsSelect,
      createdBy: true,
    },
  });

  const validation = validateInvite(invite);
  if (!validation.valid || !invite) {
    return res.status(invite ? 400 : 404).json({ error: validation.error });
  }

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

  // NEW: Security checks for authenticated users
  if (currentUser) {
    const authUser = await prisma.user.findUnique({
      where: { opaqueId: currentUser.userId },
      select: { id: true, email: true, phone: true },
    });

    if (authUser) {
      // Prevent self-acceptance
      if (authUser.id === invite.createdBy) {
        return res.status(403).json({ 
          error: "You cannot accept an invite you created" 
        });
      }

      // Check if email/phone matches
      const emailMatch = invite.email && authUser.email === invite.email;
      const phoneMatch = invite.phone && authUser.phone === invite.phone;

      if (!emailMatch && !phoneMatch) {
        return res.status(403).json({ 
          error: "This invite is for a different user. Please log out to accept this invite." 
        });
      }
    }
  }

  // Check for existing users
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
    select: {
      id: true,
      opaqueId: true,
      name: true,
      email: true,
      phone: true,
      userType: true,
    }
  });

  // Validate required fields for NEW users
  if (!existingUser) {
    if (!name) {
      return res.status(400).json({
        error: "Name is required for new user registration",
      });
    }
    if (!password) {
      return res.status(400).json({
        error: "Password is required for new user registration",
      });
    }
  }

  let user;

  // If user exists, validate and add the new role relationship
  if (existingUser) {
    // Validate user type matches invite
    if (existingUser.userType !== invite.role) {
      return res.status(400).json({
        error: `This user is already registered as ${existingUser.userType}, cannot accept ${invite.role} invite`,
      });
    }

    // For STAFF: Check if already assigned to this property
    if (invite.role === "staff" && invite.propertyId) {
      const existingAssignment = await prisma.propertyStaff.findUnique({
        where: {
          userId_propertyId: {
            userId: existingUser.id,
            propertyId: invite.propertyId,
          },
        },
      });

      if (existingAssignment) {
        return res.status(409).json({
          error: "Staff member is already assigned to this property",
        });
      }
    }

    // For TENANT: Cannot accept another invite (one property only)
    if (invite.role === "tenant") {
      const existingTenant = await prisma.tenant.findUnique({
        where: { userId: existingUser.id },
      });

      if (existingTenant) {
        return res.status(409).json({
          error: "User is already registered as a tenant at another property",
        });
      }
    }

    // For ORG_ADMIN: Cannot accept another invite (one org only)
    if (invite.role === "org_admin") {
      const existingAdmin = await prisma.orgAdmin.findUnique({
        where: { userId: existingUser.id },
      });

      if (existingAdmin) {
        return res.status(409).json({
          error: "User is already registered as an admin for another organization",
        });
      }
    }

    // Add the new role relationship
    await prisma.$transaction(async (tx) => {
      await createRoleRelationship(tx, existingUser.id, invite, unitNumber);

      await tx.invite.update({
        where: { id: invite.id },
        data: { acceptedAt: new Date() },
      });
    });

    user = existingUser;
  } else {
    // New user flow
    const passwordHash = await bcrypt.hash(password!, 10);

    user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name: name!,
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

      await createRoleRelationship(tx, newUser.id, invite, unitNumber);

      await tx.invite.update({
        where: { id: invite.id },
        data: { acceptedAt: new Date() },
      });

      return newUser;
    });
  }

  // Build token payload with ONLY opaqueIds
  const tokenPayload: TokenPayload = {
    userId: user.opaqueId,
    userType: invite.role,
    ...(invite.organization?.opaqueId && {
      organizationId: invite.organization.opaqueId
    }),
  };

  // Only add propertyId for tenants
  if (invite.role === "tenant" && invite.property?.opaqueId) {
    tokenPayload.propertyId = invite.property.opaqueId;
  }

  // For staff, fetch ALL their properties
  let staffProperties = null;
  if (invite.role === "staff") {
    const assignments = await prisma.propertyStaff.findMany({
      where: { userId: user.id },
      select: {
        property: {
          select: {
            opaqueId: true,
            name: true,
          }
        }
      }
    });
    staffProperties = assignments.map(a => ({
      id: a.property.opaqueId,
      name: a.property.name,
    }));
  }

  const { accessToken } = await createSessionAndTokens(tokenPayload, req, res);

  return res.status(201).json({
    message: existingUser 
      ? "Property assignment added successfully" 
      : "Invite accepted successfully",
    accessToken,
    user: formatUser(user),
    organization: invite.organization ? formatOrganization(invite.organization) : null,
    property: invite.property ? formatProperty(invite.property) : null,
    ...(staffProperties && { properties: staffProperties }),
  });
});