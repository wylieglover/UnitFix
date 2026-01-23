export const validateEnv = (): {
  PORT: string;
  NODE_ENV: string;
  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_ACCESS_EXPIRY: number;
  JWT_REFRESH_EXPIRY: number;
  REFRESH_TOKEN_HMAC_SECRET: string;
  FRONTEND_URL: string;
  BACKEND_URL: string;
  RESEND_API_KEY: string;
  TWILIO_ACCOUNT_SID: string;
  TWILIO_AUTH_TOKEN: string;
} => {
  const {
    PORT,
    NODE_ENV,
    FRONTEND_URL,
    BACKEND_URL,
    JWT_ACCESS_SECRET,
    JWT_REFRESH_SECRET,
    REFRESH_TOKEN_HMAC_SECRET,
    RESEND_API_KEY,
    TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN,
  } = process.env;

  if (!JWT_ACCESS_SECRET) {
    throw new Error("JWT_ACCESS_SECRET not found in environment variables");
  }

  if (!JWT_REFRESH_SECRET) {
    throw new Error("JWT_REFRESH_SECRET not found in environment variables");
  }

  if (!REFRESH_TOKEN_HMAC_SECRET) {
    throw new Error("REFRESH_TOKEN_HMAC_SECRET not found in environment variables");
  }

  if (!FRONTEND_URL) {
    throw new Error("FRONTEND_URL not found in environment variables");
  }

  if (!BACKEND_URL) {
    throw new Error("BACKEND_URL not found in environment variables");
  }

  if (!RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY not found in environment variables");
  }

  if (!TWILIO_ACCOUNT_SID) {
    throw new Error("TWILIO_ACCOUNT_SID not found in environment variables");
  }

  if (!TWILIO_AUTH_TOKEN) {
    throw new Error("TWILIO_AUTH_TOKEN not found in environment variables");
  }

  const JWT_ACCESS_EXPIRY =
    NODE_ENV === "development"
      ? 5 * 60 * 60 // 5 hours in dev
      : 15 * 60; // 15 minutes in prod

  const JWT_REFRESH_EXPIRY = 7 * 24 * 60 * 60;

  return {
    PORT: PORT || "3000",
    NODE_ENV: NODE_ENV || "development",
    FRONTEND_URL,
    BACKEND_URL,
    JWT_ACCESS_SECRET,
    JWT_REFRESH_SECRET,
    JWT_ACCESS_EXPIRY,
    JWT_REFRESH_EXPIRY,
    REFRESH_TOKEN_HMAC_SECRET,
    RESEND_API_KEY,
    TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN,
  };
};

export const env = validateEnv();
