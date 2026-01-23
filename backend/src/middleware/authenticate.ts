import { RequestHandler } from "express";
import { verifyAccessToken, TokenPayload } from "../helpers/token";

export const authenticate: RequestHandler = (req, res, next) => {
  const auth = req.headers.authorization;

  if (!auth?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }

  const token = auth.slice("Bearer ".length);

  try {
    const payload: TokenPayload = verifyAccessToken(token);

    res.locals.user = payload;
    return next();
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ error: "Token expired" });
      }
      if (err.name === "JsonWebTokenError") {
        return res.status(401).json({ error: "Invalid token" });
      }
    }
    return res.status(401).json({ error: "Authentication failed" });
  }
};
