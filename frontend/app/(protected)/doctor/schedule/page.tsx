"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  createDoctorSchedule,
  deleteDoctorSchedule,
  fetchCurrentDoctor,
  type DoctorProfileItem,
  type DoctorScheduleItem,
} from "@/lib/api";
import { toast } from "sonner";

function getToken() {
  return typeof window !== "undefined"
    ? localStorage.getItem("accessToken")
    : null;
}

function formatSlot(schedule: DoctorScheduleItem) {
  const start = new Date(schedule.startTime);
  const end = new Date(schedule.endTime);

  return {
    day: new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    }).format(start),
    time: `${start.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    })} - ${end.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    })}`,
  };
}

function toDateTimeLocalValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export default function DoctorSchedulePage() {
  const queryClient = useQueryClient();
  const [startTime, setStartTime] = useState(() => {
    const date = new Date();
    date.setHours(date.getHours() + 1, 0, 0, 0);
    return toDateTimeLocalValue(date);
  });
  const [endTime, setEndTime] = useState(() => {
    const date = new Date();
    date.setHours(date.getHours() + 1, 30, 0, 0);
    return toDateTimeLocalValue(date);
  });

  const token = getToken();

  const doctorQuery = useQuery<DoctorProfileItem | null, Error>({
    queryKey: ["currentDoctor"],
    queryFn: async () => {
      if (!token) return null;
      return fetchCurrentDoctor(token);
    },
    enabled: !!token,
    staleTime: 1000 * 60,
    refetchOnWindowFocus: false,
  });

  const schedules = useMemo(() => {
    return [...(doctorQuery.data?.schedules ?? [])].sort(
      (left, right) =>
        new Date(left.startTime).getTime() -
        new Date(right.startTime).getTime(),
    );
  }, [doctorQuery.data]);

  const doctorName = [
    doctorQuery.data?.firstName,
    doctorQuery.data?.middleName,
    doctorQuery.data?.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!token) {
        throw new Error("Missing access token");
      }

      return createDoctorSchedule(token, {
        startTime,
        endTime,
      });
    },
    onSuccess: async () => {
      toast.success("Availability slot created.");
      await queryClient.invalidateQueries({ queryKey: ["currentDoctor"] });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Unable to create schedule.",
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (scheduleId: string) => {
      if (!token) {
        throw new Error("Missing access token");
      }

      return deleteDoctorSchedule(token, scheduleId);
    },
    onSuccess: async () => {
      toast.success("Availability slot deleted.");
      await queryClient.invalidateQueries({ queryKey: ["currentDoctor"] });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Unable to delete schedule.",
      );
    },
  });

  async function handleCreateSlot() {
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      toast.error("Please enter valid start and end times.");
      return;
    }

    if (start >= end) {
      toast.error("End time must be after start time.");
      return;
    }

    await createMutation.mutateAsync();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-border/70 bg-card/90 p-6 shadow-sm md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <Badge variant="outline" className="rounded-full px-3 py-1">
            Doctor schedule
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight">
            {doctorQuery.isLoading ? (
              <Skeleton className="h-9 w-56 rounded-full" />
            ) : (
              doctorName || "Your schedule"
            )}
          </h1>
          <p className="text-sm text-muted-foreground">
            Set date and time slots when you are available for booking.
          </p>
        </div>

        <div className="flex gap-3">
          <Card className="border-border/70 bg-muted/30">
            <CardContent className="p-4 text-center">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Slots
              </p>
              <p className="mt-2 text-2xl font-bold">{schedules.length}</p>
            </CardContent>
          </Card>
          <Button
            variant="outline"
            className="rounded-2xl"
            onClick={() =>
              queryClient.invalidateQueries({ queryKey: ["currentDoctor"] })
            }
          >
            Refresh
          </Button>
        </div>
      </div>

      <Card className="border-border/70 bg-card/90 shadow-sm">
        <CardContent className="space-y-4 p-6">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Add availability slot</h2>
            <p className="text-sm text-muted-foreground">
              Enter a start and end date/time to open a booking window.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Start date and time</label>
              <Input
                type="datetime-local"
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
                className="h-12 rounded-2xl"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">End date and time</label>
              <Input
                type="datetime-local"
                value={endTime}
                onChange={(event) => setEndTime(event.target.value)}
                className="h-12 rounded-2xl"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              className="rounded-2xl"
              onClick={handleCreateSlot}
              disabled={createMutation.isPending || !token}
            >
              {createMutation.isPending ? "Saving slot..." : "Save slot"}
            </Button>
            <Button
              variant="outline"
              className="rounded-2xl"
              onClick={() => {
                const now = new Date();
                const start = new Date(now);
                start.setHours(now.getHours() + 1, 0, 0, 0);
                const end = new Date(now);
                end.setHours(now.getHours() + 1, 30, 0, 0);
                setStartTime(toDateTimeLocalValue(start));
                setEndTime(toDateTimeLocalValue(end));
              }}
            >
              Reset default slot
            </Button>
          </div>
        </CardContent>
      </Card>

      {doctorQuery.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="border-border/70">
              <CardContent className="space-y-3 p-5">
                <Skeleton className="h-5 w-2/3 rounded-full" />
                <Skeleton className="h-4 w-1/2 rounded-full" />
                <Skeleton className="h-10 w-full rounded-2xl" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : schedules.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {schedules.map((schedule) => {
            const slot = formatSlot(schedule);

            return (
              <Card
                key={schedule.id}
                className="border-border/70 bg-card/90 shadow-sm"
              >
                <CardContent className="space-y-4 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{slot.day}</p>
                      <p className="text-sm text-muted-foreground">
                        {slot.time}
                      </p>
                    </div>
                    <Badge variant="secondary" className="rounded-full">
                      Available
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Schedule ID: {schedule.id}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 rounded-2xl"
                      onClick={() => deleteMutation.mutate(schedule.id)}
                      disabled={deleteMutation.isPending}
                    >
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-dashed border-border/70 bg-card/90 p-10 text-center">
          <p className="text-lg font-semibold">No schedule slots found</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Add availability above to make booking possible.
          </p>
        </Card>
      )}
    </div>
  );
}
