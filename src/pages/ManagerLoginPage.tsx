import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import styles from "./ManagerLoginPage.module.css";

export default function ManagerLoginPage() {
  const { isAuthenticated, loginManager, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
    return () => {
      clearError();
    };
  }, [isAuthenticated, navigate, clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await loginManager(password);
      setPassword("");
      navigate("/", { replace: true });
    } catch (err) {
      // error is handled by AuthContext
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.title}>Manager Login</h2>
        {error && <div className={styles.error}>{error}</div>}

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="manager-password">
              Password
            </label>
            <input
              id="manager-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter manager password"
              className={styles.input}
              disabled={isLoading}
              autoFocus
            />
          </div>

          <div className={styles.actions}>
            <button type="submit" className={styles.button} disabled={isLoading || !password}>
              {isLoading ? "Logging in..." : "Login"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
