import { createContext, useContext, useState, ReactNode } from 'react';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';
import './Toast.css';

type Toast = { id: number; message: string; type?: 'info' | 'success' | 'error' };

const ToastContext = createContext<{ show: (msg: string, type?: Toast['type']) => void } | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = (message: string, type: Toast['type'] = 'info') => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => {
      setToasts(t => t.filter(x => x.id !== id));
    }, 3000);
  };

  const getIcon = (type: Toast['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} />;
      case 'error':
        return <AlertCircle size={20} />;
      default:
        return <Info size={20} />;
    }
  };

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="toast-root" aria-live="polite" aria-atomic="false">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type || 'info'}`} role="status" aria-live="polite">
            <div className="toast-icon">{getIcon(t.type)}</div>
            <span className="toast-message">{t.message}</span>
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
