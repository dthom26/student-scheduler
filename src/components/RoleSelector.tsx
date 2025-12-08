import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import StudentAuth from './StudentAuth';
import './RoleSelector.css';

const RoleSelector: React.FC = () => {
  const { loginManager, authenticateStudent, isLoading, error, clearError } = useAuth();
  const [password, setPassword] = useState('');
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [showStudentAuth, setShowStudentAuth] = useState(false);

  const handleManagerClick = () => {
    setShowPasswordInput(true);
    setShowStudentAuth(false);
    clearError();
  };

  const handleStudentClick = () => {
    setShowStudentAuth(true);
    setShowPasswordInput(false);
    clearError();
  };

  const handleStudentAuthenticated = (studentData: any) => {
    authenticateStudent(studentData);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await loginManager(password);
      setPassword('');
      setShowPasswordInput(false);
    } catch {
      // Error is handled and displayed
    }
  };

  return (
    <div className="role-selector-container">
      {showStudentAuth ? (
        <StudentAuth onStudentAuthenticated={handleStudentAuthenticated} />
      ) : (
        <div className="role-selector-card">
          <p>Select your role to continue</p>

          <div className="button-group">
            <button
              className="role-button student-button"
              onClick={handleStudentClick}
              disabled={isLoading}
            >
              Student
            </button>
            <button
              className="role-button manager-button"
              onClick={handleManagerClick}
              disabled={isLoading}
            >
              Manager
            </button>
          </div>

          {showPasswordInput && (
            <form onSubmit={handlePasswordSubmit} className="password-form">
              <label htmlFor="password">Manager Password</label>
              <input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                autoFocus
              />
              <div className="password-buttons">
                <button
                  type="submit"
                  className="submit-button"
                  disabled={isLoading || !password}
                >
                  {isLoading ? 'Logging in...' : 'Login'}
                </button>
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => {
                    setShowPasswordInput(false);
                    setPassword('');
                    clearError();
                  }}
                  disabled={isLoading}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {error && <div className="error-message">{error}</div>}
        </div>
      )}
    </div>
  );
};

export default RoleSelector;
