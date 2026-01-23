// routes/staff.ts
import express from "express";
import { validate } from "../middleware/validate";
import { authorize } from "../middleware/authorize";
import { resolveUser } from "../middleware/resolveUser";
import { listStaff, getStaff, updateStaff } from "../controller/staff";
import {
  staffByPropertyIdParamsSchema,
  staffByIdParamsSchema,
  updateStaffBodySchema,
  staffQuerySchema,
} from "../schema/staff";

const staffRouter = express.Router({ mergeParams: true });

staffRouter.get(
  "/",
  validate({ params: staffByPropertyIdParamsSchema, query: staffQuerySchema }),
  authorize({
    orgRoles: ["org_owner", "org_admin", "staff"],
    property: { allowStaff: true },
  }),
  listStaff
);

staffRouter.use("/:userId", validate({ params: staffByIdParamsSchema }), resolveUser);

staffRouter.get(
  "/:userId",
  authorize({
    orgRoles: ["org_owner", "org_admin", "staff"],
    property: { allowStaff: true },
  }),
  getStaff
);

staffRouter.put(
  "/:userId",
  validate({ body: updateStaffBodySchema }),
  authorize({ orgRoles: ["org_owner", "org_admin"] }),
  updateStaff
);

export { staffRouter };
