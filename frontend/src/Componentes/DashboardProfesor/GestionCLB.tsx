import React, { useEffect, useState } from 'react';
import './Dashboard_Profesor.css';
import './GestionCLB.css';
import { clbService, type Club, type ClubMaterial } from '../../services/clbService';

interface GestionCLBProps {
  profesorId?: number;
}

export default function GestionCLB({ profesorId = 1 }: GestionCLBProps) {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedClub, setSelectedClub] = useState<number | null>(null);
  const [materials, setMaterials] = useState<ClubMaterial[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<ClubMaterial | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Form state
  const [form, setForm] = useState({
    week: '',
    title: '',
    description: '',
    resource_type: 'file' as 'file',
    url: '',
    file: null as File | null,
  });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const c = await clbService.getClubs();
        setClubs(c);
        if (c.length > 0) {
          setSelectedClub(c[0].id);
        }
      } catch (e) {
        console.error('Error loading clubs:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const loadMaterials = async () => {
      if (!selectedClub) return;
      try {
        setLoading(true);
        const m = await clbService.getClubMaterials(selectedClub);
        setMaterials(m);
      } catch (e) {
        console.error('Error loading materials:', e);
      } finally {
        setLoading(false);
      }
    };
    loadMaterials();
  }, [selectedClub]);

  const resetForm = () => {
    setForm({ week: '', title: '', description: '', resource_type: 'file', url: '', file: null });
    setShowForm(false);
    setEditingMaterial(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClub) {
      alert('Selecciona un club');
      return;
    }
    if (!form.week || !form.title) {
      alert('Semana y Título son obligatorios');
      return;
    }
    if (!editingMaterial && !form.file) {
      alert('Selecciona un archivo para continuar');
      return;
    }

    try {
      setSaving(true);
      if (editingMaterial) {
        const updated = await clbService.updateClubMaterial(editingMaterial.id, {
          week: form.week,
          title: form.title,
          description: form.description || undefined,
        });
        setMaterials(prev => prev.map(m => (m.id === updated.id ? updated : m)));
      } else {
        const payload = {
          week: form.week,
          title: form.title,
          description: form.description || undefined,
          resource_type: 'file' as const,
          file: form.file ?? undefined,
        };
        const created = await clbService.createClubMaterial(selectedClub, payload);
        setMaterials(prev => [created, ...prev]);
      }
      resetForm();
    } catch (err: any) {
      console.error('Error creating material:', err);
      const message = err?.message || 'Error al guardar el material. Revisa tu conexión o permisos.';
      alert(message);
    } finally {
      setSaving(false);
    }
  };

  const openEditMaterial = (item: ClubMaterial) => {
    setEditingMaterial(item);
    setForm({
      week: item.week,
      title: item.title,
      description: item.description || '',
      resource_type: 'file',
      url: '',
      file: null,
    });
    setShowForm(true);
  };

  const handleDeleteMaterial = async (item: ClubMaterial) => {
    if (!confirm(`¿Eliminar el material "${item.title}"?`)) return;
    try {
      setDeletingId(item.id);
      await clbService.deleteClubMaterial(item.id);
      setMaterials(prev => prev.filter(m => m.id !== item.id));
    } catch (err) {
      console.error('Error deleting material:', err);
      alert('No se pudo eliminar el material.');
    } finally {
      setDeletingId(null);
    }
  };

  const selectedClubName = clubs.find(c => c.id === selectedClub)?.name || '';

  return (
    <div className="clb-container">
      <div className="clb-header">
        <div className="clb-header-content">
          <div className="clb-header-icon">📚</div>
          <div className="clb-header-text">
            <h2>Gestión de Material de Clubs</h2>
            <p>Carga semanalmente el material para tu club y estudiantes asignados. Mantén todo organizado por semanas.</p>
          </div>
        </div>
      </div>

      <div className="clb-controls">
        <div className="clb-selector">
          <span className="clb-selector-label">
            <span>🏷️</span> Club
          </span>
          <select
            value={selectedClub ?? ''}
            onChange={(e) => setSelectedClub(Number(e.target.value))}
            disabled={clubs.length === 0}
          >
            {clubs.length === 0 ? (
              <option value="" disabled>No tienes clubs aún</option>
            ) : (
              clubs.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))
            )}
          </select>
          {selectedClub !== null && (
            <span className="clb-count">
              <span className="clb-count-number">{materials.length}</span>
              {materials.length === 1 ? 'material' : 'materiales'}
            </span>
          )}
        </div>

        <button
          className="clb-btn-add"
          onClick={() => setShowForm(true)}
          disabled={clubs.length === 0}
        >
          <span className="clb-btn-add-icon">+</span>
          Agregar material
        </button>
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content clb-modal-content">
            <div className="modal-header clb-modal-header">
              <h3>{editingMaterial ? 'Editar material' : 'Nuevo material'}</h3>
              <button className="close-btn" onClick={resetForm}>✕</button>
            </div>
            {clubs.length === 0 ? (
              <div className="clb-form">
                <p style={{ marginBottom: 20 }}>Aún no tienes clubs. Crea uno primero desde "Mis Clubs" y vuelve a intentar.</p>
                <div className="clb-form-actions">
                  <button type="button" className="clb-btn-save" onClick={resetForm}>Entendido</button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSave} className="clb-form">
                <div className="clb-form-grid">
                  <div className="clb-form-group clb-full">
                    <label>Club</label>
                    <select
                      value={selectedClub ?? ''}
                      onChange={(e) => setSelectedClub(Number(e.target.value))}
                      required
                    >
                      <option value="" disabled>Selecciona un club…</option>
                      {clubs.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="clb-form-group">
                    <label>Semana (ej: 2025-W37)</label>
                    <input type="text" value={form.week} onChange={(e) => setForm({ ...form, week: e.target.value })} placeholder="YYYY-Www" required />
                  </div>

                  <div className="clb-form-group">
                    <label>Título</label>
                    <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Tema de la semana" required />
                  </div>

                  <div className="clb-form-group clb-full">
                    <label>Descripción</label>
                    <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Breve descripción del material" />
                  </div>

                  <div className="clb-form-group clb-full">
                    <label>Archivo</label>
                    <div className="clb-file-row">
                      <label className="clb-file-upload">
                        <input
                          type="file"
                          onChange={(e) => setForm({ ...form, file: e.target.files?.[0] ?? null })}
                        />
                        <span className="clb-file-btn">Seleccionar archivo</span>
                      </label>
                      <span className="clb-file-name">
                        {form.file
                          ? form.file.name
                          : editingMaterial
                            ? 'Reemplazar archivo'
                            : 'Sin archivos seleccionados'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="clb-form-actions">
                  <button type="button" className="clb-btn-cancel" onClick={resetForm}>Cancelar</button>
                  <button type="submit" className="clb-btn-save" disabled={saving}>
                    {saving ? 'Guardando…' : editingMaterial ? 'Actualizar material' : 'Guardar material'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <div>
        {loading ? (
          <div className="clb-state">
            <div className="clb-state-icon">⏳</div>
            <h3>Cargando materiales…</h3>
          </div>
        ) : !selectedClub ? (
          <div className="clb-state">
            <div className="clb-state-icon">🏷️</div>
            <h3>Selecciona un club</h3>
            <p>Elige uno de tus clubs desde el selector superior para ver y gestionar su material.</p>
          </div>
        ) : materials.length === 0 ? (
          <div className="clb-state">
            <div className="clb-state-icon">📂</div>
            <h3>No hay materiales cargados</h3>
            <p>Empieza a cargar el material semanal del club <strong>{selectedClubName}</strong>. Tus estudiantes lo verán en su panel.</p>
            <button className="clb-btn-add" onClick={() => setShowForm(true)}>
              <span className="clb-btn-add-icon">+</span>
              Agregar primer material
            </button>
          </div>
        ) : (
          <div className="clb-grid">
            {materials.map(item => (
              <div key={item.id} className="clb-card">
                <div className="clb-card-preview">
                  <div className="clb-card-file">
                    <div className="clb-card-file-icon">📄</div>
                    <span>Archivo adjunto</span>
                  </div>
                  <div className="clb-card-badge">Semana {item.week}</div>
                </div>
                <div className="clb-card-body">
                  <h3 className="clb-card-title">{item.title}</h3>
                  <p className="clb-card-desc">{item.description}</p>
                  <div className="clb-card-meta">
                    <span>📅</span>
                    <span>{new Date(item.created_at).toLocaleDateString('es-ES')}</span>
                  </div>
                  <div className={`clb-card-actions ${item.url ? 'clb-actions-3' : ''}`}>
                    {item.url && (
                      <a className="clb-btn-open" href={item.url} target="_blank" rel="noreferrer">
                        📥 Descargar
                      </a>
                    )}
                    <button
                      type="button"
                      className="clb-btn-edit"
                      onClick={() => openEditMaterial(item)}
                    >
                      ✏️ Editar
                    </button>
                    <button
                      type="button"
                      className="clb-btn-delete"
                      disabled={deletingId === item.id}
                      onClick={() => handleDeleteMaterial(item)}
                    >
                      {deletingId === item.id ? 'Eliminando…' : '🗑️ Eliminar'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
