import { z } from "zod";

const userId = z.uuid("Invalid user ID");
const propertyId = z.uuid("Invalid property ID");
const organizationId = z.uuid("Invalid organization ID");
const unitNumber = z.string().trim().optional();
const statusEnum = z.enum(["active", "archived", "all"]);
const archived = z.boolean();

export const tenantsByPropertyIdParamsSchema = z.strictObject({
  organizationId,
  propertyId: propertyId.optional(),
});

export const tenantByIdParamsSchema = z.strictObject({
  organizationId,
  propertyId,
  userId,
});

export const tenantQuerySchema = z.object({
  status: statusEnum.default("active"),
});

export const updateTenantBodySchema = z
  .strictObject({
    unitNumber: unitNumber.optional(),
    archived: archived.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });
