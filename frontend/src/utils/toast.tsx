import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './toast.css';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  msg: string;
  type: ToastType;
  title?: string;
}

let push: (msg: string, type: ToastType, title?: string) => void = () => {};
let mounted = false;

function ToastHost() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    push = (msg, type, title) => {
      const id = Date.now() + Math.random();
      setToasts((t) => [...t, { id, msg, type, title }]);
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
    };
  }, []);

  return (
    <div className="app-toast-stack">
      {toasts.map((t) => (
        <div key={t.id} className={`app-toast app-toast-${t.type}`}>
          <div className="app-toast-icon-wrap">
            <img src="/loguito.png" alt="La Lengua" className="app-toast-logo" />
          </div>
          <div className="app-toast-body">
            <div className="app-toast-title">
              {t.title || (t.type === 'error' ? 'Atención' : t.type === 'info' ? 'Información' : 'La Lengua')}
            </div>
            <div className="app-toast-message">{t.msg}</div>
          </div>
          <button
            type="button"
            className="app-toast-close"
            onClick={() => setToasts((list) => list.filter((x) => x.id !== t.id))}
            aria-label="Cerrar notificación"
          >
            ✕
          </button>
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

export function notifyDesktop(title: string, body: string) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;

  const show = () => {
    try {
      new Notification(title, {
        body,
        icon: '/loguito.png',
        badge: '/loguito.png',
      });
    } catch (e) {
      console.warn('Error al mostrar notificación de escritorio:', e);
    }
  };

  if (Notification.permission === 'granted') {
    show();
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        show();
      }
    });
  }
}

export function toast(message: string, type: ToastType = 'success', title?: string) {
  if (typeof document === 'undefined') return;
  ensureMounted();
  push(message, type, title);
  notifyDesktop(title || (type === 'error' ? 'La Lengua - Atención' : 'La Lengua'), message);
}
