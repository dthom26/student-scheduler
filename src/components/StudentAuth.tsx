import { useState } from "react";
import { submissionRepository } from "../repositories/SubmissionRepository";
import { ERROR_MESSAGES } from "../constants/errors";
import type { SubmissionResponse } from "../types/submission";
import styles from "./StudentAuth.module.css";

interface StudentAuthProps {
  onStudentAuthenticated: (studentData: {
    studentId: string;
    studentName: string;
    location: string;
    isReturning: boolean;
    existingSubmission?: SubmissionResponse;
  }) => void;
}

export default function StudentAuth({ onStudentAuthenticated }: StudentAuthProps) {
  const [studentId, setStudentId] = useState("");
  const [studentName, setStudentName] = useState("");
  const [location, setLocation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReturningStudent, setIsReturningStudent] = useState<boolean | null>(null);
  const [existingSubmission, setExistingSubmission] = useState<SubmissionResponse | null>(null);

  const validateStudentId = (id: string): boolean => {
    return id.trim().length >= 3 && /^[a-zA-Z0-9]+$/.test(id.trim());
  };

  const validateStudentName = (name: string): boolean => {
    return name.trim().length >= 2 && /^[a-zA-Z\s]+$/.test(name.trim());
  };

  const handleNewStudent = () => {
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
      const submission = await submissionRepository.fetchSubmissionById(studentId);
      if (!submission) {
        setError(ERROR_MESSAGES.NO_EXISTING_SUBMISSION);
        setIsLoading(false);
        return;
      }
      setExistingSubmission(submission);
      setStudentName(submission.studentName);
      setLocation(submission.location);
      setIsReturningStudent(true);
    } catch (err) {
      console.error(ERROR_MESSAGES.FETCH_EXISTING_SUBMISSION_FAILED, err);
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
      <div className={styles.container}>
        <div className={styles.returnCard}>
          <h2 className={styles.title}>Welcome Back!</h2>
          <div className={styles.summary}>
            <p>
              <strong>Student ID:</strong> {studentId}
            </p>
            <p>
              <strong>Name:</strong> {existingSubmission.studentName}
            </p>
            <p>
              <strong>Location:</strong> {existingSubmission.location}
            </p>
            <p className={styles.success}>✓ Existing submission found</p>
          </div>

          <div className={styles.row}>
            <button className={styles.primaryButton} onClick={handleConfirmReturning}>
              Continue to Edit Schedule
            </button>
            <button
              className={styles.secondaryButton}
              onClick={() => {
                setIsReturningStudent(null);
                setExistingSubmission(null);
                setStudentId("");
                setStudentName("");
                setLocation("");
                setError(null);
              }}
            >
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.title}>Student Access</h2>
        {error && <div className={styles.error}>{error}</div>}

        {isReturningStudent === null && (
          <div className={styles.section}>
            <p className={styles.muted}>
              Are you a new student submitting for the first time, or a returning student updating your
              schedule?
            </p>
            <div className={styles.row}>
              <button
                className={styles.primaryButton}
                onClick={() => setIsReturningStudent(false)}
                disabled={isLoading}
              >
                New Student
              </button>
              <button
                className={styles.ghostButton}
                onClick={() => setIsReturningStudent(true)}
                disabled={isLoading}
              >
                Returning Student
              </button>
            </div>
          </div>
        )}

        {isReturningStudent === false && (
          <div>
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Student ID <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="Enter your Student ID"
                className={styles.input}
                disabled={isLoading}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Full Name <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Enter your full name"
                className={styles.input}
                disabled={isLoading}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Location <span className={styles.required}>*</span>
              </label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className={styles.input}
                disabled={isLoading}
              >
                <option value="">Select Location</option>
                <option value="hsl">Health Sciences Library</option>
                <option value="med">Medical Library</option>
              </select>
            </div>

            <button
              onClick={handleNewStudent}
              disabled={isLoading || !studentId.trim() || !studentName.trim() || !location}
              className={styles.primaryButton}
            >
              {isLoading ? "Validating..." : "Continue as New Student"}
            </button>
          </div>
        )}

        {isReturningStudent === true && !existingSubmission && (
          <div>
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Student ID <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="Enter your Student ID"
                className={styles.input}
                disabled={isLoading}
              />
            </div>
            <button
              onClick={handleReturningStudent}
              disabled={isLoading || !studentId.trim()}
              className={styles.primaryButton}
            >
              {isLoading ? "Loading..." : "Access My Existing Schedule"}
            </button>
          </div>
        )}

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
            className={styles.backButton}
            disabled={isLoading}
          >
            Back to Selection
          </button>
        )}

        {isLoading && <div className={styles.loading}>Please wait...</div>}
      </div>
    </div>
  );
}
