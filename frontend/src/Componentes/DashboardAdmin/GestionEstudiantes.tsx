import React from 'react';
import './GestionEstudiantes.css';


//Datos simulados para la tabla de estudiantes
const studentsData = [
  {
    id: 1,
    name: 'John Doe',
    status: 'Activo',
    tasksCompleted: 80,
    attendance: 95,
    level: 'B2',
  },
  {
    id: 2,
    name: 'Jane Smith',
    status: 'Activo',
    tasksCompleted: 60,
    attendance: 92,
    level: 'A2',
  },
  {
    id: 3,
    name: 'Peter Jones',
    status: 'Inactivo',
    tasksCompleted: 90,
    attendance: 50,
    level: 'A1',
  },
  {
    id: 4,
    name: 'Maria Garcia',
    status: 'Activo',
    tasksCompleted: 100,
    attendance: 100,
    level: 'C1',
  },
];

const GestionEstudiantes = () => {
  return (
    <div className="student-management-container">
      <h2>Gestión de Estudiantes</h2>
      {/* Tabla de estudiantes */}
      <table className="students-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Estado</th>
            <th>Tareas Cumplidas</th>
            <th>Asistencia</th>
            <th>Nivel de Inglés</th>
          </tr>
        </thead>
        <tbody>
          {studentsData.map((student) => (
            <tr key={student.id}>
              <td>{student.name}</td>
              <td>
                <span className={`status ${student.status.toLowerCase()}`}>
                  {student.status}
                </span>
              </td>
              <td>
                <div className="progress-bar-container">
                  <div
                    className="progress-bar"
                    style={{ width: `${student.tasksCompleted}%` }}
                  >
                    {student.tasksCompleted}%
                  </div>
                </div>
              </td>
              <td>
                <div className="progress-bar-container">
                  <div
                    className="progress-bar"
                    style={{ width: `${student.attendance}%` }}
                  >
                    {student.attendance}%
                  </div>
                </div>
              </td>
              <td>{student.level}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default GestionEstudiantes;
