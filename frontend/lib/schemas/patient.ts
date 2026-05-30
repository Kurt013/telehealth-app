import { z } from "zod";
import {
  emailSchema,
  passwordSchema,
  nameSchema,
  optionalNameSchema,
  phoneSchema,
  dateSchema,
} from "./base";

export const patientRegisterSchema = z
  .object({
    firstName: nameSchema,
    middleName: optionalNameSchema,
    lastName: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
    birthday: dateSchema,
    phone: phoneSchema,
    weight: z.number().optional(),
    height: z.number().optional(),
    address: z
      .string()
      .max(200, "Address must not exceed 200 characters")
      .optional()
      .or(z.literal("")),
    profilePicture: z.string().optional().or(z.literal("")),
    emergencyName: optionalNameSchema,
    emergencyPhone: phoneSchema,
    medicalHistory: z.string().optional(),
    agreeToTerms: z.boolean().refine((val) => val === true, {
      message: "You must agree to the Terms of Service and Privacy Policy",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type PatientRegisterInput = z.infer<typeof patientRegisterSchema>;
