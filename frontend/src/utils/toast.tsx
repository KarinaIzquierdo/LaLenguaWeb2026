import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './toast.css';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  msg: string;
  type: ToastType;
}

let push: (msg: string, type: ToastType) => void = () => {};
let mounted = false;

function ToastHost() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    push = (msg, type) => {
      const id = Date.now() + Math.random();
      setToasts((t) => [...t, { id, msg, type }]);
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
    };
  }, []);

  return (
    <div className="app-toast-stack">
      {toasts.map((t) => (
        <div key={t.id} className={`app-toast app-toast-${t.type}`}>
          {t.msg}
        </div>
      ))}
    </div>
  );
}

function ensureMounted() {
  if (mounted) return;
  mounted = true;
  const el = document.createElement('div');
  el.id = 'app-toast-root';
  document.body.appendChild(el);
  createRoot(el).render(<ToastHost />);
}

export function toast(message: string, type: ToastType = 'success') {
  if (typeof document === 'undefined') return;
  ensureMounted();
  push(message, type);
}
