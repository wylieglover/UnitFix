import { ErrorRequestHandler } from "express";
import { Prisma } from "../lib/prisma";
import { z } from "zod";
import { env } from "../config/env";
import { mapPrismaError, ApiError } from "./mapPrismaError";
import { mapZodError } from "./mapZodError";

const INTERNAL_ERROR: ApiError = {
  status: 500,
  code: "INTERNAL_ERROR",
  message: "Internal server error",
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  let apiError: ApiError;

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    apiError = mapPrismaError(err);
  } else if (err instanceof z.ZodError) {
    apiError = mapZodError(err);
  } else {
    apiError = INTERNAL_ERROR;
  }

  if (env.NODE_ENV !== "production") {
    console.error(err);
  }

  return res.status(apiError.status).json({
    code: apiError.code,
    message: apiError.message,
    ...(env.NODE_ENV !== "production" && apiError.details ? { details: apiError.details } : {}),
  });
};
