import { createContext, useContext, useState, ReactNode } from 'react';
import { Globe } from 'lucide-react';
import './AlertDialog.css';

interface AlertOptions {
  title?: string;
  message: string;
}

interface AlertContextValue {
  showAlert: (options: AlertOptions) => Promise<void>;
}

const AlertContext = createContext<AlertContextValue | null>(null);

export function AlertProvider({ children }: { children: ReactNode }) {
  const [alertState, setAlertState] = useState<{
    isOpen: boolean;
    options: AlertOptions;
    resolve: () => void;
  } | null>(null);

  const showAlert = (options: AlertOptions): Promise<void> => {
    return new Promise((resolve) => {
      setAlertState({
        isOpen: true,
        options,
        resolve,
      });
    });
  };

  const handleClose = () => {
    if (alertState) {
      alertState.resolve();
      setAlertState(null);
    }
  };

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      {alertState?.isOpen && (
        <div className="alert-overlay" onClick={handleClose}>
          <div className="alert-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="alert-header">
              <Globe size={20} />
              <span className="alert-domain">pass.mocipher.com</span>
            </div>
            <div className="alert-body">
              {alertState.options.title && (
                <h3 className="alert-title">{alertState.options.title}</h3>
              )}
              <p className="alert-message">{alertState.options.message}</p>
            </div>
            <div className="alert-actions">
              <button onClick={handleClose} className="alert-btn-ok">
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </AlertContext.Provider>
  );
}

export const useAlert = () => {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error('useAlert must be used within AlertProvider');
  return ctx.showAlert;
};
