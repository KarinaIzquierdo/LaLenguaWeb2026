import React, { useMemo, useState } from 'react';
import { authService } from '../../services/authService';

export default function NewPassword() {
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const token = params.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    if (!token) {
      setStatus({ type: 'error', message: 'Token inválido o ausente. Revisa tu enlace de correo.' });
      return;
    }
    if (!password || !confirm) {
      setStatus({ type: 'error', message: 'Completa ambos campos.' });
      return;
    }
    if (password.length < 8) {
      setStatus({ type: 'error', message: 'La contraseña debe tener al menos 8 caracteres.' });
      return;
    }
    if (password !== confirm) {
      setStatus({ type: 'error', message: 'Las contraseñas no coinciden.' });
      return;
    }

    try {
      setIsLoading(true);
      const res = await authService.resetPassword(token, password);
      if (res.success) {
        setStatus({ type: 'success', message: res.message || 'Contraseña actualizada. Ya puedes iniciar sesión.' });
      } else {
        setStatus({ type: 'error', message: res.message || 'No se pudo actualizar la contraseña.' });
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'Error de conexión. Intenta nuevamente.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: 16
    }}>
      <div style={{ width: '100%', maxWidth: 420, background: '#fff', borderRadius: 16, boxShadow: '0 10px 25px rgba(0,0,0,0.15)', padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0 }}>Nueva contraseña</h2>
          <div style={{ fontSize: 28 }}>🔒</div>
        </div>
        <p style={{ color: '#555', marginTop: 8 }}>
          Ingresa tu nueva contraseña para terminar el proceso.
        </p>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 12 }}>
            <label htmlFor="password" style={{ display: 'block', marginBottom: 6 }}>Nueva contraseña</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e7eb', outline: 'none' }}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label htmlFor="confirm" style={{ display: 'block', marginBottom: 6 }}>Confirmar contraseña</label>
            <input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repite la contraseña"
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e7eb', outline: 'none' }}
            />
          </div>
          {status && (
            <div style={{
              background: status.type === 'success' ? '#ecfdf5' : '#fef2f2',
              color: status.type === 'success' ? '#065f46' : '#991b1b',
              border: `1px solid ${status.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
              padding: 10, borderRadius: 8, marginBottom: 12
            }}>
              {status.message}
            </div>
          )}
          <button type="submit" disabled={isLoading} style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: 'none', color: '#fff', cursor: 'pointer', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            {isLoading ? 'Guardando…' : 'Guardar nueva contraseña'}
          </button>
        </form>
        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <a href="/" style={{ color: '#667eea', textDecoration: 'none' }}>Volver al inicio</a>
        </div>
      </div>
    </div>
  );
}
