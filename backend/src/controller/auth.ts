import { asyncHandler } from "../helpers/asyncHandler";
import { prisma } from "../lib/prisma";
import bcrypt from "bcrypt";
import { TokenPayload } from "../helpers/token";
import { createSessionAndTokens } from "../helpers/authHelpers";
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
    ...(user.orgAdmin?.organizationId && {
      organizationId: user.orgAdmin.organizationId,
    }),
  };

  const { accessToken } = await createSessionAndTokens(tokenPayload, req, res);

  return res.status(200).json({
    message: "Login successful",
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
});
