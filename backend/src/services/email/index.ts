import { Resend } from "resend";
import Bottleneck from "bottleneck"; // Import Bottleneck
import { env } from "../../config/env";
import { EMAIL_TEMPLATES, EmailTemplateKey } from "./templates";

const resend = new Resend(env.RESEND_API_KEY);

// Create a limiter: 2 requests per 1200ms
const limiter = new Bottleneck({
  minTime: 650,
  maxConcurrent: 1
});

export const emailService = {
  async send<T extends Record<string, any>>({
    to,
    templateKey,
    data,
  }: {
    to: string;
    templateKey: EmailTemplateKey;
    data: T;
  }) {
    const template = EMAIL_TEMPLATES[templateKey];
    const subject = typeof template.subject === "function" ? template.subject(data) : template.subject;

    // Wrap the sending logic in the limiter
    return limiter.schedule(async () => {
      try {
        const { data: resData, error } = await resend.emails.send({
          from: "notifications@resend.dev",
          to,
          subject,
          html: template.html(data),
        });

        if (error) {
          console.error(`[Resend Error] ${templateKey}:`, error);
          return;
        }

        return resData;
      } catch (error) {
        console.error(`[EmailService Error] ${templateKey}:`, error);
      }
    });
  },
};