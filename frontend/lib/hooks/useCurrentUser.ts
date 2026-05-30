"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchCurrentUser, type CurrentUserItem } from "../api";

export function useCurrentUser() {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

  return useQuery<CurrentUserItem | null>({
    queryKey: ["currentUser"],
    queryFn: async () => {
      if (!token) return null;

      return fetchCurrentUser(token);
    },
    enabled: !!token,
  });
}
