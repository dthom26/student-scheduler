import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { dataPreloader } from "../services/preloader";
import { STORAGE_KEYS } from "../constants/storage";
import { USER_ROLES } from "../constants/roles";
import { ERROR_MESSAGES } from "../constants/errors";
import { authRepository } from "../repositories/AuthRepository";

import { API_BASE_URL } from "../constants/api";
// Debug: Force build refresh - Nov 24 2025
console.log("Using API URL:", API_BASE_URL);

interface StudentData {
  studentId: string;
  studentName: string;
  location: string;
  isReturning: boolean;
  existingSubmission?: any;
}

type RoleType = (typeof USER_ROLES)[keyof typeof USER_ROLES] | null;

interface AuthContextType {
  token: string | null;
  role: RoleType;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  studentData: StudentData | null;
  loginManager: (password: string) => Promise<void>;
  selectStudent: () => void;
  authenticateStudent: (data: StudentData) => void;
  logout: () => void;
  clearError: () => void;
  validateToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<RoleType>(null);
  const [isLoading, setIsLoading] = useState(true); // Start with loading true
  const [error, setError] = useState<string | null>(null);
  const [studentData, setStudentData] = useState<StudentData | null>(null);

  // Validate if the token is still valid
  const validateToken = async (): Promise<boolean> => {
    const savedToken = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const savedRole = localStorage.getItem(STORAGE_KEYS.AUTH_ROLE) as RoleType;

    if (!savedToken || !savedRole || savedRole === USER_ROLES.STUDENT) {
      return false;
    }

    try {
      // Use lightweight validation endpoint instead of fetching submissions
      // This saves 70-90% of validation time (no database query, no data transfer)
      return await authRepository.validateToken(savedToken);
    } catch (error) {
      console.warn(ERROR_MESSAGES.UNKNOWN, error);
      return false;
    }
  };

  // Load and validate auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const savedRole = localStorage.getItem(
        STORAGE_KEYS.AUTH_ROLE
      ) as RoleType;
      const savedStudentData = localStorage.getItem(STORAGE_KEYS.STUDENT_DATA);

      if (savedToken && savedRole) {
        if (savedRole === USER_ROLES.STUDENT) {
          // Student tokens don't need validation
          setToken(savedToken);
          setRole(savedRole);

          // Load student data if available
          if (savedStudentData) {
            try {
              const studentData = JSON.parse(savedStudentData);
              setStudentData(studentData);
            } catch (error) {
              console.warn(ERROR_MESSAGES.FETCH_EXISTING_SUBMISSION_FAILED);
              localStorage.removeItem("studentData");
            }
          }
        } else {
          // Validate manager tokens
          const isValid = await validateToken();
          if (isValid) {
            setToken(savedToken);
            setRole(savedRole);
          } else {
            // Token is invalid, clear it
            localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
            localStorage.removeItem(STORAGE_KEYS.AUTH_ROLE);
            localStorage.removeItem(STORAGE_KEYS.STUDENT_DATA);
          }
        }
      }

      setIsLoading(false);
    };

    initAuth();
  }, []);

  const loginManager = async (password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // Use repository to handle authentication
      const data = await authRepository.loginManager(password);
      setToken(data.token);
      setRole("manager");

      // Save to localStorage
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, data.token);
      localStorage.setItem(STORAGE_KEYS.AUTH_ROLE, "manager");

      // Preload data in background for faster subsequent access
      setTimeout(() => {
        dataPreloader.preloadManagerData(data.token);
      }, 100);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : ERROR_MESSAGES.UNKNOWN;
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const selectStudent = () => {
    setRole(USER_ROLES.STUDENT);
    setToken("student-token"); // Set a placeholder token for students
    setError(null);
    setStudentData(null); // Clear any previous student data
    // Don't save to localStorage yet - wait for proper authentication
  };

  const authenticateStudent = (data: StudentData) => {
    setStudentData(data);
    setRole(USER_ROLES.STUDENT);
    setToken("student-token");
    setError(null);

    // Save to localStorage
    localStorage.setItem(STORAGE_KEYS.AUTH_ROLE, USER_ROLES.STUDENT);
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, "student-token");
    localStorage.setItem(STORAGE_KEYS.STUDENT_DATA, JSON.stringify(data));
  };

  const logout = () => {
    setToken(null);
    setRole(null);
    setError(null);
    setStudentData(null);
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.AUTH_ROLE);
    localStorage.removeItem(STORAGE_KEYS.STUDENT_DATA);
  };

  const clearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    token,
    role,
    isAuthenticated: !!token && !!role,
    isLoading,
    error,
    studentData,
    loginManager,
    selectStudent,
    authenticateStudent,
    logout,
    clearError,
    validateToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error(ERROR_MESSAGES.UNKNOWN);
  }
  return context;
};
