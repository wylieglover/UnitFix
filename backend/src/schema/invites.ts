import { z } from "zod";
import { normalizePhone, isValidE164 } from "../helpers/phone";

/* ------------------ primitives ------------------ */

const name = z.string().trim().min(1, "Name is required");

const email = z.string().trim().toLowerCase().pipe(z.email("Invalid email address"));

const phone = z
  .string()
  .trim()
  .min(7, "Invalid phone number")
  .transform(normalizePhone)
  .refine(isValidE164, "Phone must be a valid format");

const token = z.string().min(1, "Token is required");

const propertyId = z.uuid();

const unitNumber = z.string().trim().min(1, "Unit number is required");

const passwordWithRequirements = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password cannot exceed 72 characters")
  .refine((val) => val === val.trim(), {
    message: "Password cannot start or end with spaces",
  })
  .regex(/[A-Z]/, "Password must contain an uppercase letter")
  .regex(/[a-z]/, "Password must contain a lowercase letter")
  .regex(/[0-9]/, "Password must contain a number")
  .regex(/[^A-Za-z0-9]/, "Password must contain a special character");

export const sendInviteQuerySchema = z
  .object({
    email: z
      .enum(["true", "false"])
      .optional()
      .transform((v) => v === "true"),
    phone: z
      .enum(["true", "false"])
      .optional()
      .transform((v) => v === "true"),
  })
  .refine((q) => q.email || q.phone, {
    message: "At least one delivery method (email or phone) must be true",
  });

export const sendInviteBodySchema = z
  .object({
    role: z.enum(["org_admin", "staff", "tenant"]),

    email: z.string().trim().toLowerCase().pipe(z.email()),
    phone: phone.optional(),

    propertyId: propertyId.optional(),
    maintenanceRole: z.enum(["manager", "member"]).optional(),
    unitNumber: unitNumber.optional(),
  })
  .superRefine((body, ctx) => {
    const { role, propertyId, maintenanceRole, unitNumber } = body;

    if (role === "staff") {
      if (!propertyId || !maintenanceRole) {
        ctx.addIssue({
          code: "custom",
          message: "Staff invite requires propertyId and maintenanceRole",
        });
      }

      if (unitNumber) {
        ctx.addIssue({
          code: "custom",
          message: "Staff invite cannot include unitNumber",
        });
      }
    }

    if (role === "org_admin") {
      if (propertyId || maintenanceRole || unitNumber) {
        ctx.addIssue({
          code: "custom",
          message: "Org admin invite cannot include propertyId, maintenanceRole, or unitNumber",
        });
      }
    }

    if (role === "tenant") {
      if (!propertyId) {
        ctx.addIssue({
          code: "custom",
          message: "Tenant invite requires propertyId",
        });
      }

      if (maintenanceRole) {
        ctx.addIssue({
          code: "custom",
          message: "Tenant invite cannot include maintenanceRole",
        });
      }
    }
  });

export const inviteParamsSchema = z.strictObject({
  token,
});

export const acceptInviteBodySchema = z.strictObject({
  name,
  password: passwordWithRequirements,
  unitNumber: unitNumber.optional(),
});
