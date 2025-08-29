import React from 'react';
import './NotesModal.css';

interface EvaluationNote {
  id: string;
  type: string;
  title: string;
  date: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeSpent: string;
  status: 'completed' | 'in_progress';
}

interface NotesModalProps {
  isVisible: boolean;
  onClose: () => void;
}

const NotesModal: React.FC<NotesModalProps> = ({ isVisible, onClose }) => {
  if (!isVisible) return null;

  // Mock data for evaluation notes
  const evaluationNotes: EvaluationNote[] = [
    {
      id: '1',
      type: 'vocabulary',
      title: 'Quiz de Vocabulario',
      date: '2024-01-15',
      score: 85,
      totalQuestions: 10,
      correctAnswers: 8,
      timeSpent: '12:34',
      status: 'completed'
    },
    {
      id: '2',
      type: 'grammar',
      title: 'Evaluación de Gramática',
      date: '2024-01-12',
      score: 92,
      totalQuestions: 15,
      correctAnswers: 14,
      timeSpent: '18:45',
      status: 'completed'
    },
    {
      id: '3',
      type: 'comprehension',
      title: 'Comprensión Auditiva',
      date: '2024-01-10',
      score: 78,
      totalQuestions: 8,
      correctAnswers: 6,
      timeSpent: '15:20',
      status: 'completed'
    },
    {
      id: '4',
      type: 'vocabulary',
      title: 'Quiz de Vocabulario',
      date: '2024-01-08',
      score: 70,
      totalQuestions: 10,
      correctAnswers: 7,
      timeSpent: '14:12',
      status: 'completed'
    }
  ];

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'vocabulary': return '📚';
      case 'grammar': return '✏️';
      case 'comprehension': return '🎧';
      default: return '📝';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const averageScore = Math.round(
    evaluationNotes.reduce((sum, note) => sum + note.score, 0) / evaluationNotes.length
  );

  return (
    <div className="notes-modal-overlay">
      <div className="notes-modal">
        <div className="notes-header">
          <div className="notes-info">
            <h2>📝 Notas de Evaluaciones</h2>
            <p>Historial completo de tus evaluaciones y quizzes</p>
          </div>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>

        <div className="notes-summary">
          <div className="summary-card">
            <div className="summary-icon">📊</div>
            <div className="summary-content">
              <span className="summary-number">{evaluationNotes.length}</span>
              <span className="summary-label">Evaluaciones</span>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon">🎯</div>
            <div className="summary-content">
              <span className="summary-number" style={{ color: getScoreColor(averageScore) }}>
                {averageScore}%
              </span>
              <span className="summary-label">Promedio</span>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon">🏆</div>
            <div className="summary-content">
              <span className="summary-number">92%</span>
              <span className="summary-label">Mejor Nota</span>
            </div>
          </div>
        </div>

        <div className="notes-content">
          <h3>Historial de Evaluaciones</h3>
          <div className="notes-list">
            {evaluationNotes.map((note) => (
              <div key={note.id} className="note-item">
                <div className="note-header">
                  <div className="note-title-section">
                    <span className="note-icon">{getTypeIcon(note.type)}</span>
                    <div className="note-title-info">
                      <h4>{note.title}</h4>
                      <span className="note-date">{formatDate(note.date)}</span>
                    </div>
                  </div>
                  <div className="note-score" style={{ color: getScoreColor(note.score) }}>
                    {note.score}%
                  </div>
                </div>
                
                <div className="note-details">
                  <div className="note-stat">
                    <span className="stat-label">Correctas:</span>
                    <span className="stat-value">{note.correctAnswers}/{note.totalQuestions}</span>
                  </div>
                  <div className="note-stat">
                    <span className="stat-label">Tiempo:</span>
                    <span className="stat-value">{note.timeSpent}</span>
                  </div>
                  <div className="note-stat">
                    <span className="stat-label">Estado:</span>
                    <span className={`stat-badge ${note.status}`}>
                      {note.status === 'completed' ? 'Completado' : 'En Progreso'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="notes-actions">
          <button className="action-button primary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotesModal;
