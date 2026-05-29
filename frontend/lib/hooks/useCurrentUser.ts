"use client";

import { useQuery } from "@tanstack/react-query";
import { API_BASE_URL } from "../api";

export function useCurrentUser() {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

  return useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      if (!token) return null;

      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch user");
      }

      return response.json();
    },
    enabled: !!token,
  });
}
