import express from "express";
import { validate } from "../middleware/validate";
import { authorize } from "../middleware/authorize";
import {
  createMaintenanceRequest,
  listMaintenanceRequests,
  getMaintenanceRequest,
  updateMaintenanceRequest,
} from "../controller/maintenanceRequests";
import {
  createMaintenanceRequestBodySchema,
  listMaintenanceRequestsQuerySchema,
  maintenanceRequestParamsSchema,
  updateMaintenanceRequestBodySchema,
} from "../schema/maintenanceRequests";

const maintenanceRequestsRouter = express.Router({ mergeParams: true });

// Create maintenance request
maintenanceRequestsRouter.post(
  "/",
  validate({ body: createMaintenanceRequestBodySchema }),
  authorize({
    orgRoles: ["org_owner", "org_admin", "staff", "tenant"],
    property: { allowStaff: true, allowTenants: true },
  }),
  createMaintenanceRequest
);

// List maintenance requests
maintenanceRequestsRouter.get(
  "/",
  validate({ query: listMaintenanceRequestsQuerySchema }),
  authorize({
    orgRoles: ["org_owner", "org_admin", "staff", "tenant"],
    property: { allowStaff: true, allowTenants: true },
  }),
  listMaintenanceRequests
);

// Get single maintenance request by code
maintenanceRequestsRouter.get(
  "/:code",
  validate({ params: maintenanceRequestParamsSchema }),
  authorize({
    orgRoles: ["org_owner", "org_admin", "staff", "tenant"],
    property: { allowStaff: true, allowTenants: true },
  }),
  getMaintenanceRequest
);

// Update maintenance request
maintenanceRequestsRouter.put(
  "/:code",
  validate({ params: maintenanceRequestParamsSchema, body: updateMaintenanceRequestBodySchema }),
  authorize({
    orgRoles: ["org_owner", "org_admin", "staff"],
    property: { allowStaff: true },
  }),
  updateMaintenanceRequest
);

export { maintenanceRequestsRouter };
