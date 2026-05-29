const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
).replace(/\/$/, ""); // Remove trailing slash

export async function uploadProfilePicture(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/upload/uploadImage`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("File upload failed");
  }

  return response.json();
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPatientPayload {
  email: string;
  password: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  birthday: string;
  weight?: number;
  height?: number;
  phone?: string;
  address?: string;
  profilePicture?: string;
  emergencyName?: string;
  emergencyPhone?: string;
  medicalHistory?: string[];
}

export interface RegisterDoctorPayload {
  email: string;
  password: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  bio?: string;
  profilePicture?: string;
  specializations?: string[];
}

export async function login(payload: LoginPayload) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Login failed");
  }

  return response.json();
}

export async function registerPatient(payload: RegisterPatientPayload) {
  // Remove frontend-only fields that backend doesn't expect
  const { agreeToTerms, ...payloadForBackend } = payload as any;

  const response = await fetch(`${API_BASE_URL}/auth/register/patient`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payloadForBackend),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      error.message || JSON.stringify(error) || "Registration failed",
    );
  }

  return response.json();
}

export async function registerDoctor(payload: RegisterDoctorPayload) {
  // Remove frontend-only fields that backend doesn't expect
  const { agreeToTerms, ...payloadForBackend } = payload as any;

  const response = await fetch(`${API_BASE_URL}/auth/register/doctor`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payloadForBackend),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error("Registration error:", error);
    throw new Error(
      error.message || JSON.stringify(error) || "Registration failed",
    );
  }

  return response.json();
}
