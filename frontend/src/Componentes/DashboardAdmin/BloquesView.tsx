import React, { useState, useEffect } from 'react';
import './admin.css';
import { bloqueService, type BloqueData, type Bloque } from '../../services/bloqueService';

const niveles = bloqueService.getNivelesDisponibles();
const turnos = bloqueService.getTurnosDisponibles();

const DetalleModal = ({ visible, onClose, title, children }: any) => {
  if (!visible) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h3>{title}</h3>
        <div className="modal-body">{children}</div>
        <button className="close-btn" onClick={onClose}>Cerrar</button>
      </div>
    </div>
  );
};

const defaultNuevoBloque = {
  nivel: '',
  turno: '',
  profesores: '',
  clases: '',
  misiones: '',
  horarios: '',
};

export default function BloquesView() {
  const [modal, setModal] = useState<{visible: boolean, title: string, content: React.ReactNode}>({visible: false, title: '', content: null});
  const [bloques, setBloques] = useState<Bloque[]>([]);
  const [showCrear, setShowCrear] = useState(false);
  const [nuevoBloque, setNuevoBloque] = useState(defaultNuevoBloque);

  // Cargar bloques al montar el componente
  useEffect(() => {
    const bloquesGuardados = bloqueService.getBloques();
    setBloques(bloquesGuardados);
  }, []);

  const handleOpen = (bloque: string, tipo: string) => {
    let content = null;
    if (tipo === 'Bloque') {
      const b = bloques.find(b => b.nivel + ' ' + b.turno === bloque);
      if (b) {
        const clasesHorarios = b.clases.map((clase: string, i: number) => ({
          clase,
          horario: b.horarios[i] || 'Sin horario asignado'
        }));
        content = (
          <div>
            <h4>Profesores asignados</h4>
            <ul>{b.profesores.map((p: string, i: number) => <li key={i}>{p}</li>)}</ul>
            <h4>Clases y horarios</h4>
            <table className="tabla-clases-horarios">
              <thead>
                <tr><th>Clase</th><th>Horario</th></tr>
              </thead>
              <tbody>
                {clasesHorarios.map((ch: {clase: string, horario: string}, i: number) => (
                  <tr key={i}>
                    <td>{ch.clase}</td>
                    <td>{ch.horario}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <h4>Misiones</h4>
            <ul>{b.misiones.map((m: string, i: number) => <li key={i}>{m}</li>)}</ul>
          </div>
        );
      } else {
        content = <div>No hay datos para este bloque.</div>;
      }
    }
    setModal({visible: true, title: `Detalles de ${bloque}`, content});
  };

  const handleCrearBloque = (e: React.FormEvent) => {
    e.preventDefault();
    bloqueService.saveBloque(nuevoBloque as BloqueData);
    const bloquesActualizados = bloqueService.getBloques();
    setBloques(bloquesActualizados);
    setShowCrear(false);
    setNuevoBloque(defaultNuevoBloque);
  };

  return (
    <div className="bloques-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2>Bloques</h2>
        <button className="crear-bloque-btn" onClick={() => setShowCrear(true)}>+ Crear bloque</button>
      </div>
      {niveles.map(nivel => (
        <div key={nivel} style={{marginBottom: 40}}>
          <h3 className="nivel-titulo">{nivel}</h3>
          <div className="sticky-notes-grid">
            {turnos.map(turno => {
              const nombre = `${nivel} ${turno}`;
              const bloqueExiste = bloques.some(b => b.nivel === nivel && b.turno === turno);
              return (
                <div 
                  className={`sticky-note sticky-${turno.toLowerCase()} ${bloqueExiste ? 'bloque-creado' : ''}`} 
                  key={nombre} 
                  onClick={() => handleOpen(nombre, 'Bloque')}
                >
                  <div className="pin"></div>
                  <div className="sticky-title">{turno}</div>
                  <div className="sticky-desc">
                    {bloqueExiste ? 'Bloque configurado' : 'Haz clic para ver detalles'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
      <DetalleModal visible={modal.visible} title={modal.title} onClose={() => setModal({visible: false, title: '', content: null})}>
        {modal.content}
      </DetalleModal>
      {/* Modal crear bloque */}
      {showCrear && (
        <div className="modal-backdrop" onClick={() => setShowCrear(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Crear nuevo bloque</h3>
            <form onSubmit={handleCrearBloque} className="form-crear-bloque">
              <label>Nivel
                <select required value={nuevoBloque.nivel} onChange={e => setNuevoBloque({...nuevoBloque, nivel: e.target.value})}>
                  <option value="">Selecciona nivel</option>
                  {niveles.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </label>
              <label>Turno
                <select required value={nuevoBloque.turno} onChange={e => setNuevoBloque({...nuevoBloque, turno: e.target.value})}>
                  <option value="">Selecciona turno</option>
                  {turnos.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>
              <label>Profesores (separados por coma)
                <input required value={nuevoBloque.profesores} onChange={e => setNuevoBloque({...nuevoBloque, profesores: e.target.value})} placeholder="Ej: Juan, Ana" />
              </label>
              <label>Clases (separadas por coma)
                <input required value={nuevoBloque.clases} onChange={e => setNuevoBloque({...nuevoBloque, clases: e.target.value})} placeholder="Ej: Clase 1, Clase 2" />
              </label>
              <label>Misiones (separadas por coma)
                <input required value={nuevoBloque.misiones} onChange={e => setNuevoBloque({...nuevoBloque, misiones: e.target.value})} placeholder="Ej: Misión 1, Misión 2" />
              </label>
              <label>Horarios (separados por coma)
                <input required value={nuevoBloque.horarios} onChange={e => setNuevoBloque({...nuevoBloque, horarios: e.target.value})} placeholder="Ej: Lunes 8:00-10:00, Miércoles 10:00-12:00" />
              </label>
              <div style={{display:'flex', gap:12, marginTop:16}}>
                <button type="submit" className="crear-bloque-btn">Crear</button>
                <button type="button" className="close-btn" onClick={() => setShowCrear(false)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
