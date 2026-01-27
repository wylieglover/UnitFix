// routes/organization.ts
import express from "express";
import { propertiesRouter } from "./properties";
import { validate } from "../middleware/validate";
import { organizationRegistrationSchema, organizationIdParamSchema, provisionPhoneSchema } from "../schema/organizations";
import { register, getDashboard, provisionOrganizationPhone } from "../controller/organizations";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { resolveOrganization } from "../middleware/resolveOrganization";

const organizationsRouter = express.Router();

organizationsRouter.post("/register", validate({ body: organizationRegistrationSchema }), register);

organizationsRouter.use(
  "/:organizationId",
  validate({ params: organizationIdParamSchema }),
  authenticate,
  resolveOrganization
);

organizationsRouter.get(
  "/:organizationId/dashboard",
  authorize({ orgRoles: ["org_owner", "org_admin"] }),
  getDashboard
);

organizationsRouter.post(
  "/:organizationId/phone",
  validate({ body: provisionPhoneSchema }),
  authorize({ orgRoles: ["org_owner"] }),
  provisionOrganizationPhone
);

organizationsRouter.use("/:organizationId/properties", propertiesRouter);

export { organizationsRouter };
