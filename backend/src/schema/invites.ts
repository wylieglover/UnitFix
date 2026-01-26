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

    email,
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

      if (!unitNumber) {
        ctx.addIssue({
          code: "custom",
          message: "Tenant invite requires unitNumber",
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

const bulkInviteItemSchema = z.object({
  email: email,
  phone: phone.optional(),
  unitNumber: unitNumber.optional(), // Optional here because staff don't have units
});

export const bulkSendInviteBodySchema = z.object({
  role: z.enum(["org_admin", "staff", "tenant"]), 
  propertyId: propertyId.optional(), // Now optional at top level
  maintenanceRole: z.enum(["manager", "member"]).optional(),
  invites: z.array(bulkInviteItemSchema)
    .min(1, "At least one invite is required")
    .max(100, "Maximum 100 invites per batch"),
}).superRefine((body, ctx) => {
  const { role, propertyId, maintenanceRole, invites } = body;

  // 1. Org Admin Rules: No property, no maintenance role, no units
  if (role === "org_admin") {
    if (propertyId || maintenanceRole) {
      ctx.addIssue({
        code: "custom",
        message: "Org Admin invites cannot have a property or maintenance role",
      });
    }
    invites.forEach((inv, i) => {
      if (inv.unitNumber) {
        ctx.addIssue({ code: "custom", path: ["invites", i, "unitNumber"], message: "Org Admins don't have units" });
      }
    });
  }

  // 2. Staff Rules: Needs property + maintenance role. No units.
  if (role === "staff") {
    if (!propertyId || !maintenanceRole) {
      ctx.addIssue({ code: "custom", message: "Staff invites require a property and maintenance role" });
    }
    invites.forEach((inv, i) => {
      if (inv.unitNumber) {
        ctx.addIssue({ code: "custom", path: ["invites", i, "unitNumber"], message: "Staff don't have units" });
      }
    });
  }

  // 3. Tenant Rules: Needs property + unit numbers. No maintenance role.
  if (role === "tenant") {
    if (!propertyId || maintenanceRole) {
      ctx.addIssue({ code: "custom", message: "Tenant invites require a property and no maintenance role" });
    }
    invites.forEach((inv, i) => {
      if (!inv.unitNumber) {
        ctx.addIssue({ code: "custom", path: ["invites", i, "unitNumber"], message: "Unit number is required for tenants" });
      }
    });
  }
});

export const inviteParamsSchema = z.strictObject({
  token,
});

export const acceptInviteBodySchema = z.object({
  name: name.optional(),              // Required for new users, not for existing
  password: passwordWithRequirements.optional(), // Required for new users, not for existing
  phone: phone.optional(),            // Always optional
  unitNumber: unitNumber.optional(),  // Override invite's unit if needed
});
