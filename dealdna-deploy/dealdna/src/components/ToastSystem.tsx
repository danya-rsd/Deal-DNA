/**
 * DealDNA — Phase 4
 * src/components/ToastSystem.tsx
 * Lightweight toast notification system — no external dependencies.
 */
"use client";
import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";

type ToastType = "success" | "warning" | "error" | "info";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextValue {
  success: (title: string, msg?: string) => void;
  warning: (title: string, msg?: string) => void;
  error: (title: string, msg?: string) => void;
  info: (title: string, msg?: string) => void;
}

const ToastContext = createContext<ToastContextValue>({
  success: () => {},
  warning: () => {},
  error: () => {},
  info: () => {},
});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const add = useCallback(
    (type: ToastType, title: string, message?: string) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((t) => [...t, { id, type, title, message }]);
      setTimeout(
        () => setToasts((t) => t.filter((x) => x.id !== id)),
        4000
      );
    },
    []
  );

  const colors: Record<ToastType, string> = {
    success: "#0d9e75",
    warning: "#d97706",
    error: "#dc2626",
    info: "#0ea5e9",
  };

  const icons: Record<ToastType, string> = {
    success: "✓",
    warning: "⚠",
    error: "✕",
    info: "ℹ",
  };

  return (
    <ToastContext.Provider
      value={{
        success: (t, m) => add("success", t, m),
        warning: (t, m) => add("warning", t, m),
        error: (t, m) => add("error", t, m),
        info: (t, m) => add("info", t, m),
      }}
    >
      {children}
      <div
        style={{
          position: "fixed",
          bottom: "1.5rem",
          right: "1.5rem",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          pointerEvents: "none",
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              background: "#0f1117",
              border: `1px solid ${colors[t.type]}40`,
              borderLeft: `3px solid ${colors[t.type]}`,
              borderRadius: "8px",
              padding: "0.75rem 1rem",
              minWidth: "280px",
              maxWidth: "360px",
              fontFamily: "'JetBrains Mono', monospace",
              animation: "toastSlideIn 0.2s ease",
              pointerEvents: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <span
                style={{
                  color: colors[t.type],
                  fontWeight: 600,
                  fontSize: "0.85rem",
                }}
              >
                {icons[t.type]}
              </span>
              <span
                style={{
                  color: "#e2e8f0",
                  fontWeight: 500,
                  fontSize: "0.85rem",
                }}
              >
                {t.title}
              </span>
            </div>
            {t.message && (
              <p
                style={{
                  color: "#94a3b8",
                  fontSize: "0.78rem",
                  margin: "0.25rem 0 0 1.35rem",
                }}
              >
                {t.message}
              </p>
            )}
          </div>
        ))}
      </div>
      <style>{`
        @keyframes toastSlideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  return useContext(ToastContext);
}
