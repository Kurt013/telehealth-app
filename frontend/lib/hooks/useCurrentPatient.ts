"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchCurrentPatient, type PatientProfileItem } from "../api";

export function useCurrentPatient() {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

  return useQuery<PatientProfileItem | null>({
    queryKey: ["currentPatient"],
    queryFn: async () => {
      if (!token) return null;

      return fetchCurrentPatient(token);
    },
    enabled: !!token,
    // Keep data fresh for a minute and avoid refetching on window focus
    staleTime: 1000 * 60,
    refetchOnWindowFocus: false,
  });
}
