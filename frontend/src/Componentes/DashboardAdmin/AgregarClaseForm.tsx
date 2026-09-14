
import React, { useState } from 'react';

const AgregarClaseForm = ({ onAddClass }) => {
  const [nombre, setNombre] = useState('');
  const [profesor, setProfesor] = useState('');

  const nombresClasesDisponibles = [
    'Introducción C1',
    'A1 - Unidad 1: Saludos',
    'A1 - Unidad 2: Familia',
    'A2 - Unidad 1: Rutina',
    'B1 - Unidad 1: Viajes',
    'B2 - Unidad 1: Negocios',
    'C1 - Academic Writing',
    'Conversational Club',
    'IELTS Preparation',
    'TOEFL Preparation',
    'Business English'
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nombre || !profesor) return; // Validación simple
    
    // Llama a la función pasada por props con los datos del formulario
    onAddClass({ nombre, profesor, fecha: new Date().toLocaleDateString() });

    // Limpia el formulario
    setNombre('');
    setProfesor('');
  };

  return (
    <div className="form-container">
      <h3>Agregar Nueva Clase</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="nombre">Nombre de la Clase</label>
          <select 
            id="nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="form-control"
            required
          >
            <option value="">Selecciona una clase</option>
            {nombresClasesDisponibles.map((n, i) => (
              <option key={i} value={n}>{n}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="profesor">Nombre del Profesor</label>
          <input 
            type="text" 
            id="profesor"
            value={profesor}
            onChange={(e) => setProfesor(e.target.value)}
            placeholder="Ej: Juan Pérez"
          />
        </div>
        <button type="submit" className="btn btn-primary">Agregar Clase</button>
      </form>
    </div>
  );
};

export default AgregarClaseForm;
