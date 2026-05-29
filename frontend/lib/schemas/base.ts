import { z } from "zod";

// Common validation patterns
export const emailSchema = z.email("Invalid email address");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

export const nameSchema = z
  .string()
  .min(2, "Name must be at least 2 characters")
  .max(50, "Name must not exceed 50 characters");

export const optionalNameSchema = z
  .string()
  .max(50, "Name must not exceed 50 characters")
  .optional()
  .or(z.literal(""));

export const phoneSchema = z
  .string()
  .regex(/^[+]?[0-9]{10,}$/, "Invalid phone number")
  .optional()
  .or(z.literal(""));

export const dateSchema = z.string().refine((date) => {
  const d = new Date(date);
  return d instanceof Date && !isNaN(d.getTime());
}, "Invalid date");

export const numberOptionalSchema = z
  .number()
  .positive()
  .nullable()
  .transform((val) => val ?? undefined)
  .optional();

export const urlSchema = z.url("Invalid URL").optional().or(z.literal(""));

// Login schema (shared)
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;
