import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface AuthContextType {
  token: string | null;
  role: 'student' | 'manager' | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  loginManager: (password: string) => Promise<void>;
  selectStudent: () => void;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<'student' | 'manager' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load auth state from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('authToken');
    const savedRole = localStorage.getItem('authRole') as 'student' | 'manager' | null;
    if (savedToken && savedRole) {
      setToken(savedToken);
      setRole(savedRole);
    }
  }, []);

  const loginManager = async (password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:3001/api/v1/auth/manager', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Login failed');
      }

      const data = await response.json();
      setToken(data.token);
      setRole('manager');

      // Save to localStorage
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('authRole', 'manager');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const selectStudent = () => {
    setRole('student');
    setToken('student-token');  // Set a placeholder token for students
    setError(null);
    // Save to localStorage
    localStorage.setItem('authRole', 'student');
    localStorage.setItem('authToken', 'student-token');
  };

  const logout = () => {
    setToken(null);
    setRole(null);
    setError(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('authRole');
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
    loginManager,
    selectStudent,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
