import React, { useState } from 'react';
import { COLOR_MODULO, COLOR_MODULO_OSCURO } from '../rangos';
import './CaminoNiveles.css';

interface CaminoNivelesProps {
  xpTotal: number;
}

interface Nivel {
  nombre: string;
  xp: number;
}

// Mismos umbrales que usa el backend (get_title_from_xp)
const NIVELES: Nivel[] = [
  { nombre: 'Principiante', xp: 0 },
  { nombre: 'Explorador', xp: 100 },
  { nombre: 'Aventurero', xp: 300 },
  { nombre: 'Intermedio', xp: 600 },
  { nombre: 'Avanzado', xp: 1000 },
  { nombre: 'Experto', xp: 1500 },
];

const PESO_ANCHO = 600;
const NODO_INICIO_X = 60;
const NODO_ESPACIO = 96;
const NODO_Y = 34;

export default function CaminoNiveles({ xpTotal }: CaminoNivelesProps) {
  const [nodoActivo, setNodoActivo] = useState<number | null>(null);

  const xp = Math.max(0, xpTotal || 0);

  const nivelActual = NIVELES.reduce((acc, nivel, i) => (xp >= nivel.xp ? i : acc), 0);

  const nodoX = (i: number) => NODO_INICIO_X + i * NODO_ESPACIO;

  const toggleNodo = (i: number) => setNodoActivo((prev) => (prev === i ? null : i));

  return (
    <div className="camino-wrapper">
      <svg className="camino-svg" viewBox={`0 0 ${PESO_ANCHO} 90`} role="img" aria-label="Camino de niveles">
        <defs>
          <linearGradient id="camino-gradiente" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={COLOR_MODULO} />
            <stop offset="100%" stopColor={COLOR_MODULO_OSCURO} />
          </linearGradient>
        </defs>

        {/* Segmentos del camino */}
        {NIVELES.slice(0, -1).map((_, i) => {
          const completado = i < nivelActual;
          return (
            <line
              key={i}
              x1={nodoX(i)}
              y1={NODO_Y}
              x2={nodoX(i + 1)}
              y2={NODO_Y}
              className={`camino-segmento ${completado ? 'completado' : 'pendiente'}`}
            />
          );
        })}

        {/* Nodos */}
        {NIVELES.map((nivel, i) => {
          const pasado = i < nivelActual;
          const actual = i === nivelActual;
          const cx = nodoX(i);
          return (
            <g
              key={nivel.nombre}
              className="camino-nodo-grupo"
              onClick={() => toggleNodo(i)}
              onMouseEnter={() => setNodoActivo(i)}
              onMouseLeave={() => setNodoActivo(null)}
            >
              {/* Anillo pulsante del nodo actual */}
              {actual && <circle cx={cx} cy={NODO_Y} r="24" className="camino-pulso" />}
              <circle
                cx={cx}
                cy={NODO_Y}
                r={actual ? 17 : 13}
                className={`camino-nodo ${pasado ? 'pasado' : ''} ${actual ? 'actual' : ''} ${!pasado && !actual ? 'futuro' : ''}`}
              />
              <text x={cx} y={NODO_Y + 5} textAnchor="middle" className="camino-icono">
                {pasado ? '✓' : actual ? '🏅' : '🔒'}
              </text>
              <text x={cx} y={NODO_Y + 48} textAnchor="middle" className={`camino-nombre ${actual ? 'nombre-actual' : ''}`}>
                {nivel.nombre}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Tooltip del nodo activo */}
      {nodoActivo !== null && (
        <div
          className="camino-tooltip"
          style={{
            left: `${(nodoX(nodoActivo) / PESO_ANCHO) * 100}%`,
          }}
        >
          <strong>{NIVELES[nodoActivo].nombre}</strong>
          <span>
            {nodoActivo <= nivelActual
              ? `${NIVELES[nodoActivo].xp} XP — ¡Superado!`
              : `${NIVELES[nodoActivo].xp} XP — te faltan ${NIVELES[nodoActivo].xp - xp} XP`}
          </span>
        </div>
      )}
    </div>
  );
}
