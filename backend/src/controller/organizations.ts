// controller/organization.ts
import { asyncHandler } from "../helpers/asyncHandler";
import { prisma } from "../lib/prisma";
import bcrypt from "bcrypt";
import { TokenPayload } from "../helpers/token";
import { createSessionAndTokens } from "../helpers/authHelpers";
import { formatUser } from "../helpers/userHelpers";
import { formatOrganization } from "../helpers/organizationHelpers";

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
  };

  const { accessToken } = await createSessionAndTokens(tokenPayload, req, res);

  return res.status(201).json({
    message: "Organization registered successfully",
    accessToken,
    organization: formatOrganization(organization),
    user: formatUser(user),
  });
});
