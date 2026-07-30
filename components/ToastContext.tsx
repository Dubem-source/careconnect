"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

type Toast = {
  id: string;
  message: string;
  type: ToastType;
};

type ToastContextType = {
  showToast: (message: string, type: ToastType) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto-remove toast after 4 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Toast Render Overlay container */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-3 max-w-md w-[calc(100%-2rem)] px-4 pointer-events-none">
        {toasts.map((toast) => {
          let bg = "bg-white border-gray-200 text-gray-800 shadow-lg";
          let Icon = Info;
          let iconColor = "text-[#0B3D3F]";

          if (toast.type === "success") {
            bg = "bg-white border-[#6FCF97]/30 text-gray-800 shadow-xl";
            Icon = CheckCircle2;
            iconColor = "text-[#1D8A5C]";
          } else if (toast.type === "error") {
            bg = "bg-white border-[#E1614A]/20 text-gray-800 shadow-xl";
            Icon = AlertCircle;
            iconColor = "text-[#E1614A]";
          }

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto border rounded-xl p-4 flex items-center justify-between gap-3 ${bg} transition-all duration-300 animate-in slide-in-from-top-5 fade-in-0`}
              role="alert"
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-5 h-5 shrink-0 ${iconColor}`} />
                <span className="text-xs font-bold leading-normal">{toast.message}</span>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-gray-400 hover:text-gray-600 transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
