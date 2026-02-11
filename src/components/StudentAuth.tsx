import { useState } from "react";
import { submissionRepository } from "../repositories/SubmissionRepository";
import { ERROR_MESSAGES } from "../constants/errors";
import type { SubmissionResponse } from "../types/submission";

interface StudentAuthProps {
  onStudentAuthenticated: (studentData: {
    studentId: string;
    studentName: string;
    location: string;
    isReturning: boolean;
    existingSubmission?: SubmissionResponse;
  }) => void;
}

export default function StudentAuth({
  onStudentAuthenticated,
}: StudentAuthProps) {
  const [studentId, setStudentId] = useState("");
  const [studentName, setStudentName] = useState("");
  const [location, setLocation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReturningStudent, setIsReturningStudent] = useState<boolean | null>(
    null
  );
  const [existingSubmission, setExistingSubmission] = useState<SubmissionResponse | null>(null);

  const validateStudentId = (id: string): boolean => {
    // Basic validation - could be enhanced based on your institution's ID format
    return id.trim().length >= 3 && /^[a-zA-Z0-9]+$/.test(id.trim());
  };

  const validateStudentName = (name: string): boolean => {
    return name.trim().length >= 2 && /^[a-zA-Z\s]+$/.test(name.trim());
  };

  const handleNewStudent = () => {
    // Validate inputs
    if (!validateStudentId(studentId)) {
      setError(ERROR_MESSAGES.INVALID_STUDENT_ID);
      return;
    }
    if (!validateStudentName(studentName)) {
      setError(ERROR_MESSAGES.UNKNOWN);
      return;
    }
    if (!location) {
      setError(ERROR_MESSAGES.UNKNOWN);
      return;
    }
    setError(null);
    // Proceed with new student
    onStudentAuthenticated({
      studentId: studentId.trim(),
      studentName: studentName.trim(),
      location,
      isReturning: false,
    });
  };

  const handleReturningStudent = async () => {
    if (!validateStudentId(studentId)) {
      setError(ERROR_MESSAGES.INVALID_STUDENT_ID);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const existingSubmission = await submissionRepository.fetchSubmissionById(studentId);
      if (!existingSubmission) {
        setError(ERROR_MESSAGES.NO_EXISTING_SUBMISSION);
        setIsLoading(false);
        return;
      }

      setExistingSubmission(existingSubmission);
      setStudentName(existingSubmission.studentName);
      setLocation(existingSubmission.location);
      setIsReturningStudent(true);
    } catch (error) {
      console.error(ERROR_MESSAGES.FETCH_EXISTING_SUBMISSION_FAILED, error);
      setError(ERROR_MESSAGES.FETCH_EXISTING_SUBMISSION_FAILED);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmReturning = () => {
    if (existingSubmission) {
      onStudentAuthenticated({
        studentId: studentId.trim(),
        studentName: existingSubmission.studentName,
        location: existingSubmission.location,
        isReturning: true,
        existingSubmission,
      });
    }
  };

  if (isReturningStudent === true && existingSubmission) {
    return (
      <div style={{ padding: "20px", maxWidth: "400px", margin: "0 auto" }}>
        <h2>Welcome Back!</h2>
        <div
          style={{
            marginBottom: "20px",
            padding: "15px",
            backgroundColor: "#f5f5f5",
            borderRadius: "5px",
          }}
        >
          <p>
            <strong>Student ID:</strong> {studentId}
          </p>
          <p>
            <strong>Name:</strong> {existingSubmission.studentName}
          </p>
          <p>
            <strong>Location:</strong> {existingSubmission.location}
          </p>
          <p style={{ color: "#4caf50" }}>✓ Existing submission found</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={handleConfirmReturning}
            style={{ flex: 1, padding: "10px" }}
          >
            Continue to Edit Schedule
          </button>
          <button
            onClick={() => {
              setIsReturningStudent(null);
              setExistingSubmission(null);
              setStudentId("");
              setStudentName("");
              setLocation("");
              setError(null);
            }}
            style={{ padding: "10px", backgroundColor: "#ccc" }}
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", maxWidth: "400px", margin: "0 auto" }}>
      <h2>Student Access</h2>
      {error && (
        <div
          style={{
            color: "red",
            backgroundColor: "#ffebee",
            padding: "10px",
            borderRadius: "5px",
            marginBottom: "20px",
          }}
        >
          {error}
        </div>
      )}
      {isReturningStudent === null && (
        <div style={{ marginBottom: "20px" }}>
          <p style={{ marginBottom: "15px", color: "#666" }}>
            Are you a new student submitting for the first time, or a returning
            student updating your schedule?
          </p>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => setIsReturningStudent(false)}
              style={{
                flex: 1,
                padding: "10px",
                backgroundColor: "#2196f3",
                color: "white",
                border: "none",
                borderRadius: "5px",
              }}
              disabled={isLoading}
            >
              New Student
            </button>
            <button
              onClick={() => setIsReturningStudent(true)}
              style={{
                flex: 1,
                padding: "10px",
                backgroundColor: "#4caf50",
                color: "white",
                border: "none",
                borderRadius: "5px",
              }}
              disabled={isLoading}
            >
              Returning Student
            </button>
          </div>
        </div>
      )}
      {isReturningStudent === false && (
        <div>
          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "5px" }}>
              Student ID <span style={{ color: "red" }}>*</span>
            </label>
            <input
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="Enter your Student ID"
              style={{ width: "100%", padding: "8px" }}
              disabled={isLoading}
            />
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "5px" }}>
              Full Name <span style={{ color: "red" }}>*</span>
            </label>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="Enter your full name"
              style={{ width: "100%", padding: "8px" }}
              disabled={isLoading}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "5px" }}>
              Location <span style={{ color: "red" }}>*</span>
            </label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              style={{ width: "100%", padding: "8px" }}
              disabled={isLoading}
            >
              <option value="">Select Location</option>
              <option value="hsl">Health Sciences Library</option>
              <option value="med">Medical Library</option>
            </select>
          </div>

          <button
            onClick={handleNewStudent}
            disabled={
              isLoading || !studentId.trim() || !studentName.trim() || !location
            }
            style={{
              width: "100%",
              padding: "10px",
              backgroundColor: "#2196f3",
              color: "white",
              border: "none",
              borderRadius: "5px",
            }}
          >
            {isLoading ? "Validating..." : "Continue as New Student"}
          </button>
        </div>
      )}
      {isReturningStudent === true && !existingSubmission && (
        <div>
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "5px" }}>
              Student ID <span style={{ color: "red" }}>*</span>
            </label>
            <input
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="Enter your Student ID"
              style={{ width: "100%", padding: "8px" }}
              disabled={isLoading}
            />
          </div>
          <button
            onClick={handleReturningStudent}
            disabled={isLoading || !studentId.trim()}
            style={{
              width: "100%",
              padding: "10px",
              backgroundColor: "#4caf50",
              color: "white",
              border: "none",
              borderRadius: "5px",
            }}
          >
            {isLoading ? "Loading..." : "Access My Existing Schedule"}
          </button>
        </div>
      )}{" "}
      {isReturningStudent !== null && (
        <button
          onClick={() => {
            setIsReturningStudent(null);
            setExistingSubmission(null);
            setStudentId("");
            setStudentName("");
            setLocation("");
            setError(null);
          }}
          style={{
            width: "100%",
            marginTop: "10px",
            padding: "8px",
            backgroundColor: "#ccc",
            border: "none",
            borderRadius: "5px",
          }}
          disabled={isLoading}
        >
          Back to Selection
        </button>
      )}
      {isLoading && (
        <div style={{ textAlign: "center", marginTop: "10px", color: "#666" }}>
          Please wait...
        </div>
      )}
    </div>
  );
}
