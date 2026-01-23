// routes/organization.ts
import express from "express";
import { propertiesRouter } from "./properties";
import { validate } from "../middleware/validate";
import { organizationRegistrationSchema, organizationIdParamSchema } from "../schema/organizations";
import { register } from "../controller/organizations";
import { authenticate } from "../middleware/authenticate";
import { resolveOrganization } from "../middleware/resolveOrganization";

const organizationsRouter = express.Router();

organizationsRouter.post("/register", validate({ body: organizationRegistrationSchema }), register);

organizationsRouter.use(
  "/:organizationId",
  validate({ params: organizationIdParamSchema }),
  authenticate,
  resolveOrganization
);

organizationsRouter.use("/:organizationId/properties", propertiesRouter);

export { organizationsRouter };
