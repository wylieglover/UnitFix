// controller/organization.ts
import { asyncHandler } from "../helpers/asyncHandler";
import { prisma } from "../lib/prisma";
import bcrypt from "bcrypt";
import { TokenPayload } from "../helpers/token";
import { createSessionAndTokens } from "../helpers/authHelpers";
import { formatUser } from "../helpers/userHelpers";
import { formatOrganization } from "../helpers/organizationHelpers";
import { twilioService } from "../services/twilio";

export const register = asyncHandler(async (req, res, next) => {
  const { organizationName, contactInfo, name, email, password } = res.locals.body;

  // Check if email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return res.status(409).json({ error: "Email already registered" });
  }

  // Check if org name already exists
  const existingOrg = await prisma.organization.findUnique({
    where: { name: organizationName },
  });

  if (existingOrg) {
    return res.status(409).json({ error: "Organization name already taken" });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  // Create User + Organization + OrgAdmin in one transaction
  const { user, organization } = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name,
        email,
        passwordHash,
        userType: "org_owner",
      },
      select: {
        id: true,
        opaqueId: true,
        name: true,
        email: true,
        userType: true,
      },
    });

    const organization = await tx.organization.create({
      data: {
        name: organizationName,
        contactInfo,
      },
      select: {
        id: true,
        opaqueId: true,
        name: true,
        contactInfo: true,
      },
    });

    await tx.orgAdmin.create({
      data: {
        userId: user.id,
        organizationId: organization.id,
      },
    });

    return { user, organization };
  });

  // Create session and tokens
  const tokenPayload: TokenPayload = {
    userId: user.id,                           
    userType: "org_owner",
    organizationId: organization.id,            
    organizationOpaqueId: organization.opaqueId, 
  };

  const { accessToken } = await createSessionAndTokens(tokenPayload, req, res);

  return res.status(201).json({
    message: "Organization registered successfully",
    accessToken,
    organization: formatOrganization(organization),
    user: formatUser(user),
  });
});

export const getDashboard = asyncHandler(async (req, res, next) => {
  const { organization } = res.locals;

  // Get all stats in parallel
  const [
    propertyCount,
    staffCount,
    tenantCount,
    openRequestCount,
    inProgressRequestCount,
    completedRequestCount,
  ] = await Promise.all([
    // Count active properties
    prisma.property.count({
      where: {
        organizationId: organization.id,
        archivedAt: null,
      },
    }),

    // Count active staff across all properties
    prisma.propertyStaff.count({
      where: {
        property: {
          organizationId: organization.id,
        },
        archivedAt: null,
      },
    }),

    // Count active tenants across all properties
    prisma.tenant.count({
      where: {
        property: {
          organizationId: organization.id,
        },
        archivedAt: null,
      },
    }),

    // Count open requests
    prisma.maintenanceRequest.count({
      where: {
        property: {
          organizationId: organization.id,
        },
        status: "open",
        archivedAt: null,
      },
    }),

    // Count in-progress requests
    prisma.maintenanceRequest.count({
      where: {
        property: {
          organizationId: organization.id,
        },
        status: "in_progress",
        archivedAt: null,
      },
    }),

    // Count completed requests
    prisma.maintenanceRequest.count({
      where: {
        property: {
          organizationId: organization.id,
        },
        status: "completed",
        archivedAt: null,
      },
    }),
  ]);

  return res.status(200).json({
    organization: {
      id: organization.opaqueId,
      name: organization.name,
    },
    stats: {
      properties: propertyCount,
      staff: staffCount,
      tenants: tenantCount,
      requests: {
        open: openRequestCount,
        inProgress: inProgressRequestCount,
        completed: completedRequestCount,
        total: openRequestCount + inProgressRequestCount + completedRequestCount,
      },
    },
  });
});

export const provisionOrganizationPhone = asyncHandler(async (req, res) => {
  const { organization } = res.locals;
  const { areaCode } = res.locals.body;

  if (organization.twilioPhoneNumber) {
    return res.status(400).json({ 
      error: "Organization already has a phone number provisioned" 
    });
  }

  // 1. Provision via Twilio Service
  const provisioned = await twilioService.provisionOrganizationNumber(
    areaCode, 
    organization.opaqueId
  );

  // 2. Update Organization with Twilio details AND all properties
  const updatedOrg = await prisma.$transaction(async (tx) => {
    // Update organization
    const org = await tx.organization.update({
      where: { id: organization.id },
      data: {
        twilioPhoneNumber: provisioned.phoneNumber,
        twilioSid: provisioned.twilioSid,
      }
    });

    // Update all properties with this phone number
    await tx.property.updateMany({
      where: { 
        organizationId: organization.id,
        maintenancePhoneNumber: null // Only update properties without a number
      },
      data: {
        maintenancePhoneNumber: provisioned.phoneNumber,
      },
    });

    return org;
  });

  return res.status(200).json({
    message: "Phone number provisioned successfully for organization and all properties",
    organization: formatOrganization(updatedOrg),
    phoneNumber: provisioned.phoneNumber,
  });
});