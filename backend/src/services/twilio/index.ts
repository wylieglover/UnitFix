// services/twilio/twilioService.ts
import twilio from "twilio";
import { env } from "../../config/env";

const client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);

const DEV_TRIAL_NUMBER = "+18889068142";

export const twilioService = {
  /**
   * Provision phone number for an organization
   */
  async provisionOrganizationNumber(areaCode: string, organizationOpaqueId: string) {
    if (env.NODE_ENV !== "production") {
      console.log(`[Twilio Dev Mode] Simulating provisioning for organization ${organizationOpaqueId}, area code ${areaCode}`);
      return {
        phoneNumber: DEV_TRIAL_NUMBER,
        twilioSid: "DEV_SID_" + organizationOpaqueId,
      };
    }

    try {
      // 1. Search for available numbers
      const available = await client.availablePhoneNumbers("US").local.list({
        areaCode: parseInt(areaCode, 10),
        limit: 1,
      });

      const firstFound = available[0];
      if (!firstFound || !firstFound.phoneNumber) {
        throw new Error(`No numbers available for area code ${areaCode}`);
      }

      const selectedNumber = firstFound.phoneNumber;

      // 2. Purchase the number
      const purchased = await client.incomingPhoneNumbers.create({
        phoneNumber: selectedNumber,
        friendlyName: `Organization: ${organizationOpaqueId}`,

        // 3. Configure Webhooks
        smsUrl: `${env.BACKEND_URL}/api/webhooks/twilio/sms`,
        smsMethod: "POST",
      });

      return {
        phoneNumber: purchased.phoneNumber,
        twilioSid: purchased.sid,
      };
    } catch (error) {
      console.error("[Twilio Provisioning Error]:", error);
      throw error;
    }
  },

  /**
   * Release a Twilio phone number
   */
  async releaseNumber(twilioSid: string) {
    if (env.NODE_ENV !== "production") {
      console.log(`[Twilio Dev Mode] Simulating release of ${twilioSid}`);
      return { success: true };
    }

    try {
      await client.incomingPhoneNumbers(twilioSid).remove();
      return { success: true };
    } catch (error) {
      console.error("[Twilio Release Error]:", error);
      throw error;
    }
  },
};