"use client";

import * as React from "react";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { PROTECTED_PAGES } from "@/app/(protected)/constants";

import { useSidebar } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Calendar,
  FileText,
  MessageSquare,
  Users,
  Clock,
  BarChart3,
} from "lucide-react";

const iconMap: Record<string, React.ReactNode> = {
  dashboard: <LayoutDashboard className="h-4 w-4" />,
  appointments: <Calendar className="h-4 w-4" />,
  records: <FileText className="h-4 w-4" />,
  messages: <MessageSquare className="h-4 w-4" />,
  doctors: <Users className="h-4 w-4" />,
  profile: <LayoutDashboard className="h-4 w-4" />,
  schedule: <Clock className="h-4 w-4" />,
  account: <BarChart3 className="h-4 w-4" />,
};

function getIconKey(pathname: string): string {
  if (pathname.includes("account")) return "account";
  if (pathname.includes("profile")) return "profile";
  if (pathname.includes("doctors")) return "doctors";
  if (pathname.includes("appointments")) return "appointments";
  if (pathname.includes("records")) return "records";
  if (pathname.includes("settings")) return "schedule";
  if (pathname.includes("schedule")) return "schedule";
  if (pathname.includes("messages")) return "messages";
  if (pathname.includes("dashboard")) return "dashboard";
  return "dashboard";
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: user } = useCurrentUser();
  const { state } = useSidebar();

  // Generate navigation items from PROTECTED_PAGES based on user role
  const { navItems, accountUrl } = React.useMemo(() => {
    if (!user?.role) return { navItems: [], accountUrl: "" };

    const pages = PROTECTED_PAGES[user.role as "PATIENT" | "DOCTOR"];
    if (!pages) return { navItems: [], accountUrl: "" };

    const account = pages.ACCOUNT || "";
    const items = Object.entries(pages)
      .filter(([key]) => key !== "ACCOUNT") // Filter out ACCOUNT
      .map(([key, url]) => ({
        title: key.charAt(0).toUpperCase() + key.slice(1).toLowerCase(),
        url: url as string,
        icon: iconMap[getIconKey(url as string)],
        isActive: false,
      }));

    return { navItems: items, accountUrl: account };
  }, [user?.role]);

  const userData = {
    name: user?.profile?.firstName
      ? `${user.profile.firstName} ${user.profile.lastName}`
      : "User",
    email: user?.email || "user@example.com",
    avatar: user?.profile?.profilePicture || "/avatars/default.jpg",
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="px-2 py-2">
        {state === "expanded" ? (
          <h2 className="pl-2 font-bold text-lg">TeleHealth</h2>
        ) : (
          <Avatar className="h-8 w-8 mx-auto">
            <AvatarFallback className="font-bold bg-primary text-primary-foreground">
              T
            </AvatarFallback>
          </Avatar>
        )}
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} accountUrl={accountUrl} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
