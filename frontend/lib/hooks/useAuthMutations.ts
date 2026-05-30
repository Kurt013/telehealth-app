"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  login,
  registerPatient,
  registerDoctor,
  uploadProfilePicture,
} from "@/lib/api";
import type { LoginInput } from "@/lib/schemas/base";
import type { PatientRegisterInput } from "@/lib/schemas/patient";
import type { DoctorRegisterInput } from "@/lib/schemas/doctor";

type UserRole = "PATIENT" | "DOCTOR";

export const useLoginMutation = () => {
  const router = useRouter();

  return useMutation<
    { accessToken: string; role: string },
    unknown,
    LoginInput
  >({
    mutationFn: (data: LoginInput) => login(data),

    onSuccess: (result) => {
      localStorage.setItem("accessToken", result.accessToken);
      localStorage.setItem("userRole", result.role);

      const routes: Record<UserRole, string> = {
        PATIENT: "/patient/dashboard",
        DOCTOR: "/doctor/dashboard",
      };

      const role = result.role?.toUpperCase() as UserRole;

      router.push(routes[role]);
    },

    onError: (error) => {
      const message =
        error instanceof Error
          ? error.message
          : "Login failed. Please try again.";
      toast.error(message);
    },
  });
};

export const useRegisterPatientMutation = () => {
  const router = useRouter();

  return useMutation<
    unknown,
    unknown,
    PatientRegisterInput & { profileFile?: File | null }
  >({
    mutationFn: async (
      data: PatientRegisterInput & { profileFile?: File | null },
    ) => {
      const { profileFile, medicalHistory, ...registrationData } = data;

      let profilePictureUrl: string | undefined;

      // Upload profile picture if provided
      if (profileFile) {
        try {
          toast.loading("Uploading profile picture...");
          const uploadResponse = await uploadProfilePicture(profileFile);
          profilePictureUrl = uploadResponse.url;
          toast.dismiss();
        } catch (error) {
          toast.dismiss();
          throw new Error("Failed to upload profile picture");
        }
      }

      // Convert medical history string to array
      const medicalHistoryArray = medicalHistory
        ? medicalHistory.split(",").map((item) => item.trim())
        : undefined;

      return registerPatient({
        ...registrationData,
        profilePicture: profilePictureUrl,
        medicalHistory: medicalHistoryArray,
      });
    },

    onSuccess: () => {
      toast.success("Registration successful! Please log in.");
      router.push("/login?registered=true");
    },

    onError: (error) => {
      const message =
        error instanceof Error
          ? error.message
          : "Registration failed. Please try again.";
      toast.error(message);
    },
  });
};

export const useRegisterDoctorMutation = () => {
  const router = useRouter();

  return useMutation<unknown, unknown, DoctorRegisterInput>({
    mutationFn: (data: DoctorRegisterInput) => registerDoctor(data),

    onSuccess: () => {
      toast.success("Registration successful! Please log in.");
      router.push("/login?registered=true");
    },

    onError: (error) => {
      const message =
        error instanceof Error
          ? error.message
          : "Registration failed. Please try again.";
      toast.error(message);
    },
  });
};
