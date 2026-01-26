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
              organization: {
                select: {
                  ...organizationSelect,
                  id: true,
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
              id: true,
              organization: {
                select: {
                  ...organizationSelect,
                  id: true,
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

  // Build token payload
  const tokenPayload: TokenPayload = {
    userId: user.id,
    userType: user.userType,
  };

  if (user.orgAdmin?.organizationId) {
    tokenPayload.organizationId = user.orgAdmin.organizationId;
    // Add opaque ID for frontend
    if (user.orgAdmin.organization?.opaqueId) {
      tokenPayload.organizationOpaqueId = user.orgAdmin.organization.opaqueId;
    }
  } else if (user.propertyStaff.length > 0) {
    const firstStaff = user.propertyStaff[0];
    if (firstStaff?.property) {
      tokenPayload.propertyId = firstStaff.propertyId;
      tokenPayload.propertyOpaqueId = firstStaff.property.opaqueId;
      if (firstStaff.property.organization) {
        tokenPayload.organizationId = firstStaff.property.organization.id;
        tokenPayload.organizationOpaqueId = firstStaff.property.organization.opaqueId;
      }
    }
  } else if (user.tenant?.property) {
    tokenPayload.propertyId = user.tenant.propertyId;
    tokenPayload.propertyOpaqueId = user.tenant.property.opaqueId;
    tokenPayload.organizationId = user.tenant.property.organization.id;
    tokenPayload.organizationOpaqueId = user.tenant.property.organization.opaqueId;
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

    // Get fresh user data (similar to login)
    const user = await prisma.user.findUnique({
      where: { id: userId },
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
