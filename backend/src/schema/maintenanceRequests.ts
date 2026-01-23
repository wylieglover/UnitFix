import { z } from "zod";

/* ------------------ primitives ------------------ */

const description = z
  .string()
  .trim()
  .min(10, "Description must be at least 10 characters")
  .max(1000, "Description cannot exceed 1000 characters");

const unitNumber = z.string().trim().min(1, "Unit number is required");

const priority = z.enum(["low", "medium", "high", "urgent"]);

const status = z.enum(["open", "in_progress", "completed", "cancelled"]);

const code = z.string().length(4, "Code must be 4 characters");

const assignedTo = z.uuid("Invalid user ID");

const propertyId = z.uuid("Invalid property ID");

const organizationId = z.uuid("Invalid organization ID");

/* ------------------ Create Request ------------------ */

export const createMaintenanceRequestBodySchema = z.strictObject({
  description,
  unitNumber: unitNumber.optional(), // Optional - auto-filled for tenants
  priority: priority.default("medium"),
});

/* ------------------ List Requests (Query Filters) ------------------ */

const statusFilter = z.enum(["open", "in_progress", "completed", "cancelled", "all"]);

export const listMaintenanceRequestsQuerySchema = z.object({
  status: statusFilter.default("open"),
  priority: priority.optional(),
  assignedTo: assignedTo.optional(),
  createdBy: assignedTo.optional(),
});

/* ------------------ Get Single Request ------------------ */

export const maintenanceRequestParamsSchema = z.strictObject({
  organizationId,
  propertyId,
  code,
});

/* ------------------ Update Request ------------------ */

export const updateMaintenanceRequestBodySchema = z
  .object({
    description: description.optional(),
    priority: priority.optional(),
    status: status.optional(),
    assignedTo: assignedTo.optional().nullable(), // Can unassign with null
    unitNumber: unitNumber.optional(),
    archived: z.boolean().optional(), // Same pattern as properties/staff/tenants
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });
