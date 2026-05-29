export const PROTECTED_PAGES: Record<"PATIENT" | "DOCTOR", any> = {
  PATIENT: {
    DASHBOARD: "/patient/dashboard",
    DOCTORS: "/patient/doctors",
    APPOINTMENTS: "/patient/appointments",
    MESSAGES: "/patient/messages",
    RECORDS: "/patient/records",
    ACCOUNT: "/patient/account",
  },
  DOCTOR: {
    DASHBOARD: "/doctor/dashboard",
    APPOINTMENTS: "/doctor/appointments",
    SCHEDULE: "/doctor/schedule",
    MESSAGES: "/doctor/messages",
    RECORDS: "/doctor/records",
    ACCOUNT: "/doctor/account",
  },
};