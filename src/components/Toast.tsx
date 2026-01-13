import { createContext, useContext, useState, ReactNode } from 'react';
import './PasswordForm.css';

type Toast = { id: number; message: string; type?: 'info' | 'success' | 'error' };

const ToastContext = createContext<{ show: (msg: string, type?: Toast['type']) => void } | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = (message: string, type: Toast['type'] = 'info') => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => {
      setToasts(t => t.filter(x => x.id !== id));
    }, 2500);
  };

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="toast-root" aria-live="polite" aria-atomic="false">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type || 'info'}`} role="status" aria-live="polite">
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx.show;
};
