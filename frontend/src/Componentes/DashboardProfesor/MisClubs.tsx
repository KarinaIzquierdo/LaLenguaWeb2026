import React, { useEffect, useState } from 'react';
import './Dashboard_Profesor.css';
import { clbService, type Club } from '../../services/clbService';

interface MisClubsProps {}

export default function MisClubs(_props: MisClubsProps) {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [studentEmail, setStudentEmail] = useState('');

  const [form, setForm] = useState({ name: '', description: '' });

  const loadClubs = async () => {
    try {
      setLoading(true);
      const c = await clbService.getClubs();
      setClubs(c);
      if (!selectedClub && c.length > 0) {
        setSelectedClub(c[0]);
      }
    } catch (e) {
      console.error('Error loading clubs:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async (clubId: number) => {
    try {
      const list = await clbService.listStudents(clubId);
      setStudents(list);
    } catch (e) {
      console.error('Error loading students:', e);
    }
  };

  useEffect(() => {
    loadClubs();
  }, []);

  useEffect(() => {
    if (selectedClub) loadStudents(selectedClub.id);
  }, [selectedClub?.id]);

  const createClub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      alert('El nombre es obligatorio');
      return;
    }
    try {
      setCreating(true);
      const created = await clbService.createClub({ name: form.name.trim(), description: form.description.trim() });
      setShowCreate(false);
      setForm({ name: '', description: '' });
      setClubs(prev => [created, ...prev]);
      setSelectedClub(created);
    } catch (e) {
      console.error('Error creating club:', e);
      alert('No se pudo crear el club');
    } finally {
      setCreating(false);
    }
  };

  const addStudent = async () => {
    if (!selectedClub) return;
    if (!studentEmail.trim()) {
      alert('Ingresa el email del estudiante');
      return;
    }
    try {
      await clbService.addStudentByEmail(selectedClub.id, studentEmail.trim());
      setStudentEmail('');
      await loadStudents(selectedClub.id);
    } catch (e) {
      console.error('Error adding student:', e);
      alert('No se pudo agregar el estudiante. Verifica el email.');
    }
  };

  const removeStudent = async (userId: number) => {
    if (!selectedClub) return;
    if (!confirm('¿Remover este estudiante del club?')) return;
    try {
      await clbService.removeStudent(selectedClub.id, userId);
      await loadStudents(selectedClub.id);
    } catch (e) {
      console.error('Error removing student:', e);
      alert('No se pudo remover el estudiante.');
    }
  };

  return (
    <div className="dashboard-content">
      <div className="profesor-header">
        <div className="welcome-section">
          <h2>Mis Clubs</h2>
          <p>Crea clubs y gestiona los estudiantes asignados</p>
        </div>
        <div className="stats-cards">
          <button className="btn-primary" onClick={() => setShowCreate(true)}>➕ Crear club</button>
        </div>
      </div>

      {showCreate && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <h3>Crear club</h3>
              <button className="close-btn" onClick={() => setShowCreate(false)}>✕</button>
            </div>
            <form onSubmit={createClub} className="galeria-form">
              <div className="form-group">
                <label>Nombre</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Descripción</label>
                <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={creating}>{creating ? 'Creando…' : 'Crear'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading-state"><p>Cargando…</p></div>
      ) : clubs.length === 0 ? (
        <div className="empty-state">
          <h3>No tienes clubs aún</h3>
          <p>Usa el botón "Crear club" para comenzar</p>
        </div>
      ) : (
        <div className="galeria-content" style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24 }}>
          <aside style={{ background: 'white', borderRadius: 12, padding: 16 }}>
            <h3 style={{ marginTop: 0 }}>Clubs</h3>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {clubs.map(c => (
                <li key={c.id}>
                  <button
                    className={`nav-item ${selectedClub?.id === c.id ? 'active' : ''}`}
                    onClick={() => setSelectedClub(c)}
                    style={{ width: '100%', textAlign: 'left', padding: '8px 10px', borderRadius: 8, border: '1px solid #eee', marginBottom: 8 }}
                  >
                    <div style={{ fontWeight: 600 }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: '#666' }}>Prof: {c.profesor_name ?? 'Yo'}</div>
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          <section>
            {selectedClub && (
              <div className="users-table-container">
                <h3>Estudiantes del club: {selectedClub.name}</h3>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <input
                    type="email"
                    placeholder="email@estudiante.com"
                    value={studentEmail}
                    onChange={(e) => setStudentEmail(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button className="btn-primary" onClick={addStudent}>Agregar por email</button>
                </div>

                <div className="users-table-wrapper">
                  <table className="users-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Email</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((s) => (
                        <tr key={s.id}>
                          <td>{s.id}</td>
                          <td>{(s.first_name || '') + ' ' + (s.last_name || '')}</td>
                          <td>{s.email}</td>
                          <td>
                            <button className="action-button deactivate-button" onClick={() => removeStudent(Number(s.id))}>Remover</button>
                          </td>
                        </tr>
                      ))}
                      {students.length === 0 && (
                        <tr>
                          <td colSpan={4} style={{ textAlign: 'center', padding: '1.5rem' }}>Aún no hay estudiantes asignados</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
