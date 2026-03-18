import React, { createContext, useContext, useState, useCallback } from "react";

type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  show: (message: string, type?: ToastType, durationMs?: number) => void;
  success: (message: string, durationMs?: number) => void;
  error: (message: string, durationMs?: number) => void;
  info: (message: string, durationMs?: number) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const show = useCallback((message: string, type: ToastType = "info", durationMs = 4000) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const item: ToastItem = { id, message, type };
    setToasts((t) => [item, ...t]);
    if (durationMs > 0) {
      setTimeout(() => remove(id), durationMs);
    }
  }, [remove]);

  const success = useCallback((m: string, d?: number) => show(m, "success", d), [show]);
  const error = useCallback((m: string, d?: number) => show(m, "error", d), [show]);
  const info = useCallback((m: string, d?: number) => show(m, "info", d), [show]);

  const value = React.useMemo(
    () => ({ show, success, error, info }),
    [show, success, error, info]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div aria-live="polite" className="toast-container" style={{ position: "fixed", right: 12, bottom: 12, zIndex: 9999 }}>
        {toasts.map((t) => (
          <div key={t.id} style={{
            marginBottom: 8,
            padding: "10px 14px",
            borderRadius: 6,
            color: "white",
            minWidth: 220,
            boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
            background: t.type === "success" ? "#2e7d32" : t.type === "error" ? "#d32f2f" : "#1976d2"
          }}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}

export default ToastContext;
