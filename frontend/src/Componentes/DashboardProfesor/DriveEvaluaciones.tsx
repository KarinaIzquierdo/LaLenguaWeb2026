import './DriveEvaluaciones.css';

export default function DriveEvaluaciones() {
  // URL del Google Drive - puedes cambiarla según necesites
  const driveUrl = 'https://drive.google.com/drive/folders/YOUR_FOLDER_ID';

  const handleOpenDrive = () => {
    window.open(driveUrl, '_blank');
  };

  return (
    <div className="drive-evaluaciones-container">
      <div className="drive-header">
        <h1>📁 Evaluaciones y Calificaciones</h1>
        <p>Accede a Google Drive para gestionar evaluaciones, quizzes y calificaciones</p>
      </div>

      <div className="drive-card">
        <div className="drive-icon">
          <svg viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
            <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
            <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
            <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
            <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
            <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
            <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
          </svg>
        </div>

        <div className="drive-content">
          <h2>Google Drive - Evaluaciones</h2>
          <p>
            Todas las evaluaciones, quizzes y calificaciones se gestionan en Google Drive.
            Haz clic en el botón para acceder a la carpeta compartida.
          </p>

          <div className="drive-features">
            <div className="feature-item">
              <span className="feature-icon">📝</span>
              <span>Crear y editar evaluaciones</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">✅</span>
              <span>Calificar trabajos de estudiantes</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">📊</span>
              <span>Ver estadísticas y reportes</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">💾</span>
              <span>Almacenamiento organizado</span>
            </div>
          </div>

          <button className="btn-open-drive" onClick={handleOpenDrive}>
            <svg width="24" height="24" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
              <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
              <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
              <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
              <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
              <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
              <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
            </svg>
            Abrir Google Drive
          </button>

          <div className="drive-note">
            <strong>Nota:</strong> Asegúrate de tener acceso a la carpeta compartida de Google Drive.
            Si no puedes acceder, contacta al administrador.
          </div>
        </div>
      </div>

      <div className="drive-instructions">
        <h3>📌 Instrucciones</h3>
        <ol>
          <li>Haz clic en "Abrir Google Drive" para acceder a la carpeta</li>
          <li>Busca la carpeta de tu bloque o nivel</li>
          <li>Crea o edita las evaluaciones según necesites</li>
          <li>Califica los trabajos de los estudiantes directamente en Drive</li>
          <li>Los estudiantes podrán ver sus calificaciones desde su dashboard</li>
        </ol>
      </div>
    </div>
  );
}
