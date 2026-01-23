// helpers/authHelpers.ts
import { env } from "../config/env";
import { prisma } from "../lib/prisma";
import { generateAccessToken, generateRefreshToken, hashRefreshToken, TokenPayload } from "./token";
import { Request, Response } from "express";

export const createSessionAndTokens = async (
  tokenPayload: TokenPayload,
  req: Request,
  res: Response
) => {
  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);
  const refreshTokenHash = hashRefreshToken(refreshToken);
  const expiresAt = new Date(Date.now() + env.JWT_REFRESH_EXPIRY * 1000);

  await prisma.session.create({
    data: {
      userId: tokenPayload.userId,
      refreshTokenHash,
      userAgent: req.headers["user-agent"] || null,
      ipAddress: req.ip || null,
      expiresAt,
    },
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: env.JWT_REFRESH_EXPIRY * 1000,
  });

  return { accessToken, refreshToken };
};
