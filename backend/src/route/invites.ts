// routes/invite.ts
import express from "express";
import { authenticate } from "../middleware/authenticate";
import { validate } from "../middleware/validate";
import { authorize } from "../middleware/authorize";
import { sendInvite, bulkSendInvites, acceptInvite, getInviteDetails } from "../controller/invites";
import {
  sendInviteBodySchema,
  sendInviteQuerySchema,
  inviteParamsSchema,
  acceptInviteBodySchema,
  bulkSendInviteBodySchema
} from "../schema/invites";

const inviteRouter = express.Router();

// POST /api/invites
inviteRouter.post(
  "/",
  authenticate,
  validate({ query: sendInviteQuerySchema, body: sendInviteBodySchema }),
  authorize({ orgRoles: ["org_owner", "org_admin"] }),
  sendInvite
);

inviteRouter.post(
  "/bulk",
  authenticate,
  validate({ query: sendInviteQuerySchema, body: bulkSendInviteBodySchema }),
  authorize({ orgRoles: ["org_owner", "org_admin"] }),
  bulkSendInvites
);

inviteRouter.get("/:token", validate({ params: inviteParamsSchema }), getInviteDetails);

// POST /api/invites/:token/accept
inviteRouter.post(
  "/:token/accept",
  validate({ params: inviteParamsSchema, body: acceptInviteBodySchema }),
  acceptInvite
);

export { inviteRouter };
