import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { dataPreloader } from "../services/preloader";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://student-schedular-backend.onrender.com";

// Debug: Force build refresh - Nov 24 2025
console.log("Using API URL:", API_BASE_URL);

interface StudentData {
  studentId: string;
  studentName: string;
  location: string;
  isReturning: boolean;
  existingSubmission?: any;
}

interface AuthContextType {
  token: string | null;
  role: "student" | "manager" | null;
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
  const [role, setRole] = useState<"student" | "manager" | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start with loading true
  const [error, setError] = useState<string | null>(null);
  const [studentData, setStudentData] = useState<StudentData | null>(null);

  // Validate if the token is still valid
  const validateToken = async (): Promise<boolean> => {
    const savedToken = localStorage.getItem("authToken");
    const savedRole = localStorage.getItem("authRole") as
      | "student"
      | "manager"
      | null;

    if (!savedToken || !savedRole || savedRole === "student") {
      return false;
    }

    try {
      // Use lightweight validation endpoint instead of fetching submissions
      // This saves 70-90% of validation time (no database query, no data transfer)
      const response = await fetch(
        `${API_BASE_URL}/api/v1/auth/validate`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${savedToken}`,
          },
        }
      );

      return response.ok;
    } catch (error) {
      console.warn("Token validation failed:", error);
      return false;
    }
  };

  // Load and validate auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem("authToken");
      const savedRole = localStorage.getItem("authRole") as
        | "student"
        | "manager"
        | null;
      const savedStudentData = localStorage.getItem("studentData");

      if (savedToken && savedRole) {
        if (savedRole === "student") {
          // Student tokens don't need validation
          setToken(savedToken);
          setRole(savedRole);

          // Load student data if available
          if (savedStudentData) {
            try {
              const studentData = JSON.parse(savedStudentData);
              setStudentData(studentData);
            } catch (error) {
              console.warn("Failed to parse saved student data");
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
            localStorage.removeItem("authToken");
            localStorage.removeItem("authRole");
            localStorage.removeItem("studentData");
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
      // Updated to use render backend - v2
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/manager`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Login failed");
      }

      const data = await response.json();
      setToken(data.token);
      setRole("manager");

      // Save to localStorage
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("authRole", "manager");

      // Preload data in background for faster subsequent access
      setTimeout(() => {
        dataPreloader.preloadManagerData(data.token);
      }, 100);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "An error occurred";
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const selectStudent = () => {
    setRole("student");
    setToken("student-token"); // Set a placeholder token for students
    setError(null);
    // Don't save to localStorage yet - wait for proper authentication
  };

  const authenticateStudent = (data: StudentData) => {
    setStudentData(data);
    setRole("student");
    setToken("student-token");
    setError(null);

    // Save to localStorage
    localStorage.setItem("authRole", "student");
    localStorage.setItem("authToken", "student-token");
    localStorage.setItem("studentData", JSON.stringify(data));
  };

  const logout = () => {
    setToken(null);
    setRole(null);
    setError(null);
    setStudentData(null);
    localStorage.removeItem("authToken");
    localStorage.removeItem("authRole");
    localStorage.removeItem("studentData");
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
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
