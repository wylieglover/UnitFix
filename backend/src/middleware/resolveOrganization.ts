import { asyncHandler } from "../helpers/asyncHandler";
import { prisma } from "../lib/prisma";

export const resolveOrganization = asyncHandler(async (req, res, next) => {
  const { organizationId } = res.locals.params;

  const organization = await prisma.organization.findUnique({
    where: { opaqueId: organizationId },
    select: { id: true, name: true },
  });

  if (!organization) {
    return res.status(404).json({ error: "Organization not found" });
  }

  res.locals.organization = organization;
  return next();
});
