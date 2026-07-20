'use client';

import { useState, useEffect, useCallback } from 'react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

let toastListeners: ((toast: Toast) => void)[] = [];
let toastIdCounter = 0;

export function showToast(message: string, type: Toast['type'] = 'info') {
  const id = (++toastIdCounter).toString();
  const toast: Toast = { id, message, type };
  toastListeners.forEach((fn) => fn(toast));
  setTimeout(() => {
    toastListeners.forEach((fn) => fn({ ...toast, id: `remove:${id}` }));
  }, 3000);
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const handler = useCallback((toast: Toast) => {
    if (toast.id.startsWith('remove:')) {
      setToasts((prev) => prev.filter((t) => t.id !== toast.id.replace('remove:', '')));
    } else {
      setToasts((prev) => [...prev.slice(-4), toast]);
    }
  }, []);

  useEffect(() => {
    toastListeners.push(handler);
    return () => { toastListeners = toastListeners.filter((fn) => fn !== handler); };
  }, [handler]);

  const typeStyles: Record<string, { bg: string; border: string; icon: React.ReactNode }> = {
    success: {
      bg: '#E8F2EB',
      border: '#4A7C59',
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4A7C59" strokeWidth="2"><path d="M20 6 9 17l-5-5" /></svg>,
    },
    error: {
      bg: '#F5E8E8',
      border: '#A64D4D',
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A64D4D" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" /></svg>,
    },
    info: {
      bg: '#E8F0F5',
      border: '#6B8FA3',
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B8FA3" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>,
    },
  };

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((toast) => {
        const style = typeStyles[toast.type];
        return (
          <div
            key={toast.id}
            className="flex items-center gap-2 px-3 py-2 rounded-md border shadow-sm animate-slide-up"
            style={{
              backgroundColor: style.bg,
              borderColor: style.border + '40',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            }}
          >
            {style.icon}
            <span className="text-sm" style={{ color: '#1A1A1A' }}>{toast.message}</span>
          </div>
        );
      })}
    </div>
  );
}
