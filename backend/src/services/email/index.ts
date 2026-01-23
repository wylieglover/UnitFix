import { Resend } from "resend";
import { env } from "../../config/env";
import { EMAIL_TEMPLATES, EmailTemplateKey } from "./templates";

const resend = new Resend(env.RESEND_API_KEY);

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

    const subject =
      typeof template.subject === "function" ? template.subject(data) : template.subject;

    try {
      const { data: resData, error } = await resend.emails.send({
        from: "notifications@resend.dev", // Update to your domain when ready
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
  },
};
