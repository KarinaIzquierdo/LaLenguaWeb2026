import React, { useState } from 'react';
import './HojaInfoProgreso.css';

export default function HojaInfoProgreso() {
  const [abierta, setAbierta] = useState(false);

  return (
    <>
      {/* Botón flotante */}
      <button
        className={`hojainfo-fab ${abierta ? 'abierto' : ''}`}
        onClick={() => setAbierta(!abierta)}
        aria-label="¿Cómo funciona tu progreso?"
        title="¿Cómo funciona tu progreso?"
      >
        <span className="hojainfo-fab-icono">{abierta ? '✕' : '💡'}</span>
        <span className="hojainfo-fab-brinillo" />
      </button>

      {/* Hoja de libreta */}
      {abierta && (
        <div className="hojainfo-overlay" onClick={() => setAbierta(false)}>
          <div className="hojainfo-hoja" onClick={(e) => e.stopPropagation()}>
            {/* Cinta adhesiva */}
            <div className="hojainfo-cinta" />

            <button className="hojainfo-cerrar" onClick={() => setAbierta(false)} aria-label="Cerrar">
              ✕
            </button>

            <h2 className="hojainfo-titulo">🗺️ Nota del viajero</h2>
            <p className="hojainfo-subtitulo">Cómo funciona tu progreso en La Lengua</p>

            <div className="hojainfo-linea" />

            <div className="hojainfo-seccion">
              <span className="hojainfo-emoji">📍</span>
              <div>
                <strong>Tu camino</strong>
                <p>
                  Cada nivel (Principiante → Experto) se desbloquea acumulando <em>XP</em>. Ganas XP
                  con retos diarios, misiones y clase. Pasa el mouse sobre cada nodo para ver cuánto te falta.
                </p>
              </div>
            </div>

            <div className="hojainfo-seccion">
              <span className="hojainfo-emoji">⭕</span>
              <div>
                <strong>El anillo</strong>
                <p>
                  Te muestra qué tan cerca estás de tu siguiente título. Cuando llega al
                  100%... ¡subes de rango! ✨
                </p>
              </div>
            </div>

            <div className="hojainfo-seccion">
              <span className="hojainfo-emoji">⭐</span>
              <div>
                <strong>Tus habilidades</strong>
                <p>
                  El radar registra tus respuestas del reto diario por tema: Vocabulario, Gramática,
                  Conversación y Expresiones. Necesitas <em>5 retos</em> por tema para calcular tu
                  nivel, y las estrellas suben con tu precisión:
                </p>
                <div className="hojainfo-regla">
                  <span>⭐ ≥ 50%</span>
                  <span>⭐⭐ ≥ 70%</span>
                  <span>⭐⭐⭐ ≥ 85%</span>
                </div>
              </div>
            </div>

            <div className="hojainfo-pie">
              <span>💡</span> Tip: la constancia manda. ¡Un reto al día mantiene tu racha viva! 🔥
            </div>
          </div>
        </div>
      )}
    </>
  );
}
