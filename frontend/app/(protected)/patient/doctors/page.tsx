"use client";

import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  bookAppointment,
  fetchDoctors,
  fetchDoctorSchedules,
  fetchSymptomRecommendations,
  type DoctorDiscoveryItem,
  type DoctorScheduleItem,
} from "@/lib/api";
import { ChevronLeft, ChevronRight, Filter, Search } from "lucide-react";
import { useCurrentPatient } from "@/lib/hooks/useCurrentPatient";
import { toast } from "sonner";

type DoctorCardData = {
  id: string;
  fullName: string;
  title: string;
  bio: string;
  avatarUrl?: string | null;
  specializations: string[];
};

function getDoctorDisplayName(doctor: DoctorDiscoveryItem) {
  return [doctor.firstName, doctor.middleName, doctor.lastName]
    .filter(Boolean)
    .join(" ");
}

function getDoctorTitle(doctor: DoctorDiscoveryItem) {
  const primarySpecialization =
    doctor.specializations?.[0]?.specialization?.name;

  return primarySpecialization ?? "Doctor";
}

function getDoctorBio(doctor: DoctorDiscoveryItem) {
  return doctor.bio?.trim() || "Available for consultation and follow-up care.";
}

function toCardData(doctor: DoctorDiscoveryItem): DoctorCardData {
  return {
    id: doctor.id,
    fullName: getDoctorDisplayName(doctor) || "Unnamed Doctor",
    title: getDoctorTitle(doctor),
    bio: getDoctorBio(doctor),
    avatarUrl: doctor.profilePicture,
    specializations:
      doctor.specializations?.map((entry) => entry.specialization.name) ?? [],
  };
}

function getInitials(fullName: string) {
  return fullName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function DoctorCard({
  doctor,
  isRecommended,
  onBookNow,
}: {
  doctor: DoctorCardData;
  isRecommended?: boolean;
  onBookNow?: (doctor: DoctorCardData) => void;
}) {
  return (
    <Card className="group border-border/70 bg-card/90 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl">
      <CardContent className="pt-6">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex aspect-4/3 items-center justify-center overflow-hidden rounded-2xl bg-linear-to-br from-sky-500/90 via-cyan-500/80 to-teal-500/90 sm:size-24 sm:shrink-0 sm:aspect-square">
            <Avatar className="size-full rounded-none">
              <AvatarImage
                src={doctor.avatarUrl ?? undefined}
                alt={doctor.fullName}
              />
              <AvatarFallback className="rounded-none border-0 bg-transparent text-2xl font-semibold text-white/95">
                {getInitials(doctor.fullName)}
              </AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 bg-linear-to-t from-slate-950/20 via-transparent to-transparent" />
            <span className="absolute right-2 bottom-2 size-3 rounded-full border-2 border-white bg-emerald-400 shadow-sm" />
          </div>

          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate text-base font-semibold leading-tight text-foreground">
                  {doctor.fullName}
                </h3>
                <p className="text-sm font-medium text-primary">
                  {doctor.title}
                </p>
              </div>
              {isRecommended ? (
                <div className="ml-2 flex items-center">
                  <Badge
                    variant="destructive"
                    className="rounded-full px-2 py-0.5 text-xs"
                  >
                    Recommended
                  </Badge>
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              {doctor.specializations.slice(0, 3).map((specialization) => (
                <Badge
                  key={specialization}
                  variant="outline"
                  className="rounded-full"
                >
                  {specialization}
                </Badge>
              ))}
            </div>

            <p className="line-clamp-2 text-sm text-muted-foreground">
              {doctor.bio}
            </p>
          </div>
        </div>
      </CardContent>

      <CardFooter className="gap-3 pt-0">
        <Button
          className="flex-1 rounded-2xl shadow-sm shadow-primary/20"
          onClick={() => onBookNow?.(doctor)}
        >
          Book Now
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function Page() {
  const patientQuery = useCurrentPatient();
  const patient = patientQuery.data ?? null;
  const [search, setSearch] = useState("");
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [draftSpecialties, setDraftSpecialties] = useState<string[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const [symptomText, setSymptomText] = useState("");
  const [analyzingSymptoms, setAnalyzingSymptoms] = useState(false);
  const [recommendedSpecialties, setRecommendedSpecialties] = useState<
    string[]
  >([]);
  const [recommendedOpen, setRecommendedOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingDoctor, setBookingDoctor] = useState<DoctorCardData | null>(
    null,
  );
  const [bookingReason, setBookingReason] = useState("");
  const [selectedScheduleId, setSelectedScheduleId] = useState("");
  const [bookingSubmitting, setBookingSubmitting] = useState(false);

  const doctorsQuery = useQuery<DoctorDiscoveryItem[], Error>({
    queryKey: ["doctors"],
    queryFn: () => fetchDoctors(),
    // keep data visible and avoid repeated skeleton flashes
    staleTime: 1000 * 60, // 1 minute
    refetchOnWindowFocus: false,
  });

  const doctors = useMemo(
    () => (doctorsQuery.data ?? []).map(toCardData),
    [doctorsQuery.data],
  );

  const bookingSchedulesQuery = useQuery<DoctorScheduleItem[], Error>({
    queryKey: ["doctor-schedules", bookingDoctor?.id],
    queryFn: () => {
      if (!bookingDoctor?.id) {
        return Promise.resolve([]);
      }

      return fetchDoctorSchedules(bookingDoctor.id, {
        date: new Date().toISOString(),
      });
    },
    enabled: bookingOpen && !!bookingDoctor?.id,
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  });

  const availableSpecialties = useMemo(() => {
    const counts = new Map<string, number>();

    for (const doctor of doctors) {
      for (const specialization of doctor.specializations) {
        counts.set(specialization, (counts.get(specialization) ?? 0) + 1);
      }
    }

    return Array.from(counts.entries())
      .sort(([leftName], [rightName]) => leftName.localeCompare(rightName))
      .map(([name, count]) => ({ name, count }));
  }, [doctors]);

  const filteredDoctors = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return doctors.filter((doctor) => {
      const matchesSearch =
        !normalizedSearch ||
        [doctor.fullName, doctor.title, doctor.bio, ...doctor.specializations]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesSpecialty =
        selectedSpecialties.length === 0 ||
        selectedSpecialties.some((specialty) =>
          doctor.specializations.includes(specialty),
        );

      return matchesSearch && matchesSpecialty;
    });
  }, [doctors, search, selectedSpecialties]);

  const mobileSpecialties = [
    "All",
    ...availableSpecialties.map((specialty) => specialty.name),
  ];
  // reset pagination when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedSpecialties]);

  function openFiltersModal() {
    setDraftSpecialties(selectedSpecialties);
    setFiltersOpen(true);
  }

  function openBookingSheet(doctor: DoctorCardData) {
    setBookingDoctor(doctor);
    setBookingReason("");
    setSelectedScheduleId("");
    setBookingOpen(true);
  }

  async function analyzeSymptoms() {
    if (!symptomText.trim()) return;
    setAnalyzingSymptoms(true);
    try {
      const res = await fetchSymptomRecommendations(symptomText.trim());
      setRecommendedSpecialties(res.recommendedSpecializations ?? []);
    } catch (err) {
      console.error("Symptom analysis failed", err);
    } finally {
      setAnalyzingSymptoms(false);
    }
  }

  function toggleDraftSpecialty(specialty: string) {
    setDraftSpecialties((current) =>
      current.includes(specialty)
        ? current.filter((entry) => entry !== specialty)
        : [...current, specialty],
    );
  }

  function applyFilters() {
    setSelectedSpecialties(draftSpecialties);
    setFiltersOpen(false);
  }

  function clearFilters() {
    setDraftSpecialties([]);
    setSelectedSpecialties([]);
  }

  useEffect(() => {
    if (bookingSchedulesQuery.data?.length && !selectedScheduleId) {
      setSelectedScheduleId(bookingSchedulesQuery.data[0].id);
    }
  }, [bookingSchedulesQuery.data, selectedScheduleId]);

  async function confirmBooking() {
    if (!bookingDoctor || !selectedScheduleId) {
      return;
    }

    if (!patient?.id) {
      toast.error("Your patient profile is still loading.");
      return;
    }

    setBookingSubmitting(true);

    try {
      await bookAppointment({
        patientId: patient.id,
        doctorId: bookingDoctor.id,
        scheduleId: selectedScheduleId,
        reason: bookingReason.trim() || undefined,
      });

      toast.success("Appointment booked successfully.");
      setBookingOpen(false);
      setBookingDoctor(null);
      setBookingReason("");
      setSelectedScheduleId("");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to book appointment.",
      );
    } finally {
      setBookingSubmitting(false);
    }
  }

  function formatSlotLabel(schedule: DoctorScheduleItem) {
    return `${new Date(schedule.startTime).toLocaleString([], {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })} - ${new Date(schedule.endTime).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    })}`;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.10),transparent_28%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.08),transparent_24%),linear-gradient(180deg,#f8fbff_0%,#f6f8fc_100%)] px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-360 gap-6">
        <main className="min-w-0 flex-1 space-y-5">
          <div className="space-y-4 rounded-3xl border border-border/70 bg-card/90 p-4 shadow-sm backdrop-blur sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search doctor, specialty, or clinic..."
                  className="h-12 rounded-2xl pl-11 text-sm"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>

              <Button
                variant="outline"
                className="h-12 rounded-2xl px-5 lg:w-auto"
                onClick={openFiltersModal}
              >
                <Filter className="size-4" />
                Filters
                {selectedSpecialties.length > 0 ? (
                  <Badge variant="secondary" className="ml-1 rounded-full px-2">
                    {selectedSpecialties.length}
                  </Badge>
                ) : null}
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
                Available Doctors
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {filteredDoctors.length} professional
                {filteredDoctors.length === 1 ? "" : "s"} found in your area
              </p>
            </div>

            <Button
              variant="outline"
              className="rounded-2xl px-4 self-start lg:self-auto"
              onClick={() => setRecommendedOpen(true)}
            >
              <Filter className="size-4" />
              Recommended
            </Button>
          </div>

          {selectedSpecialties.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              {selectedSpecialties.map((specialty) => (
                <Badge
                  key={specialty}
                  variant="secondary"
                  className="rounded-full px-3 py-1"
                >
                  {specialty}
                </Badge>
              ))}
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full px-3"
                onClick={clearFilters}
              >
                Clear filters
              </Button>
            </div>
          ) : null}

          <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
            {doctorsQuery.isLoading && !doctorsQuery.data ? (
              Array.from({ length: 6 }).map((_, index) => (
                <Card
                  key={index}
                  className="gap-0 border-border/70 bg-card/90 shadow-sm"
                >
                  <CardContent className="pt-6">
                    <div className="flex flex-col gap-4 sm:flex-row">
                      <Skeleton className="aspect-4/3 rounded-2xl sm:size-24 sm:shrink-0 sm:aspect-square" />
                      <div className="min-w-0 flex-1 space-y-3">
                        <Skeleton className="h-5 w-2/3 rounded-full" />
                        <Skeleton className="h-4 w-1/3 rounded-full" />
                        <div className="flex gap-2">
                          <Skeleton className="h-6 w-20 rounded-full" />
                          <Skeleton className="h-6 w-24 rounded-full" />
                        </div>
                        <Skeleton className="h-10 w-full rounded-2xl" />
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="gap-3 pt-0">
                    <Skeleton className="h-9 flex-1 rounded-2xl" />
                    <Skeleton className="h-9 flex-1 rounded-2xl" />
                  </CardFooter>
                </Card>
              ))
            ) : doctorsQuery.isError ? (
              <Card className="border-dashed border-destructive/30 bg-card/90 p-8 text-center lg:col-span-2">
                <p className="text-lg font-semibold text-foreground">
                  Unable to load doctors
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {doctorsQuery.error instanceof Error
                    ? doctorsQuery.error.message
                    : "Please try again in a moment."}
                </p>
              </Card>
            ) : filteredDoctors.length ? (
              (() => {
                const pageCount = Math.max(
                  1,
                  Math.ceil(filteredDoctors.length / itemsPerPage),
                );
                const start = (currentPage - 1) * itemsPerPage;
                const paginated = filteredDoctors.slice(
                  start,
                  start + itemsPerPage,
                );

                return paginated.map((doctor) => {
                  const isRec = doctor.specializations.some((s) =>
                    recommendedSpecialties.includes(s),
                  );
                  return (
                    <DoctorCard
                      key={doctor.id}
                      doctor={doctor}
                      isRecommended={isRec}
                      onBookNow={openBookingSheet}
                    />
                  );
                });
              })()
            ) : (
              <Card className="border-dashed border-border/70 bg-card/90 p-8 text-center lg:col-span-2">
                <p className="text-lg font-semibold text-foreground">
                  No doctors found
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Try a different search term or open filters to change
                  specialties.
                </p>
              </Card>
            )}
          </div>

          <div className="flex items-center justify-center gap-2 pb-4 pt-2">
            <Button
              variant="outline"
              size="icon-sm"
              className="rounded-full"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="size-4" />
            </Button>

            {(() => {
              const pageCount = Math.max(
                1,
                Math.ceil(filteredDoctors.length / itemsPerPage),
              );
              const pages = Array.from({ length: pageCount }, (_, i) => i + 1);
              return pages.map((page) => (
                <Button
                  key={page}
                  variant={page === currentPage ? "default" : "outline"}
                  size="icon-sm"
                  className="rounded-full"
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              ));
            })()}

            <Button
              variant="outline"
              size="icon-sm"
              className="rounded-full"
              onClick={() => setCurrentPage((p) => p + 1)}
              disabled={
                currentPage >= Math.ceil(filteredDoctors.length / itemsPerPage)
              }
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>

          <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
            <SheetContent side="right" className="w-full sm:max-w-md">
              <SheetHeader className="pb-2">
                <SheetTitle>Filter doctors</SheetTitle>
                <SheetDescription>
                  Choose specialties from the currently available doctors.
                </SheetDescription>
              </SheetHeader>

              <div className="flex-1 space-y-6 overflow-y-auto px-6 pb-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">
                      Specialty
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 rounded-full px-3"
                      onClick={clearFilters}
                    >
                      Reset
                    </Button>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    {availableSpecialties.length ? (
                      availableSpecialties.map((specialty) => {
                        const selected = draftSpecialties.includes(
                          specialty.name,
                        );

                        const isRecommended = recommendedSpecialties.includes(
                          specialty.name,
                        );

                        return (
                          <Button
                            key={specialty.name}
                            type="button"
                            variant={selected ? "default" : "outline"}
                            className={`h-auto rounded-2xl px-4 py-3 flex items-center justify-between ${isRecommended ? "ring-2 ring-emerald-300" : ""}`}
                            onClick={() => toggleDraftSpecialty(specialty.name)}
                          >
                            <span className="flex-1 wrap-break-word text-wrap text-left">
                              <span className="text-sm font-medium break-all leading-tight">
                                {specialty.name}
                              </span>
                              <span className="block text-xs opacity-80">
                                {specialty.count} doctor
                                {specialty.count === 1 ? "" : "s"}
                              </span>
                            </span>
                            <span className="block ml-3 shrink-0 text-xs font-semibold">
                              {selected ? "On" : "Off"}
                            </span>
                          </Button>
                        );
                      })
                    ) : (
                      <Card className="col-span-2 border-dashed bg-muted/20 p-4 text-sm text-muted-foreground">
                        Loading specialties...
                      </Card>
                    )}
                  </div>
                </div>

                <Card className="border-border/70 bg-muted/20 p-4">
                  <p className="text-sm font-medium text-foreground">
                    Active filters
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {draftSpecialties.length
                      ? draftSpecialties.join(", ")
                      : "No specialty filters selected."}
                  </p>
                </Card>
              </div>

              <SheetFooter className="border-t border-border/70 bg-background px-6 py-4">
                <div className="flex w-full gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 rounded-2xl"
                    onClick={clearFilters}
                  >
                    Clear all
                  </Button>
                  <Button className="flex-1 rounded-2xl" onClick={applyFilters}>
                    Apply filters
                  </Button>
                </div>
              </SheetFooter>
            </SheetContent>
          </Sheet>
          <Sheet open={recommendedOpen} onOpenChange={setRecommendedOpen}>
            <SheetContent side="right" className="w-full sm:max-w-md">
              <SheetHeader className="pb-2">
                <SheetTitle>Get recommended specialties</SheetTitle>
                <SheetDescription>
                  Enter symptoms and we'll suggest the medical specialties
                  best-suited to help.
                </SheetDescription>
              </SheetHeader>

              <div className="flex-1 space-y-6 overflow-y-auto px-6 pb-6">
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-foreground">
                    Symptoms
                  </label>
                  <textarea
                    value={symptomText}
                    onChange={(e) => setSymptomText(e.target.value)}
                    placeholder="Describe your symptoms, e.g. persistent cough and fever"
                    className="w-full rounded-lg border border-border/70 bg-background p-3 text-sm shadow-sm"
                    rows={6}
                  />

                  <div className="flex items-center gap-2">
                    <Button
                      onClick={analyzeSymptoms}
                      disabled={!symptomText.trim() || analyzingSymptoms}
                    >
                      {analyzingSymptoms ? "Analyzing..." : "Analyze"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSymptomText("");
                        setRecommendedSpecialties([]);
                      }}
                    >
                      Clear
                    </Button>
                  </div>

                  {recommendedSpecialties.length ? (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">
                        Suggested specialties
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {recommendedSpecialties.map((s) => (
                          <Badge
                            key={s}
                            variant="secondary"
                            className="rounded-full px-3"
                          >
                            {s}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              <SheetFooter className="border-t border-border/70 bg-background px-6 py-4">
                <div className="flex w-full gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 rounded-2xl"
                    onClick={() => setRecommendedOpen(false)}
                  >
                    Close
                  </Button>
                  <Button
                    className="flex-1 rounded-2xl"
                    onClick={() => {
                      setSelectedSpecialties(recommendedSpecialties);
                      setDraftSpecialties(recommendedSpecialties);
                      setRecommendedOpen(false);
                    }}
                    disabled={recommendedSpecialties.length === 0}
                  >
                    Apply recommendations
                  </Button>
                </div>
              </SheetFooter>
            </SheetContent>
          </Sheet>
          <Sheet open={bookingOpen} onOpenChange={setBookingOpen}>
            <SheetContent side="right" className="w-full sm:max-w-lg">
              <SheetHeader className="pb-2">
                <SheetTitle>Book an appointment</SheetTitle>
                <SheetDescription>
                  Choose an available time slot set by the doctor.
                </SheetDescription>
              </SheetHeader>

              <div className="flex-1 space-y-6 overflow-y-auto px-6 pb-6">
                <Card className="border-border/70 bg-muted/20 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Selected doctor
                  </p>
                  <p className="mt-1 text-base font-semibold">
                    {bookingDoctor?.fullName ?? "No doctor selected"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {bookingDoctor?.title ?? ""}
                  </p>
                </Card>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-foreground">
                    Reason for visit
                  </label>
                  <Textarea
                    value={bookingReason}
                    onChange={(event) => setBookingReason(event.target.value)}
                    placeholder="Optional: describe your symptoms or what you'd like to discuss"
                    className="min-h-28 rounded-2xl"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">
                      Available time slots
                    </p>
                    {bookingSchedulesQuery.isFetching ? (
                      <span className="text-xs text-muted-foreground">
                        Loading...
                      </span>
                    ) : null}
                  </div>

                  {bookingSchedulesQuery.isLoading &&
                  !bookingSchedulesQuery.data ? (
                    <div className="space-y-2">
                      {Array.from({ length: 3 }).map((_, index) => (
                        <Skeleton key={index} className="h-14 rounded-2xl" />
                      ))}
                    </div>
                  ) : bookingSchedulesQuery.data?.length ? (
                    <div className="space-y-2">
                      {bookingSchedulesQuery.data.map((schedule) => {
                        const selected = selectedScheduleId === schedule.id;
                        return (
                          <Button
                            key={schedule.id}
                            type="button"
                            variant={selected ? "default" : "outline"}
                            className="h-auto w-full justify-start rounded-2xl px-4 py-3 text-left"
                            onClick={() => setSelectedScheduleId(schedule.id)}
                          >
                            <div className="flex w-full items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold">
                                  {formatSlotLabel(schedule)}
                                </p>
                                <p className="text-xs opacity-80">
                                  Time slot available for booking
                                </p>
                              </div>
                              <Badge
                                variant={selected ? "secondary" : "outline"}
                                className="rounded-full"
                              >
                                {selected ? "Selected" : "Choose"}
                              </Badge>
                            </div>
                          </Button>
                        );
                      })}
                    </div>
                  ) : (
                    <Card className="border-dashed border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
                      No available schedule slots found for this doctor.
                    </Card>
                  )}
                </div>
              </div>

              <SheetFooter className="border-t border-border/70 bg-background px-6 py-4">
                <div className="flex w-full gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 rounded-2xl"
                    onClick={() => setBookingOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 rounded-2xl"
                    onClick={confirmBooking}
                    disabled={
                      bookingSubmitting ||
                      !bookingDoctor ||
                      !selectedScheduleId ||
                      patientQuery.isLoading
                    }
                  >
                    {bookingSubmitting ? "Booking..." : "Confirm booking"}
                  </Button>
                </div>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </main>
      </div>
    </div>
  );
}
