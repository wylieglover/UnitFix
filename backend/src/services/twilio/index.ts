import twilio from "twilio";
import { env } from "../../config/env";

const client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);

const DEV_TRIAL_NUMBER = "+18889068142";

export const twilioService = {
  /**
   * Finds and purchases a phone number, then configures it
   */
  async provisionPropertyNumber(areaCode: string, propertyOpaqueId: string) {
    if (env.NODE_ENV !== "production") {
      console.log(`[Twilio Dev Mode] Simulating provisioning for area code ${areaCode}`);
      return {
        phoneNumber: DEV_TRIAL_NUMBER,
        twilioSid: env.TWILIO_ACCOUNT_SID,
      };
    }

    try {
      // 1. Search for available numbers
      // Error 1 fix: Parse areaCode to Number as required by Twilio SDK
      const available = await client.availablePhoneNumbers("US").local.list({
        areaCode: parseInt(areaCode, 10),
        limit: 1,
      });

      // Error 2 fix: Ensure the array exists and has at least one entry
      const firstFound = available[0];
      if (!firstFound || !firstFound.phoneNumber) {
        throw new Error(`No numbers available for area code ${areaCode}`);
      }

      const selectedNumber = firstFound.phoneNumber;

      // 2. Purchase the number
      const purchased = await client.incomingPhoneNumbers.create({
        phoneNumber: selectedNumber,
        friendlyName: `Property: ${propertyOpaqueId}`,

        // 3. Configure Webhooks
        // Ensure this URL matches your eventual webhook route
        smsUrl: `${env.BACKEND_URL}/api/webhooks/twilio/sms`,
        smsMethod: "POST",
      });

      return {
        phoneNumber: purchased.phoneNumber,
        twilioSid: purchased.sid, // Matching our DB field name
      };
    } catch (error) {
      console.error("[Twilio Provisioning Error]:", error);
      throw error;
    }
  },
};
