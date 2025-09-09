import React, { useEffect, useMemo, useState } from 'react';
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
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [levelFilter, setLevelFilter] = useState<string>('');
  const [search, setSearch] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);

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

  const loadAllUsers = async () => {
    try {
      const list = await clbService.listAllUsers();
      setAllUsers(list);
    } catch (e) {
      console.error('Error loading users:', e);
    }
  };

  useEffect(() => {
    loadClubs();
    loadAllUsers();
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

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    // Helper para normalizar niveles a etiquetas A1–C2
    const normalizeToCEFR = (u: any): string => {
      const raw = String(u.level || u.english_level || '').trim().toLowerCase();
      const bloque = String(u.bloque_asignado || '').trim().toUpperCase();

      // 1) Si bloque_asignado empieza por A1..C2, úsalo
      const m = bloque.match(/^(A1|A2|B1|B2|C1|C2)/);
      if (m) return m[1];

      // 2) Si level ya es A1..C2
      const rawUp = (u.level || '').toUpperCase();
      if (['A1','A2','B1','B2','C1','C2'].includes(rawUp)) return rawUp;

      // 3) Mapear comunes en english_level
      // Nota: esto es una aproximación
      if (raw.includes('beginner') || raw.includes('basic')) return 'A1';
      if (raw.includes('elementary')) return 'A2';
      if (raw.includes('pre-intermediate')) return 'B1';
      if (raw.includes('intermediate')) return 'B1';
      if (raw.includes('upper') || raw.includes('upper-intermediate')) return 'B2';
      if (raw.includes('advanced')) return 'C1';
      if (raw.includes('proficient') || raw.includes('c2')) return 'C2';

      return '';
    };

    return allUsers
      .filter(u => (u.role ? String(u.role).toLowerCase() === 'student' : true))
      .filter(u => {
        if (!levelFilter) return true;
        return normalizeToCEFR(u) === levelFilter.toUpperCase();
      })
      .filter(u => {
        if (!q) return true;
        const name = `${u.first_name || ''} ${u.last_name || ''}`.toLowerCase();
        return name.includes(q) || String(u.email || '').toLowerCase().includes(q);
      })
      .slice(0, 100); // limitar para rendimiento
  }, [allUsers, levelFilter, search]);

  const toggleSelectUser = (id: number) => {
    setSelectedUserIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const addSelectedUsers = async () => {
    if (!selectedClub) return;
    if (selectedUserIds.length === 0) {
      alert('Selecciona al menos un estudiante.');
      return;
    }
    try {
      for (const id of selectedUserIds) {
        await clbService.addStudentById(selectedClub.id, id);
      }
      setSelectedUserIds([]);
      await loadStudents(selectedClub.id);
    } catch (e) {
      console.error('Error adding selected students:', e);
      alert('No se pudieron agregar algunos estudiantes.');
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
        <div className="galeria-content clubs-grid">
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
                <div className="user-picker">
                  <div className="user-picker-filters">
                    <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)}>
                      <option value="">Todos los niveles</option>
                      <option value="A1">A1</option>
                      <option value="A2">A2</option>
                      <option value="B1">B1</option>
                      <option value="B2">B2</option>
                      <option value="C1">C1</option>
                      <option value="C2">C2</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Buscar por nombre o email"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <div className="user-picker-list">
                    {filteredUsers.map(u => (
                      <label key={u.id} className={`user-option ${selectedUserIds.includes(u.id) ? 'selected' : ''}`}>
                        <input
                          type="checkbox"
                          checked={selectedUserIds.includes(u.id)}
                          onChange={() => toggleSelectUser(Number(u.id))}
                        />
                        <span className="user-name">{`${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username || 'Sin nombre'}</span>
                        <span className="user-meta">{u.email} · Nivel {(() => {
                          const rawUp = String(u.level || '').toUpperCase();
                          const bloque = String(u.bloque_asignado || '').toUpperCase();
                          const m = bloque.match(/^(A1|A2|B1|B2|C1|C2)/);
                          if (m) return m[1];
                          if (['A1','A2','B1','B2','C1','C2'].includes(rawUp)) return rawUp;
                          const raw = String(u.english_level || '').toLowerCase();
                          if (raw.includes('beginner') || raw.includes('basic')) return 'A1';
                          if (raw.includes('elementary')) return 'A2';
                          if (raw.includes('pre-intermediate') || raw.includes('intermediate')) return 'B1';
                          if (raw.includes('upper')) return 'B2';
                          if (raw.includes('advanced')) return 'C1';
                          if (raw.includes('proficient') || raw.includes('c2')) return 'C2';
                          return '—';
                        })()}</span>
                      </label>
                    ))}
                    {filteredUsers.length === 0 && (
                      <div className="empty-list">No hay estudiantes para mostrar</div>
                    )}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                    <button className="btn-primary" onClick={addSelectedUsers}>Agregar seleccionados</button>
                  </div>
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
