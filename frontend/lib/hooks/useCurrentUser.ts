"use client";

import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "../api";

export function useCurrentUser() {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

  return useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      if (!token) return null;

      return apiRequest<Record<string, unknown>>("/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    },
    enabled: !!token,
  });
}
