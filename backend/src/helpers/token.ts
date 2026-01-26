// helpers/token.ts
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { env } from "../config/env";
import { type UserType } from "../lib/prisma";

export type TokenPayload = {
  userId: number;
  userType: UserType;
  organizationId?: number;
  propertyId?: number;  
  propertyOpaqueId?: string;  
  organizationOpaqueId?: string;  
};

export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRY,
  });
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRY,
  });
};

export const hashRefreshToken = (token: string): string => {
  return crypto.createHmac("sha256", env.REFRESH_TOKEN_HMAC_SECRET).update(token).digest("hex");
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
};
