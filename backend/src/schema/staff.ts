import { z } from "zod";

const userId = z.uuid("Invalid user ID");
const propertyId = z.uuid("Invalid property ID");
const organizationId = z.uuid("Invalid organization ID");
const role = z.enum(["manager", "member"]);
const statusEnum = z.enum(["active", "archived", "all"]);
const archived = z.boolean();

export const staffByPropertyIdParamsSchema = z.strictObject({
  organizationId,
  propertyId: propertyId.optional(),
});

export const staffByIdParamsSchema = z.strictObject({
  organizationId,
  propertyId,
  userId,
});

export const assignStaffBodySchema = z.strictObject({
  userId: z.uuid("Invalid user ID"),
  propertyId: z.uuid("Invalid property ID"),
  role: z.enum(["manager", "member"]),
});

export const assignStaffParamsSchema = z.strictObject({
  organizationId: z.uuid("Invalid organization ID"),
});

export const updateStaffBodySchema = z
  .strictObject({
    role: role.optional(),
    archived: archived.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

export const staffQuerySchema = z.object({
  status: statusEnum.default("active"),
});
