export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
).replace(/\/$/, ""); // Remove trailing slash

type ApiBody = BodyInit | object | null | undefined;

type ApiRequestOptions = Omit<RequestInit, "body"> & {
  body?: ApiBody;
  params?: object;
};

function buildApiUrl(path: string, params?: ApiRequestOptions["params"]) {
  const url = new URL(`${API_BASE_URL}${path}`);

  for (const [key, value] of Object.entries(
    (params ?? {}) as Record<string, unknown>,
  )) {
    if (value === null || value === undefined || value === "") {
      continue;
    }

    url.searchParams.set(key, String(value));
  }

  return url.toString();
}

export async function apiRequest<TResponse>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<TResponse> {
  const headers = new Headers(options.headers);
  let body: BodyInit | undefined;

  if (options.body instanceof FormData || typeof options.body === "string") {
    body = options.body;
  } else if (options.body !== undefined) {
    body = JSON.stringify(options.body);
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
  }

  const response = await fetch(buildApiUrl(path, options.params), {
    ...options,
    headers,
    body,
  });

  if (!response.ok) {
    const errorMessage = await response.text();
    throw new Error(
      errorMessage || `Request failed with status ${response.status}`,
    );
  }

  return (await response.json()) as TResponse;
}

export async function uploadProfilePicture(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  return apiRequest<Record<string, unknown>>("/upload/uploadImage", {
    method: "POST",
    body: formData,
  });
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
  return apiRequest<Record<string, unknown>>("/auth/login", {
    method: "POST",
    body: payload,
  });
}

export async function registerPatient(payload: RegisterPatientPayload) {
  // Remove frontend-only fields that backend doesn't expect
  const { agreeToTerms, ...payloadForBackend } = payload as any;

  return apiRequest<Record<string, unknown>>("/auth/register/patient", {
    method: "POST",
    body: payloadForBackend,
  });
}

export async function registerDoctor(payload: RegisterDoctorPayload) {
  // Remove frontend-only fields that backend doesn't expect
  const { agreeToTerms, ...payloadForBackend } = payload as any;

  return apiRequest<Record<string, unknown>>("/auth/register/doctor", {
    method: "POST",
    body: payloadForBackend,
  });
}

export interface DoctorDiscoverySpecialization {
  specialization: {
    name: string;
  };
}

export interface DoctorDiscoveryItem {
  id: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  profilePicture?: string | null;
  bio?: string | null;
  specializations?: DoctorDiscoverySpecialization[];
}

export interface FetchDoctorsParams {
  search?: string;
  specialization?: string;
  symptom?: string;
}

export async function fetchDoctors(params: FetchDoctorsParams = {}) {
  return apiRequest<DoctorDiscoveryItem[]>("/doctors", {
    params,
  });
}
