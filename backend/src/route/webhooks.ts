import express from "express";
import { validate } from "../middleware/validate";
import { twilioSmsSchema } from "../schema/webhooks";
import { validateTwilioRequest } from "../middleware/twilioSignature";
import { handleIncomingSms } from "../controller/webhooks/twilio";

const webhooksRouter = express.Router();

webhooksRouter.use(express.urlencoded({ extended: false }));

webhooksRouter.post(
  "/twilio/sms/incoming",
  validateTwilioRequest,
  validate({ body: twilioSmsSchema }),
  handleIncomingSms
);

export { webhooksRouter };
