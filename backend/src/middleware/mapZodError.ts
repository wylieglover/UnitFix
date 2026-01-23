import { z } from "zod";
import { ApiError } from "./mapPrismaError";

export function mapZodError(err: z.ZodError): ApiError {
  return {
    status: 400,
    code: "VALIDATION_ERROR",
    message: "Validation failed",
    details: err.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    })),
  };
}
