"use client";
import { createContext, useContext, useState, useCallback, ReactNode } from "react";

type ToastType = "ok" | "err" | "info";
interface Toast {
  id: number;
  msg: string;
  type: ToastType;
}

const ToastContext = createContext<(msg: string, type?: ToastType) => void>(() => {});
export const useToast = () => useContext(ToastContext);

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((msg: string, type: ToastType = "ok") => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3200);
  }, []);

  const colorMap: Record<ToastType, string> = {
    ok: "bg-navy text-white",
    err: "bg-red text-white",
    info: "bg-accent text-white",
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-6 right-6 z-[1000] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`px-4 py-2.5 rounded text-[13px] font-medium shadow-lg animate-slideup pointer-events-auto ${colorMap[t.type]}`}
          >
            {t.msg}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
