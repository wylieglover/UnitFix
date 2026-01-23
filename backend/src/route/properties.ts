import express from "express";
import { validate } from "../middleware/validate";
import {
  createPropertyBodySchema,
  propertyByIdParamsSchema,
  propertyQuerySchema,
  updatePropertyBodySchema,
  provisionPhoneSchema,
} from "../schema/properties";
import {
  createProperty,
  listProperties,
  getProperty,
  updateProperty,
  provisionPropertyPhone,
} from "../controller/properties";
import { authorize } from "../middleware/authorize";
import { staffRouter } from "./staff";
import { tenantsRouter } from "./tenants";
import { maintenanceRequestsRouter } from "./maintenanceRequests";
import { resolveProperty } from "../middleware/resolveProperty";

const propertiesRouter = express.Router({ mergeParams: true });

propertiesRouter.post(
  "/",
  validate({ body: createPropertyBodySchema }),
  authorize({ orgRoles: ["org_owner", "org_admin"] }),
  createProperty
);

propertiesRouter.get(
  "/",
  validate({ query: propertyQuerySchema }),
  authorize({ orgRoles: ["org_owner", "org_admin"] }),
  listProperties
);

propertiesRouter.use(
  "/:propertyId",
  validate({ params: propertyByIdParamsSchema }),
  resolveProperty
);

propertiesRouter.get(
  "/:propertyId",
  authorize({
    orgRoles: ["org_owner", "org_admin", "staff"],
    property: { allowStaff: true },
  }),
  getProperty
);

propertiesRouter.put(
  "/:propertyId",
  validate({ body: updatePropertyBodySchema }),
  authorize({ orgRoles: ["org_owner", "org_admin"] }),
  updateProperty
);

propertiesRouter.post(
  "/:propertyId/phone",
  validate({ body: provisionPhoneSchema }),
  authorize({ orgRoles: ["org_owner", "org_admin"] }),
  provisionPropertyPhone
);

propertiesRouter.use("/:propertyId/staff", staffRouter);
propertiesRouter.use("/:propertyId/tenants", tenantsRouter);
propertiesRouter.use("/:propertyId/maintenance-requests", maintenanceRequestsRouter);

export { propertiesRouter };
