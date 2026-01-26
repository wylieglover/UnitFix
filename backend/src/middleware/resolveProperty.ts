import { asyncHandler } from "../helpers/asyncHandler";
import { prisma } from "../lib/prisma";

export const resolveProperty = asyncHandler(async (req, res, next) => {
  const { propertyId } = res.locals.params;
  const { organization } = res.locals;
  
  const property = await prisma.property.findUnique({
    where: { opaqueId: propertyId },
  });

  if (!property || property.organizationId !== organization.id) {
    return res.status(404).json({ error: "Property not found" });
  }

  res.locals.property = property;
  return next();
});