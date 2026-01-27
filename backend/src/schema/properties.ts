import { z } from "zod";

const name = z.string().trim().min(2, "Property name must be at least 2 characters");
const street = z.string().trim().min(1, "Street address is required");
const city = z.string().trim().min(1, "City is required");
const state = z.string().trim().length(2, "State must be 2 characters");
const zip = z
  .string()
  .trim()
  .regex(/^\d{5}(-\d{4})?$/, "Invalid ZIP code format");
const country = z.string().trim().default("USA");
const maintenancePhoneNumber = z.string().trim();

const propertyId = z.uuid("Invalid property ID");
const organizationId = z.uuid("Invalid organization ID");

const statusEnum = z.enum(["active", "archived", "all"]);
const archived = z.boolean();

export const createPropertyBodySchema = z.strictObject({
  name,
  street,
  city,
  state: state.optional(),
  zip,
  country,
});

export const updatePropertyBodySchema = z
  .strictObject({
    name: name.optional(),
    street: street.optional(),
    city: city.optional(),
    state: state.optional(),
    zip: zip.optional(),
    country: country.optional(),
    archived: archived.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

export const propertyByIdParamsSchema = z.strictObject({
  organizationId,
  propertyId,
});

export const propertyQuerySchema = z.object({
  status: statusEnum.default("active"),
});
