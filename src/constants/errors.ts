// Centralized error messages for the student scheduler
// Use these constants throughout your app for consistency

export const ERROR_MESSAGES = {
  MISSING_STUDENT_INFO: "Missing required student information",
  SCHEDULE_EMPTY: "Schedule cannot be empty",
  AUTH_TOKEN_REQUIRED: "Auth token is required",
  SUBMIT_FAILED: "Failed to submit schedule",
  FETCH_SUBMISSIONS_FAILED: "Failed to fetch submissions",
  FETCH_STUDENT_FAILED: "Failed to fetch student submission",
  UPDATE_SCHEDULE_FAILED: "Failed to update schedule",
  NO_AUTH_TOKEN: "No auth token available",
  FETCHING_SUBMISSIONS_ERROR: "An error occurred while fetching submissions",
  REFRESHING_DATA_ERROR: "An error occurred while refreshing data",
  INVALID_STUDENT_ID:
    "Student ID must be at least 3 characters and contain only letters and numbers",
  NO_EXISTING_SUBMISSION:
    "No existing submission found for this Student ID. Please use 'New Student' option.",
  FETCH_EXISTING_SUBMISSION_FAILED:
    "Failed to fetch your existing submission. Please try again.",
  LOGIN_FAILED: "Login failed",
  UNKNOWN: "An unknown error occurred",
};
