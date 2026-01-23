import { z } from "zod";

export const twilioSmsSchema = z.object({
  From: z.string().min(1, "Sender phone is required"),
  To: z.string().min(1, "Recipient phone is required"),
  Body: z.string().min(1, "Message body cannot be empty"),
});
