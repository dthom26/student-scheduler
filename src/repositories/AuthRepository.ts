import { http } from "../services/httpClient";
import type { LoginResponse, ValidateTokenResponse } from "../types/auth";

/**
 * AuthRepository
 * 
 * Handles all authentication-related data operations.
 * 
 * Key Principles:
 * 1. Single Responsibility: Only manages auth data access
 * 2. Abstraction: Hides implementation details from consumers
 * 3. Dependency Inversion: Depends on http abstraction, not fetch directly
 * 4. Testability: Easy to mock for unit tests
 */

export class AuthRepository {
  /**
   * Authenticates a manager with password
   * 
   * @param password - Manager password
   * @returns Login response with token and role
   * @throws Error if authentication fails
   */
  async loginManager(password: string): Promise<LoginResponse> {
    return http<LoginResponse>("/api/v1/auth/manager", {
      method: "POST",
      body: JSON.stringify({ password }),
    });
  }

  /**
   * Validates an authentication token
   * 
   * @param token - Authentication token to validate
   * @returns True if token is valid, false otherwise
   */
  async validateToken(token: string): Promise<boolean> {
    try {
      await http<ValidateTokenResponse>("/api/v1/auth/validate", {
        method: "GET",
        authToken: token,
      });
      return true;
    } catch (error) {
      // Token is invalid if validation endpoint returns error
      return false;
    }
  }
}

// Export a singleton instance for convenience
// This ensures all parts of the app use the same repository instance
export const authRepository = new AuthRepository();
