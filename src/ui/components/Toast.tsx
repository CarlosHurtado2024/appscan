import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';

type ToastApi = { show: (message: string) => void };

const Context = createContext<ToastApi>({ show: () => {} });

export const useToast = () => useContext(Context);

const VISIBLE_MS = 6000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState('');
  const timer = useRef<number | undefined>(undefined);

  const show = useCallback((text: string) => {
    setMessage(text);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMessage(''), VISIBLE_MS);
  }, []);

  const api = useMemo(() => ({ show }), [show]);

  return (
    <Context.Provider value={api}>
      {children}
      <div className="toast-region" role="status" aria-live="polite">
        {message && <p className="toast">{message}</p>}
      </div>
    </Context.Provider>
  );
}
