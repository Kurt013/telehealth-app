"use client";

import { Bell, CheckCheck, Clock3 } from "lucide-react";
import { useNotifications } from "@/lib/hooks/useNotifications";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

function getInitials(name?: string) {
  return (
    name
      ?.split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "N"
  );
}

export function NotificationCenter({
  accountId,
}: {
  accountId: string | null;
}) {
  const { notifications, unreadCount, markAsRead } =
    useNotifications(accountId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative h-10 w-10 rounded-full"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 ? (
            <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
              {unreadCount}
            </span>
          ) : null}
          <span className="sr-only">Open notifications</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="text-sm font-semibold">Notifications</p>
            <p className="text-xs text-muted-foreground">
              Live updates from the backend
            </p>
          </div>
          <Badge variant="secondary" className="rounded-full">
            {unreadCount} unread
          </Badge>
        </div>

        <DropdownMenuSeparator />

        <div className="max-h-96 overflow-auto p-2">
          {notifications.length ? (
            notifications.map((notification) => (
              <button
                key={notification.id}
                type="button"
                onClick={() => {
                  void markAsRead(notification.id);
                }}
                className="flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-muted/70"
              >
                <Avatar className="h-9 w-9 shrink-0 rounded-full">
                  <AvatarFallback className="rounded-full">
                    {getInitials(notification.title)}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium">
                      {notification.title}
                    </p>
                    {notification.isRead ? null : (
                      <span className="h-2 w-2 rounded-full bg-primary" />
                    )}
                  </div>
                  <p className="line-clamp-2 text-xs text-muted-foreground">
                    {notification.message}
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <Clock3 className="h-3 w-3" />
                    {new Intl.DateTimeFormat("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    }).format(new Date(notification.createdAt))}
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center text-sm text-muted-foreground">
              <CheckCheck className="h-5 w-5" />
              No notifications yet
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
