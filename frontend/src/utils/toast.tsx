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

const toastListeners = new Set<(item: ToastItem) => void>();
const toastQueue: ToastItem[] = [];
let rootInitialized = false;

function ToastHost() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const onToast = (item: ToastItem) => {
      setToasts((prev) => [...prev, item]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== item.id));
      }, 4000);
    };

    toastListeners.add(onToast);

    // Procesar cualquier toast encolado antes del montaje
    while (toastQueue.length > 0) {
      const queued = toastQueue.shift();
      if (queued) onToast(queued);
    }

    return () => {
      toastListeners.delete(onToast);
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
  if (rootInitialized || typeof document === 'undefined') return;
  rootInitialized = true;
  let el = document.getElementById('app-toast-root');
  if (!el) {
    el = document.createElement('div');
    el.id = 'app-toast-root';
    document.body.appendChild(el);
  }
  createRoot(el).render(<ToastHost />);
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureMounted);
  } else {
    ensureMounted();
  }
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

  const item: ToastItem = {
    id: Date.now() + Math.random(),
    msg: message,
    type,
    title,
  };

  if (toastListeners.size === 0) {
    toastQueue.push(item);
  } else {
    toastListeners.forEach((fn) => fn(item));
  }

  notifyDesktop(title || (type === 'error' ? 'La Lengua - Atención' : 'La Lengua'), message);
}
