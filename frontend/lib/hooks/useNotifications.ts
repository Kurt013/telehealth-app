"use client";

import { useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  API_BASE_URL,
  fetchNotifications,
  markNotificationAsRead,
  type NotificationItem,
} from "../api";

function normalizeNotification(
  notification: NotificationItem,
): NotificationItem {
  return {
    ...notification,
    isRead: notification.isRead ?? Boolean(notification.readAt),
  };
}

export function useNotifications(accountId?: string | null) {
  const queryClient = useQueryClient();

  const notificationsQuery = useQuery<NotificationItem[]>({
    queryKey: ["notifications", accountId],
    queryFn: async () => {
      if (!accountId) return [];

      const notifications = await fetchNotifications(accountId);
      return notifications.map(normalizeNotification);
    },
    enabled: !!accountId,
    staleTime: 1000 * 15,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!accountId || typeof window === "undefined") {
      return undefined;
    }

    const eventSource = new EventSource(
      `${API_BASE_URL}/notifications/stream/${accountId}`,
    );

    eventSource.onmessage = (event) => {
      try {
        const notification = normalizeNotification(
          JSON.parse(event.data) as NotificationItem,
        );

        queryClient.setQueryData<NotificationItem[]>(
          ["notifications", accountId],
          (currentNotifications = []) => {
            const nextNotifications = [
              notification,
              ...currentNotifications.filter(
                (currentNotification) =>
                  currentNotification.id !== notification.id,
              ),
            ];

            return nextNotifications.sort(
              (left, right) =>
                new Date(right.createdAt).getTime() -
                new Date(left.createdAt).getTime(),
            );
          },
        );

        toast(notification.title, {
          description: notification.message,
        });
      } catch {
        toast.error("Received an invalid notification payload.");
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [accountId, queryClient]);

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      if (!accountId) {
        return null;
      }

      return markNotificationAsRead(accountId, notificationId);
    },
    onSuccess: (updatedNotification, notificationId) => {
      if (!accountId || !updatedNotification) {
        return;
      }

      queryClient.setQueryData<NotificationItem[]>(
        ["notifications", accountId],
        (currentNotifications = []) =>
          currentNotifications.map((notification) =>
            notification.id === notificationId
              ? {
                  ...notification,
                  isRead: true,
                  readAt: new Date().toISOString(),
                }
              : notification,
          ),
      );
    },
  });

  const notifications = useMemo(
    () => notificationsQuery.data ?? [],
    [notificationsQuery.data],
  );

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications],
  );

  return {
    notifications,
    unreadCount,
    isLoading: notificationsQuery.isLoading,
    markAsRead: markAsReadMutation.mutateAsync,
  };
}
