import { ERROR_MESSAGES } from "../constants/errors";
import { http } from "../services/httpClient";
import type {
  ScheduleSubmission,
  SubmissionResponse,
} from "../types/submission";

/**
 * SubmissionRepository
 * 
 * Handles all submission-related data operations with caching and validation.
 * 
 * Key Principles:
 * 1. Single Responsibility: Only manages submission data access
 * 2. Abstraction: Hides implementation details from consumers
 * 3. Dependency Inversion: Depends on http abstraction, not fetch directly
 * 4. Testability: Easy to mock for unit tests
 * 
 * @example
 * ```typescript
 * // Submit a new schedule
 * const result = await submissionRepository.submitSchedule(scheduleData);
 * 
 * // Fetch all submissions (manager only)
 * const all = await submissionRepository.getAllSubmissions(token);
 * 
 * // Fetch by location with caching
 * const filtered = await submissionRepository.getSubmissionsByLocation(token, "Main Campus");
 * ```
 */
export class SubmissionRepository {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Get data from cache if not expired
   * @private
   */
  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    const isExpired = Date.now() - cached.timestamp > this.CACHE_DURATION;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data as T;
  }

  /**
   * Store data in cache with timestamp
   * @private
   */
  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  /**
   * Clear all cached data
   * Useful when you need to force fresh data fetch
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Submit a new schedule
   * 
   * @param submissionData - The schedule submission data
   * @returns The created submission from the backend
   * @throws {Error} If required student information is missing
   * @throws {Error} If schedule is empty
   * @throws {Error} If submission already exists (409 conflict)
   */
  async submitSchedule(
    submissionData: ScheduleSubmission
  ): Promise<SubmissionResponse> {
    // Validate input
    if (
      !submissionData.student?.id ||
      !submissionData.student?.name ||
      !submissionData.student?.location
    ) {
      throw new Error(ERROR_MESSAGES.MISSING_STUDENT_INFO);
    }

    if (!submissionData.schedule || submissionData.schedule.length === 0) {
      throw new Error(ERROR_MESSAGES.SCHEDULE_EMPTY);
    }

    return http<SubmissionResponse>("/api/v1/submissions", {
      method: "POST",
      body: JSON.stringify(submissionData),
    });
  }

  /**
   * Fetch a submission by student ID
   * 
   * @param studentId - The unique student identifier
   * @returns The submission data, or null if not found (404)
   * @throws {Error} For network errors or server errors (non-404)
   */
  async fetchSubmissionById(
    studentId: string
  ): Promise<SubmissionResponse | null> {
    try {
      return await http<SubmissionResponse>(`/api/v1/submissions/${studentId}`, {
        method: "GET",
      });
    } catch (error: any) {
      if (error.message && error.message.includes("404")) {
        return null; // No submission found for this student
      }
      throw error; // Re-throw other errors (network, 500, etc.)
    }
  }

  /**
   * Fetch all submissions (manager-only)
   * 
   * @param token - Manager authentication token
   * @param forceRefresh - Skip cache and fetch fresh data
   * @returns Array of all submissions
   * @throws {Error} If token is missing or invalid
   */
  async getAllSubmissions(
    token: string,
    forceRefresh = false
  ): Promise<SubmissionResponse[]> {
    if (!token) {
      throw new Error(ERROR_MESSAGES.AUTH_TOKEN_REQUIRED);
    }

    const cacheKey = `submissions_${token}_all`;

    // Check cache first
    if (!forceRefresh) {
      const cached = this.getFromCache<SubmissionResponse[]>(cacheKey);
      if (cached) return cached;
    }

    const data = await http<SubmissionResponse[]>("/api/v1/submissions", {
      method: "GET",
      authToken: token,
    });

    // Cache the result
    this.setCache(cacheKey, data);

    return data;
  }

  /**
   * Fetch submissions filtered by location (manager-only)
   * 
   * @param token - Manager authentication token
   * @param location - Location to filter by
   * @param forceRefresh - Skip cache and fetch fresh data
   * @returns Array of submissions for the specified location
   * @throws {Error} If token is missing or invalid
   */
  async getSubmissionsByLocation(
    token: string,
    location: string,
    forceRefresh = false
  ): Promise<SubmissionResponse[]> {
    if (!token) {
      throw new Error(ERROR_MESSAGES.AUTH_TOKEN_REQUIRED);
    }

    const cacheKey = `submissions_${token}_${location}`;

    // Check cache first
    if (!forceRefresh) {
      const cached = this.getFromCache<SubmissionResponse[]>(cacheKey);
      if (cached) return cached;
    }

    const data = await http<SubmissionResponse[]>(
      `/api/v1/submissions?location=${encodeURIComponent(location)}`,
      {
        method: "GET",
        authToken: token,
      }
    );

    // Cache the result
    this.setCache(cacheKey, data);

    return data;
  }

  /**
   * Update an existing submission
   * 
   * @param studentId - The student ID whose submission to update
   * @param submissionData - The updated schedule submission data
   * @returns The updated submission from the backend
   * @throws {Error} If required student information is missing
   * @throws {Error} If schedule is empty
   * @throws {Error} If submission not found (404)
   */
  async updateSubmission(
    studentId: string,
    submissionData: ScheduleSubmission
  ): Promise<SubmissionResponse> {
    // Validate input
    if (
      !submissionData.student?.id ||
      !submissionData.student?.name ||
      !submissionData.student?.location
    ) {
      throw new Error(ERROR_MESSAGES.MISSING_STUDENT_INFO);
    }

    if (!submissionData.schedule || submissionData.schedule.length === 0) {
      throw new Error(ERROR_MESSAGES.SCHEDULE_EMPTY);
    }

    return http<SubmissionResponse>(`/api/v1/submissions/${studentId}`, {
      method: "PUT",
      body: JSON.stringify({
        studentId: submissionData.student.id,
        studentName: submissionData.student.name,
        location: submissionData.student.location,
        schedule: submissionData.schedule,
        notes: submissionData.notes || "",
      }),
    });
  }
}

/**
 * Singleton instance of SubmissionRepository
 * Use this throughout the application for consistent caching and state
 * 
 * @example
 * ```typescript
 * import { submissionRepository } from './repositories/SubmissionRepository';
 * 
 * const submissions = await submissionRepository.getAllSubmissions(token);
 * ```
 */
export const submissionRepository = new SubmissionRepository();
