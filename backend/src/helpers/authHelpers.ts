// helpers/authHelpers.ts
import { env } from "../config/env";
import { prisma } from "../lib/prisma";
import { generateAccessToken, generateRefreshToken, hashRefreshToken, verifyRefreshToken, TokenPayload } from "./token";
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

  // Resolve internal ID from opaqueId for session storage
  const user = await prisma.user.findUnique({
    where: { opaqueId: tokenPayload.userId },
    select: { id: true }
  });

  if (!user) {
    throw new Error("User not found");
  }

  await prisma.session.create({
    data: {
      userId: user.id, 
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

export const verifyAndRotateRefreshToken = async (
  refreshToken: string,
  req: Request,
  res: Response
) => {
  try {
    // Verify the token is valid
    const payload = verifyRefreshToken(refreshToken);
    const refreshTokenHash = hashRefreshToken(refreshToken);

    // Resolve internal userId from opaqueId
    const user = await prisma.user.findUnique({
      where: { opaqueId: payload.userId },
      select: { id: true }
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Find the session using internal userId
    const session = await prisma.session.findFirst({
      where: {
        userId: user.id, // Use internal ID
        refreshTokenHash,
        expiresAt: { gt: new Date() }, // Not expired
      },
    });

    if (!session) {
      throw new Error("Invalid or expired session");
    }

    // Delete old session
    await prisma.session.delete({
      where: { id: session.id },
    });

    // Create new tokens and session (payload already has opaqueId)
    const { accessToken, refreshToken: newRefreshToken } = await createSessionAndTokens(
      payload,
      req,
      res
    );

    return { accessToken, refreshToken: newRefreshToken, userId: payload.userId };
  } catch (error) {
    throw new Error("Invalid refresh token");
  }
};
