"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchCurrentDoctor,
  fetchDoctorAppointments,
  type DoctorAppointmentItem,
  type DoctorProfileItem,
} from "@/lib/api";
import { PROTECTED_PAGES } from "../../constants";

function getToken() {
  return typeof window !== "undefined"
    ? localStorage.getItem("accessToken")
    : null;
}

function getPatientName(appointment: DoctorAppointmentItem) {
  return [
    appointment.patient?.firstName,
    appointment.patient?.middleName,
    appointment.patient?.lastName,
  ]
    .filter(Boolean)
    .join(" ");
}

function formatAppointmentTime(appointment: DoctorAppointmentItem) {
  return appointment.schedule
    ? new Intl.DateTimeFormat("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(appointment.schedule.startTime))
    : "Schedule pending";
}

export default function DoctorDashboard() {
  const doctorQuery = useQuery<DoctorProfileItem | null, Error>({
    queryKey: ["currentDoctor"],
    queryFn: async () => {
      const token = getToken();
      if (!token) return null;

      return fetchCurrentDoctor(token);
    },
    enabled: typeof window !== "undefined" && !!getToken(),
    staleTime: 1000 * 60,
    refetchOnWindowFocus: false,
  });

  const appointmentsQuery = useQuery<DoctorAppointmentItem[], Error>({
    queryKey: ["doctorAppointments", doctorQuery.data?.id],
    queryFn: async () => {
      if (!doctorQuery.data?.id) return [];

      return fetchDoctorAppointments(doctorQuery.data.id);
    },
    enabled: !!doctorQuery.data?.id,
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  });

  const appointments = appointmentsQuery.data ?? [];
  const recentAppointments = [...appointments].slice(0, 3);
  const doctorName = [
    doctorQuery.data?.firstName,
    doctorQuery.data?.middleName,
    doctorQuery.data?.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-border/70 bg-card/90 p-6 shadow-sm md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <Badge variant="outline" className="rounded-full px-3 py-1">
            Doctor dashboard
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight">
            {doctorQuery.isLoading ? (
              <Skeleton className="h-9 w-56 rounded-full" />
            ) : (
              doctorName || "Your dashboard"
            )}
          </h1>
          <p className="text-sm text-muted-foreground">
            Your seeded appointments and consultation sessions from the backend.
          </p>
        </div>

        <Card className="border-border/70 bg-muted/30">
          <CardContent className="p-4 text-center">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Appointments
            </p>
            <p className="mt-2 text-2xl font-bold">{appointments.length}</p>
          </CardContent>
        </Card>
      </div>

      {appointmentsQuery.isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} className="border-border/70">
              <CardContent className="space-y-3 p-5">
                <Skeleton className="h-5 w-1/2 rounded-full" />
                <Skeleton className="h-4 w-1/3 rounded-full" />
                <Skeleton className="h-10 w-full rounded-2xl" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : appointments.length ? (
        <div className="space-y-4">
          {recentAppointments.map((appointment) => (
            <Card
              key={appointment.id}
              className="border-border/70 bg-card/90 shadow-sm"
            >
              <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base font-semibold">
                      {getPatientName(appointment) || "Patient"}
                    </p>
                    <Badge variant="secondary" className="rounded-full">
                      {appointment.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {appointment.reason?.trim() || "Consultation appointment"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatAppointmentTime(appointment)}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {appointment.consultationSession?.meetingLink ? (
                    <Link
                      href={appointment.consultationSession.meetingLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-10 items-center justify-center rounded-2xl bg-primary px-4 text-sm font-medium text-primary-foreground"
                    >
                      Open session
                    </Link>
                  ) : null}
                  <Link
                    href={PROTECTED_PAGES.DOCTOR.APPOINTMENTS}
                    className="inline-flex h-10 items-center justify-center rounded-2xl border border-border px-4 text-sm font-medium"
                  >
                    View all
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed border-border/70 bg-card/90 p-10 text-center">
          <p className="text-lg font-semibold">No appointments yet</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Once patients book available slots, they will show up here.
          </p>
        </Card>
      )}
    </div>
  );
}
