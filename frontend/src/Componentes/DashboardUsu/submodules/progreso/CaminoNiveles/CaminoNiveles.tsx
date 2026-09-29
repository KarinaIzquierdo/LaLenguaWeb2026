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

const VIEW_ANCHO = 600;
const VIEW_ALTO = 200;

// Posiciones serpenteantes: zig-zag vertical a lo largo del camino
const NODOS_X = [50, 150, 250, 350, 450, 550];
const NODOS_Y = [140, 60, 140, 60, 140, 60];

function segmentoCurva(i: number): string {
  const x1 = NODOS_X[i];
  const y1 = NODOS_Y[i];
  const x2 = NODOS_X[i + 1];
  const y2 = NODOS_Y[i + 1];
  const medio = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${medio} ${y1}, ${medio} ${y2}, ${x2} ${y2}`;
}

export default function CaminoNiveles({ xpTotal }: CaminoNivelesProps) {
  const [nodoActivo, setNodoActivo] = useState<number | null>(null);

  const xp = Math.max(0, xpTotal || 0);

  const nivelActual = NIVELES.reduce((acc, nivel, i) => (xp >= nivel.xp ? i : acc), 0);

  const toggleNodo = (i: number) => setNodoActivo((prev) => (prev === i ? null : i));

  return (
    <div className="camino-wrapper">
      <svg className="camino-svg" viewBox={`0 0 ${VIEW_ANCHO} ${VIEW_ALTO}`} role="img" aria-label="Camino de niveles">
        <defs>
          <linearGradient id="camino-gradiente" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={COLOR_MODULO} />
            <stop offset="100%" stopColor={COLOR_MODULO_OSCURO} />
          </linearGradient>
        </defs>

        {/* Segmentos curvos del camino */}
        {NIVELES.slice(0, -1).map((_, i) => {
          const completado = i < nivelActual;
          return (
            <path
              key={i}
              d={segmentoCurva(i)}
              fill="none"
              pathLength={150}
              className={`camino-segmento ${completado ? 'completado' : 'pendiente'}`}
            />
          );
        })}

        {/* Nodos */}
        {NIVELES.map((nivel, i) => {
          const pasado = i < nivelActual;
          const actual = i === nivelActual;
          const cx = NODOS_X[i];
          const cy = NODOS_Y[i];
          // Nombre debajo si el nodo va en la parte baja del zig-zag, encima si va arriba
          const textoY = cy > 100 ? cy + 38 : cy - 34;
          return (
            <g
              key={nivel.nombre}
              className="camino-nodo-grupo"
              onClick={() => toggleNodo(i)}
              onMouseEnter={() => setNodoActivo(i)}
              onMouseLeave={() => setNodoActivo(null)}
            >
              {actual && <circle cx={cx} cy={cy} r="24" className="camino-pulso" />}
              <circle
                cx={cx}
                cy={cy}
                r={actual ? 20 : 15}
                className={`camino-nodo ${pasado ? 'pasado' : ''} ${actual ? 'actual' : ''} ${!pasado && !actual ? 'futuro' : ''}`}
              />
              <text x={cx} y={cy + 6} textAnchor="middle" className="camino-icono">
                {pasado ? '✓' : actual ? '🏅' : '🔒'}
              </text>
              <text x={cx} y={textoY} textAnchor="middle" className={`camino-nombre ${actual ? 'nombre-actual' : ''}`}>
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
            left: `${(NODOS_X[nodoActivo] / VIEW_ANCHO) * 100}%`,
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
