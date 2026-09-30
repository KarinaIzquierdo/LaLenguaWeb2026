import React, { useEffect, useRef, useState } from 'react';
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

const VIEW_ANCHO = 640;
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

// Decoración ambiental sobre las curvas del camino (estilo mapa de juego)
const DECO = ['🌴', '☁️', '⛰️', '🦋', '🌴'];

// Piezas de confetti al subir de nivel
const COLORES_CONFETTI = ['#53b1b4', '#7fc6c8', '#f7c56b', '#4a9e9e', '#ffffff'];

function generarConfetti() {
  return Array.from({ length: 26 }, (_, i) => ({
    id: i,
    izquierda: Math.random() * 100,
    retardo: Math.random() * 0.5,
    tamano: 6 + Math.random() * 7,
    color: COLORES_CONFETTI[Math.floor(Math.random() * COLORES_CONFETTI.length)],
    redondeado: Math.random() > 0.5,
  }));
}

export default function CaminoNiveles({ xpTotal }: CaminoNivelesProps) {
  const [nodoActivo, setNodoActivo] = useState<number | null>(null);
  const [confetti, setConfetti] = useState<ReturnType<typeof generarConfetti> | null>(null);
  const nivelPrevioRef = useRef<number | null>(null);

  const xp = Math.max(0, xpTotal || 0);

  const nivelActual = NIVELES.reduce((acc, nivel, i) => (xp >= nivel.xp ? i : acc), 0);

  // Detectar subida de nivel → confetti una sola vez
  useEffect(() => {
    const previo = nivelPrevioRef.current;
    if (previo !== null && nivelActual > previo) {
      setConfetti(generarConfetti());
      const timer = setTimeout(() => setConfetti(null), 2900);
      nivelPrevioRef.current = nivelActual;
      return () => clearTimeout(timer);
    }
    nivelPrevioRef.current = nivelActual;
  }, [nivelActual]);

  // Fracción de progreso del tramo actual (0 a 1)
  const progresoTramo = (i: number): number => {
    if (i !== nivelActual) return 0;
    const desde = NIVELES[i].xp;
    const hasta = NIVELES[i + 1].xp;
    return Math.min(1, Math.max(0, (xp - desde) / (hasta - desde)));
  };

  const tramoActualProgreso = nivelActual < NIVELES.length - 1 ? progresoTramo(nivelActual) : 1;

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
          const progreso = progresoTramo(i);
          return (
            <g key={i}>
              <path
                d={segmentoCurva(i)}
                fill="none"
                pathLength={150}
                className={`camino-segmento ${completado ? 'completado' : 'pendiente'}`}
              />
              {!completado && progreso > 0 && (
                <path
                  d={segmentoCurva(i)}
                  fill="none"
                  pathLength={150}
                  strokeDasharray={`${progreso * 150} 150`}
                  className="camino-segmento camino-parcial"
                />
              )}
            </g>
          );
        })}

        {/* Decoración ambiental sobre las curvas */}
        {DECO.map((emoji, i) => {
          const x = (NODOS_X[i] + NODOS_X[i + 1]) / 2;
          const y = (NODOS_Y[i] + NODOS_Y[i + 1]) / 2 - 26;
          return (
            <text key={i} x={x} y={y} textAnchor="middle" className="camino-deco">
              {emoji}
            </text>
          );
        })}

        {/* Banderas: 🚩 marca la salida, 🏁 ondea sobre el nodo Experto y ⭐ cierra la meta */}
        <text x={NODOS_X[0] - 30} y={NODOS_Y[0] - 24} className="camino-bandera">
          🚩
        </text>
        <text x={NODOS_X[5]} y={NODOS_Y[5] - 34} textAnchor="middle" className="camino-bandera">
          🏁
        </text>
        <text
          x={NODOS_X[5] + 46}
          y={NODOS_Y[5] + 8}
          textAnchor="middle"
          className="camino-bandera bandera-meta"
        >
          ⭐
        </text>

        {/* Nodos */}
        {NIVELES.map((nivel, i) => {
          const pasado = i < nivelActual;
          const actual = i === nivelActual;
          const cx = NODOS_X[i];
          const cy = NODOS_Y[i];
          // El siguiente nodo titila cuando el tramo actual va ≥85%
          const casiDesbloqueado = i === nivelActual + 1 && tramoActualProgreso >= 0.85;
          // En el nodo final el nombre va debajo para dejar espacio a la ⭐ de meta
          const textoY = i === NIVELES.length - 1 ? cy + 38 : cy > 100 ? cy + 38 : cy - 34;
          return (
            <g
              key={nivel.nombre}
              className="camino-nodo-grupo"
              onClick={() => toggleNodo(i)}
              onMouseEnter={() => setNodoActivo(i)}
              onMouseLeave={() => setNodoActivo(null)}
            >
              {actual && <circle cx={cx} cy={cy} r="24" className="camino-pulso" />}
              {casiDesbloqueado && <circle cx={cx} cy={cy} r="24" className="camino-pulso pulso-dorado" />}
              <circle
                cx={cx}
                cy={cy}
                r={actual ? 20 : 15}
                className={`camino-nodo ${pasado ? 'pasado' : ''} ${actual ? 'actual' : ''} ${casiDesbloqueado ? 'por-desbloquear' : ''} ${!pasado && !actual && !casiDesbloqueado ? 'futuro' : ''}`}
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

      {/* Confetti al subir de nivel */}
      {confetti && (
        <div className="camino-confetti" aria-hidden="true">
          {confetti.map((pieza) => (
            <span
              key={pieza.id}
              className="confetti-pieza"
              style={{
                left: `${pieza.izquierda}%`,
                animationDelay: `${pieza.retardo}s`,
                width: pieza.tamano,
                height: pieza.redondeado ? pieza.tamano : pieza.tamano * 1.6,
                background: pieza.color,
                borderRadius: pieza.redondeado ? '50%' : 2,
              }}
            />
          ))}
        </div>
      )}

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
