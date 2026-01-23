import { z } from "zod";

const email = z.string().trim().toLowerCase().pipe(z.email());

const password = z
  .string()
  .min(1, "Password is required")
  .max(72)
  .refine((val) => val === val.trim(), {
    message: "Password cannot start or end with spaces",
  });

export const loginSchema = z.strictObject({
  email,
  password,
});
