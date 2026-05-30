import { z } from "zod";
import {
  emailSchema,
  passwordSchema,
  nameSchema,
  optionalNameSchema,
} from "./base";

export const doctorRegisterSchema = z
  .object({
    firstName: nameSchema,
    middleName: optionalNameSchema,
    lastName: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
    specializations: z
      .array(z.string())
      .min(1, "Please select at least one specialization"),
    bio: z
      .string()
      .max(500, "Bio must not exceed 500 characters")
      .optional()
      .or(z.literal("")),
    profilePicture: z.string().optional().or(z.literal("")),
    agreeToTerms: z.boolean().refine((val) => val === true, {
      message:
        "You must agree to the Terms of Service and certify you are a licensed healthcare professional",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type DoctorRegisterInput = z.infer<typeof doctorRegisterSchema>;
