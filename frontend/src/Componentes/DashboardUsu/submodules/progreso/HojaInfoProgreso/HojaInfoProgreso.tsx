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
                  Una ruta zig-zag de <em>Principiante a Experto</em> (termina en la ⭐). Cada nivel
                  se desbloquea acumulando <em>XP</em>: la línea se va pintando en teal a medida que
                  avanzas. Cuando falta poco, el siguiente candado <em>brilla dorado</em> ✨ y al
                  desbloquear... ¡llueve confetti! 🎊 Pasa el mouse sobre cada nodo para ver
                  cuánto XP te falta.
                </p>
              </div>
            </div>

            <div className="hojainfo-seccion">
              <span className="hojainfo-emoji">⭕</span>
              <div>
                <strong>El anillo</strong>
                <p>
                  Es tu progreso <em>dentro del nivel actual</em>. Debajo verás tu título real y
                  cuántos XP necesitas para el siguiente. Al llegar al <em>100%</em> el sello cambia
                  y subes de rango.
                </p>
              </div>
            </div>

            <div className="hojainfo-seccion">
              <span className="hojainfo-emoji">⭐</span>
              <div>
                <strong>Tus habilidades</strong>
                <p>
                  El radar registra tus retos diarios por tema: Vocabulario, Gramática, Conversación
                  y Expresiones. <em>Pasa el mouse sobre cada puntito</em> y ve tus aciertos reales
                  y qué te falta para la siguiente estrella. Necesitas <em>5 retos</em> por tema
                  para obtener tu evaluación:
                </p>
                <div className="hojainfo-regla">
                  <span>⭐ ≥ 50%</span>
                  <span>⭐⭐ ≥ 70%</span>
                  <span>⭐⭐⭐ ≥ 85%</span>
                </div>
              </div>
            </div>

            <div className="hojainfo-pie">
              <span>💡</span> Tip: la constancia manda — el reto diario suma XP, racha y estrellas
              a la vez. ¡No lo sueltes! 🔥
            </div>
          </div>
        </div>
      )}
    </>
  );
}
