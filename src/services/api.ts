import type { ScheduleSubmission } from "../types/submission";
import { submissionCache } from "./cache";
import { API_BASE_URL } from "../constants/api";
import { ERROR_MESSAGES } from "../constants/errors";
import { http } from "./httpClient";

export async function submitSchedule(
  payload: ScheduleSubmission
): Promise<any> {
  // Validate input
  if (
    !payload.student?.id ||
    !payload.student?.name ||
    !payload.student?.location
  ) {
    throw new Error(ERROR_MESSAGES.MISSING_STUDENT_INFO);
  }

  if (!payload.schedule || payload.schedule.length === 0) {
    throw new Error(ERROR_MESSAGES.SCHEDULE_EMPTY);
  }

  // Make request
  return http("/api/v1/submissions", {
    method: "POST",
    body: JSON.stringify({
      studentId: payload.student.id,
      studentName: payload.student.name,
      location: payload.student.location,
      schedule: payload.schedule,
      notes: payload.notes || "",
    }),
  });
}

export async function fetchSubmissions(
  token: string,
  location?: string,
  forceRefresh = false
): Promise<any[]> {
  if (!token) {
    throw new Error(ERROR_MESSAGES.AUTH_TOKEN_REQUIRED);
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

  let endpoint = "/api/v1/submissions";
  if (location) {
    endpoint += `?location=${encodeURIComponent(location)}`;
  }

  const data = await http<any[]>(endpoint, {
    method: "GET",
    authToken: token,
  });

  // Cache the successful response
  submissionCache.set(cacheKey, data);

  return data;
}

export async function getStudentSubmission(studentId: string): Promise<any> {
  try {
    return await http<any>(`/api/v1/submissions/${studentId}`, {
      method: "GET",
    });
  } catch (error: any) {
    if (error.message && error.message.includes("404")) {
      return null; // No submission found for this student
    }
    throw new Error(error.message || ERROR_MESSAGES.FETCH_STUDENT_FAILED);
  }
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
    throw new Error(ERROR_MESSAGES.MISSING_STUDENT_INFO);
  }

  if (!payload.schedule || payload.schedule.length === 0) {
    throw new Error(ERROR_MESSAGES.SCHEDULE_EMPTY);
  }

  return http(`/api/v1/submissions/${studentId}`, {
    method: "PUT",
    body: JSON.stringify({
      studentId: payload.student.id,
      studentName: payload.student.name,
      location: payload.student.location,
      schedule: payload.schedule,
      notes: payload.notes || "",
    }),
  });
}
