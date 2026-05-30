"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  Beaker,
  Calendar,
  CalendarDays,
  CheckCircle,
  ChevronRight,
  FileText,
  Pill,
  Stethoscope,
} from "lucide-react";
import { PROTECTED_PAGES } from "../../constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentPatient } from "@/lib/hooks/useCurrentPatient";
import type {
  PatientProfileAppointmentItem,
  PatientProfileItem,
} from "@/lib/api";

function getFullName(
  firstName?: string | null,
  middleName?: string | null,
  lastName?: string | null,
) {
  return (
    [firstName, middleName, lastName].filter(Boolean).join(" ") || "Patient"
  );
}

function formatScheduleDate(dateString?: string) {
  if (!dateString) return "Schedule pending";

  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function getDaysLeft(dateString?: string) {
  if (!dateString) return null;

  const date = new Date(dateString);
  const diff = date.getTime() - Date.now();

  if (Number.isNaN(diff)) return null;

  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function getDoctorName(appointment: PatientProfileAppointmentItem) {
  return getFullName(
    appointment.doctor?.firstName,
    appointment.doctor?.middleName,
    appointment.doctor?.lastName,
  );
}

function getAppointmentLabel(appointment: PatientProfileAppointmentItem) {
  return (
    appointment.reason?.trim() ||
    appointment.doctor?.specializations?.[0]?.specialization?.name ||
    "Consultation"
  );
}

export default function PatientDashboard() {
  const patientQuery = useCurrentPatient();

  const patient: PatientProfileItem | null =
    (patientQuery.data as PatientProfileItem | null) ?? null;

  const dashboardData = useMemo(() => {
    const appointments = [...(patient?.appointments ?? [])].sort(
      (left, right) => {
        const leftTime = new Date(
          left.schedule?.startTime ?? left.createdAt,
        ).getTime();
        const rightTime = new Date(
          right.schedule?.startTime ?? right.createdAt,
        ).getTime();

        return leftTime - rightTime;
      },
    );

    const upcomingAppointment =
      appointments.find((appointment) => {
        const startTime = appointment.schedule?.startTime;
        return startTime ? new Date(startTime).getTime() >= Date.now() : false;
      }) ??
      appointments[0] ??
      null;

    const recentAppointments = [...appointments]
      .sort(
        (left, right) =>
          new Date(right.updatedAt).getTime() -
          new Date(left.updatedAt).getTime(),
      )
      .slice(0, 3);

    return {
      appointments,
      upcomingAppointment,
      recentAppointments,
      medicalHistoryCount: patient?.medicalHistory?.length ?? 0,
    };
  }, [patient]);

  const patientName = getFullName(
    patient?.firstName,
    patient?.middleName,
    patient?.lastName,
  );
  const nextAppointmentDate =
    dashboardData.upcomingAppointment?.schedule?.startTime;
  const daysLeft = getDaysLeft(nextAppointmentDate);

  return (
    <div className="w-full space-y-8">
      <div className="flex flex-col gap-3 rounded-3xl border border-border/70 bg-card/90 p-6 shadow-sm sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Badge
            variant="outline"
            className="rounded-full px-3 py-1 text-xs uppercase tracking-[0.18em]"
          >
            Patient overview
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight">
            {patientQuery.isLoading ? (
              <span className="inline-block min-w-40">
                <Skeleton className="h-9 w-48 rounded-full" />
              </span>
            ) : (
              <>Good morning, {patient?.firstName ?? "Patient"}</>
            )}
          </h1>
          <p className="text-muted-foreground">
            {patientQuery.isLoading
              ? "Loading your health summary from the backend..."
              : `Here's your health summary for today, ${patientName}.`}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:min-w-72">
          <Card className="border-border/70 bg-muted/30">
            <CardContent className="p-4 text-center">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Appointments
              </p>
              <p className="mt-2 text-2xl font-bold">
                {dashboardData.appointments.length}
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/70 bg-muted/30">
            <CardContent className="p-4 text-center">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Conditions
              </p>
              <p className="mt-2 text-2xl font-bold">
                {dashboardData.medicalHistoryCount}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="border-blue-200 bg-linear-to-br from-blue-50 to-blue-100">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between gap-6">
            <div className="space-y-3">
              <Badge variant="outline" className="bg-white/90">
                Next appointment
              </Badge>
              {patientQuery.isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-7 w-56 rounded-full" />
                  <Skeleton className="h-4 w-40 rounded-full" />
                </div>
              ) : dashboardData.upcomingAppointment ? (
                <div>
                  <h3 className="text-xl font-bold">
                    {getDoctorName(dashboardData.upcomingAppointment)}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {getAppointmentLabel(dashboardData.upcomingAppointment)}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant="secondary" className="rounded-full">
                      <CalendarDays className="mr-1 size-3.5" />
                      {formatScheduleDate(
                        dashboardData.upcomingAppointment.schedule?.startTime,
                      )}
                    </Badge>
                    <Badge variant="outline" className="rounded-full">
                      {dashboardData.upcomingAppointment.status}
                    </Badge>
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="text-xl font-bold">No upcoming appointment</h3>
                  <p className="text-sm text-muted-foreground">
                    Book your next visit from the doctors directory.
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-3xl bg-white/80 px-5 py-4 text-right shadow-sm">
              <div className="text-4xl font-bold text-blue-600">
                {patientQuery.isLoading ? "--" : (daysLeft ?? "--")}
              </div>
              <p className="text-xs text-muted-foreground">Days left</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <Link
                href={PROTECTED_PAGES.PATIENT.DOCTORS}
                className="space-y-3 block"
              >
                <div className="text-3xl">
                  <Stethoscope className="h-6 w-6 text-teal-500" />
                </div>
                <div>
                  <h3 className="font-semibold">Find Your Doctor</h3>
                  <p className="text-xs text-muted-foreground">
                    Look for suitable doctors
                  </p>
                </div>
              </Link>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <Link
                href={PROTECTED_PAGES.PATIENT.APPOINTMENTS}
                className="space-y-3 block"
              >
                <div className="text-3xl">
                  <Calendar className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-semibold">Manage Appointments</h3>
                  <p className="text-xs text-muted-foreground">
                    Keep track of your appointments
                  </p>
                </div>
              </Link>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <Link
                href={PROTECTED_PAGES.PATIENT.RECORDS}
                className="space-y-3 block"
              >
                <div className="text-3xl">
                  <FileText className="h-6 w-6 text-amber-500" />
                </div>
                <div>
                  <h3 className="font-semibold">View Records</h3>
                  <p className="text-xs text-muted-foreground">
                    Access your medical history
                  </p>
                </div>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Recent Activity</h2>
            <p className="text-sm text-muted-foreground">
              Latest appointments pulled from the backend.
            </p>
          </div>
          <Button variant="ghost" size="sm" asChild className="rounded-full">
            <Link href={PROTECTED_PAGES.PATIENT.APPOINTMENTS}>View All</Link>
          </Button>
        </div>
        <div className="space-y-3">
          {patientQuery.isLoading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <Card key={index} className="border-border/70">
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="size-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-52 rounded-full" />
                      <Skeleton className="h-3 w-40 rounded-full" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-16 rounded-full" />
                </CardContent>
              </Card>
            ))
          ) : dashboardData.recentAppointments.length ? (
            dashboardData.recentAppointments.map((appointment) => {
              const icon =
                appointment.status === "COMPLETED" ? (
                  <CheckCircle className="h-5 w-5 text-teal-600" />
                ) : appointment.status === "CANCELLED" ? (
                  <Pill className="h-5 w-5 text-purple-600" />
                ) : (
                  <Beaker className="h-5 w-5 text-blue-600" />
                );

              return (
                <Card
                  key={appointment.id}
                  className="cursor-pointer transition-colors hover:bg-muted/50"
                >
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-4">
                      <div className="rounded-full bg-blue-100 p-2">{icon}</div>
                      <div>
                        <p className="font-medium">
                          {appointment.status === "CANCELLED"
                            ? "Appointment Cancelled"
                            : appointment.status === "COMPLETED"
                              ? "Appointment Completed"
                              : "Upcoming Appointment"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {getDoctorName(appointment)} •{" "}
                          {formatScheduleDate(appointment.schedule?.startTime)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="rounded-full">
                        {appointment.status}
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card className="border-dashed border-border/70">
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                No appointments yet. Book your first visit from the doctors
                page.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
