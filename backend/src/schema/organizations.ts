import { z } from "zod";

const email = z.string().trim().toLowerCase().pipe(z.email());

const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password cannot exceed 72 characters")
  .refine((val) => val === val.trim(), {
    message: "Password cannot start or end with spaces",
  });

const name = z.string().trim().min(1, "Name is required");

const organizationName = z
  .string()
  .trim()
  .min(2, "Organization name must be at least 2 characters")
  .max(100, "Organization name cannot exceed 100 characters");

const contactInfo = z
  .string()
  .trim()
  .min(1, "Contact info is required")
  .max(255, "Contact info cannot exceed 255 characters")
  .refine(
    (val) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const phoneRegex = /^[\d\s\-\+\(\)]+$/;
      return emailRegex.test(val) || phoneRegex.test(val);
    },
    {
      message: "Contact info must be a valid email or phone number",
    }
  );

const passwordWithRequirements = password
  .regex(/[A-Z]/, "Password must contain an uppercase letter")
  .regex(/[a-z]/, "Password must contain a lowercase letter")
  .regex(/[0-9]/, "Password must contain a number")
  .regex(/[^A-Za-z0-9]/, "Password must contain a special character");

export const organizationRegistrationSchema = z.strictObject({
  organizationName,
  contactInfo,
  name,
  email,
  password: passwordWithRequirements,
});

export const organizationIdParamSchema = z.strictObject({
  organizationId: z.uuid("Invalid organization ID"),
});
