export const PROTECTED_PAGES: Record<"PATIENT" | "DOCTOR", any> = {
  PATIENT: {
    DASHBOARD: "/patient/dashboard",
    DOCTORS: "/patient/doctors",
    APPOINTMENTS: "/patient/appointments",
    RECORDS: "/patient/records",
    ACCOUNT: "/patient/account",
  },
  DOCTOR: {
    DASHBOARD: "/doctor/dashboard",
    APPOINTMENTS: "/doctor/appointments",
    SCHEDULE: "/doctor/schedule",
    RECORDS: "/doctor/records",
    ACCOUNT: "/doctor/account",
  },
};