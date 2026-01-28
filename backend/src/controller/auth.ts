import { env } from "../config/env";
import { asyncHandler } from "../helpers/asyncHandler";
import { prisma } from "../lib/prisma";
import bcrypt from "bcrypt";
import { TokenPayload, hashRefreshToken } from "../helpers/token";
import { createSessionAndTokens, verifyAndRotateRefreshToken } from "../helpers/authHelpers";
import { formatUser } from "../helpers/userHelpers";
import { formatOrganization, organizationSelect } from "../helpers/organizationHelpers";
import { formatProperty, propertySelect } from "../helpers/propertyHelpers";

export const login = asyncHandler(async (req, res, next) => {
  const { email, password } = res.locals.body;

  // Find user with all their role relations
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      orgAdmin: {
        include: {
          organization: {
            select: {
              ...organizationSelect,
              id: true, // Still need for internal logic
            },
          },
        },
      },
      propertyStaff: {
        include: {
          property: {
            select: {
              ...propertySelect,
              id: true, // Still need for internal logic
              organization: {
                select: {
                  ...organizationSelect,
                  id: true, // Still need for internal logic
                },
              },
            },
          },
        },
      },
      tenant: {
        include: {
          property: {
            select: {
              ...propertySelect,
              id: true, // Still need for internal logic
              organization: {
                select: {
                  ...organizationSelect,
                  id: true, // Still need for internal logic
                },
              },
            },
          },
        },
      },
    },
  });

  if (!user) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const isValidPassword = await bcrypt.compare(password, user.passwordHash);

  if (!isValidPassword) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  if (user.orgAdmin?.archivedAt) {
    return res.status(403).json({ error: "Account has been deactivated" });
  }

  // Build token payload with ONLY opaqueIds
  const tokenPayload: TokenPayload = {
    userId: user.opaqueId, 
    userType: user.userType,
  };

  if (user.orgAdmin?.organization) {
    tokenPayload.organizationId = user.orgAdmin.organization.opaqueId;
  } else if (user.propertyStaff.length > 0) {
    const firstStaff = user.propertyStaff[0];
    if (firstStaff?.property) {
      tokenPayload.propertyId = firstStaff.property.opaqueId; 
      if (firstStaff.property.organization) {
        tokenPayload.organizationId = firstStaff.property.organization.opaqueId; 
      }
    }
  } else if (user.tenant?.property) {
    tokenPayload.propertyId = user.tenant.property.opaqueId;
    tokenPayload.organizationId = user.tenant.property.organization.opaqueId;
  }

  const { accessToken } = await createSessionAndTokens(tokenPayload, req, res);

  // Get organization for different user types
  let organization = null;
  if (user.orgAdmin?.organization) {
    organization = user.orgAdmin.organization;
  } else if (user.propertyStaff.length > 0) {
    const firstStaff = user.propertyStaff[0];
    if (firstStaff?.property?.organization) {
      organization = firstStaff.property.organization;
    }
  } else if (user.tenant?.property?.organization) {
    organization = user.tenant.property.organization;
  }

  return res.status(200).json({
    message: "Login successful",
    accessToken,
    user: formatUser(user),
    ...(organization && {
      organization: formatOrganization(organization),
    }),
    ...(user.propertyStaff.length > 0 && {
      properties: user.propertyStaff.map((s) => formatProperty(s.property)),
    }),
    ...(user.tenant && {
      property: formatProperty(user.tenant.property),
    }),
  });
});

export const refresh = asyncHandler(async (req, res, next) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ error: "Refresh token required" });
  }

  try {
    const { accessToken, userId } = await verifyAndRotateRefreshToken(
      refreshToken,
      req,
      res
    );

    const user = await prisma.user.findUnique({
      where: { opaqueId: userId }, 
      include: {
        orgAdmin: {
          include: {
            organization: {
              select: {
                ...organizationSelect,
                id: true,
              },
            },
          },
        },
        propertyStaff: {
          include: {
            property: {
              select: {
                ...propertySelect,
                id: true,
              },
            },
          },
        },
        tenant: {
          include: {
            property: {
              select: {
                ...propertySelect,
                id: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json({
      message: "Token refreshed successfully",
      accessToken,
      user: formatUser(user),
      ...(user.orgAdmin && {
        organization: formatOrganization(user.orgAdmin.organization),
      }),
      ...(user.propertyStaff.length > 0 && {
        properties: user.propertyStaff.map((s) => formatProperty(s.property)),
      }),
      ...(user.tenant && {
        property: formatProperty(user.tenant.property),
      }),
    });
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired refresh token" });
  }
});

export const logout = asyncHandler(async (req, res, next) => {
  const refreshToken = req.cookies.refreshToken;

  if (refreshToken) {
    try {
      const refreshTokenHash = hashRefreshToken(refreshToken);

      // Delete the session
      await prisma.session.deleteMany({
        where: { refreshTokenHash },
      });
    } catch (error) {
      console.error("Error during logout:", error);
      // Continue even if session deletion fails
    }
  }

  // Clear the cookie
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
  });

  return res.status(200).json({
    message: "Logged out successfully",
  });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = res.locals.body;
  const { userId } = res.locals.user as TokenPayload;

  // Get user with password hash
  const user = await prisma.user.findUnique({
    where: { opaqueId: userId },
    select: { id: true, passwordHash: true },
  });

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  // Verify current password
  const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isValid) {
    return res.status(401).json({ error: "Current password is incorrect" });
  }

  // Hash new password
  const newPasswordHash = await bcrypt.hash(newPassword, 10);

  // Update password
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: newPasswordHash },
  });

  return res.status(200).json({
    message: "Password changed successfully",
  });
});