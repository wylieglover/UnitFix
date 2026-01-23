import express from "express";
import { validate } from "../middleware/validate";
import { authorize } from "../middleware/authorize";
import { resolveUser } from "../middleware/resolveUser";
import { listTenants, getTenant, updateTenant } from "../controller/tenants";
import {
  tenantsByPropertyIdParamsSchema,
  tenantByIdParamsSchema,
  updateTenantBodySchema,
  tenantQuerySchema,
} from "../schema/tenants";

const tenantsRouter = express.Router({ mergeParams: true });

// List all tenants for a property
tenantsRouter.get(
  "/",
  validate({ params: tenantsByPropertyIdParamsSchema, query: tenantQuerySchema }),
  authorize({
    orgRoles: ["org_owner", "org_admin", "staff"],
    property: { allowStaff: true },
  }),
  listTenants
);

// Apply resolveUser to all routes with /:userId
tenantsRouter.use("/:userId", validate({ params: tenantByIdParamsSchema }), resolveUser);

// Get specific tenant
tenantsRouter.get(
  "/:userId",
  authorize({
    orgRoles: ["org_owner", "org_admin", "staff"],
    property: { allowStaff: true },
  }),
  getTenant
);

// Update tenant
tenantsRouter.put(
  "/:userId",
  validate({ body: updateTenantBodySchema }),
  authorize({
    orgRoles: ["org_owner", "org_admin"],
    property: { allowStaff: true, maintenanceRoles: ["manager"] },
  }),
  updateTenant
);

export { tenantsRouter };
