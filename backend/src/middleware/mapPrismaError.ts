import { Prisma } from "../lib/prisma";

export type ApiError = {
  status: number;
  code: string;
  message: string;
  details?: unknown;
};

export function mapPrismaError(err: Prisma.PrismaClientKnownRequestError): ApiError {
  switch (err.code) {
    case "P2002": {
      const target = Array.isArray(err.meta?.target) ? err.meta.target.join(".") : err.meta?.target;

      const messageMap: Record<string, string> = {
        name: "Organization name already taken",
        email: "Email already registered",
        phone: "Phone number already registered",
        token: "Invite already used",
        "propertyId.code": "Maintenance code already exists for this property",
      };

      return {
        status: 409,
        code: "UNIQUE_CONSTRAINT",
        message: messageMap[target as string] ?? "Record already exists",
      };
    }

    case "P2025":
      return {
        status: 404,
        code: "NOT_FOUND",
        message: "Record not found",
      };

    default:
      return {
        status: 500,
        code: "PRISMA_ERROR",
        message: "Database error",
        details: err.message,
      };
  }
}
