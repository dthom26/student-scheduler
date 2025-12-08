import type { ScheduleSubmission } from "../types/submission";
import { submissionCache } from "./cache";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://student-schedular-backend.onrender.com";

export async function submitSchedule(
  payload: ScheduleSubmission
): Promise<any> {
  // Validate input
  if (
    !payload.student?.id ||
    !payload.student?.name ||
    !payload.student?.location
  ) {
    throw new Error("Missing required student information");
  }

  if (!payload.schedule || payload.schedule.length === 0) {
    throw new Error("Schedule cannot be empty");
  }

  // Make request
  const response = await fetch(`${API_BASE_URL}/api/v1/submissions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      studentId: payload.student.id,
      studentName: payload.student.name,
      location: payload.student.location,
      schedule: payload.schedule,
      notes: payload.notes || "",
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to submit schedule");
  }

  const data = await response.json();
  return data;
}

export async function fetchSubmissions(
  token: string,
  location?: string,
  forceRefresh = false
): Promise<any[]> {
  if (!token) {
    throw new Error("Auth token is required");
  }

  // Create cache key based on token and location
  const cacheKey = `submissions_${token}_${location || "all"}`;

  // Check cache first unless force refresh is requested
  if (!forceRefresh) {
    const cachedData = submissionCache.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }
  }

  const url = new URL(`${API_BASE_URL}/api/v1/submissions`);
  if (location) {
    url.searchParams.append("location", location);
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to fetch submissions");
  }

  const data = await response.json();

  // Cache the successful response
  submissionCache.set(cacheKey, data);

  return data;
}

export async function getStudentSubmission(studentId: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/api/v1/submissions/${studentId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (response.status === 404) {
    return null; // No submission found for this student
  }

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to fetch student submission");
  }

  return response.json();
}

export async function updateStudentSchedule(
  studentId: string,
  payload: ScheduleSubmission
): Promise<any> {
  // Validate input
  if (
    !payload.student?.id ||
    !payload.student?.name ||
    !payload.student?.location
  ) {
    throw new Error("Missing required student information");
  }

  if (!payload.schedule || payload.schedule.length === 0) {
    throw new Error("Schedule cannot be empty");
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/submissions/${studentId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      studentId: payload.student.id,
      studentName: payload.student.name,
      location: payload.student.location,
      schedule: payload.schedule,
      notes: payload.notes || "",
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to update schedule");
  }

  return response.json();
}
