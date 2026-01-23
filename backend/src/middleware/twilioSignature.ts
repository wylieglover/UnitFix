import { Request, Response, NextFunction } from "express";
import twilio from "twilio";
import { env } from "../config/env";

export const validateTwilioRequest = (req: Request, res: Response, next: NextFunction) => {
  // In production, Twilio sends the X-Twilio-Signature header
  const signature = req.header("X-Twilio-Signature");

  // We need the full URL including protocol and host
  const url = `${env.BACKEND_URL}${req.originalUrl}`;

  // Twilio's body is usually URL-encoded
  const params = req.body;

  const isValid = twilio.validateRequest(env.TWILIO_AUTH_TOKEN, signature || "", url, params);

  if (!isValid && env.NODE_ENV === "production") {
    return res.status(401).send("Invalid Twilio Signature");
  }

  next();
};
