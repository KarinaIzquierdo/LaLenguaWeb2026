import React, { useEffect, useRef, useState } from 'react';
import { COLOR_MODULO, COLOR_MODULO_OSCURO } from '../rangos';
import './RadarHabilidades.css';

interface RadarHabilidadesProps {
  vocabulario: number;
  gramatica: number;
  conversacion: number;
  max?: number;
  tamano?: number;
}

const DURACION_MS = 1200;

interface Eje {
  nombre: string;
  valor: number;
}

export default function RadarHabilidades({
  vocabulario,
  gramatica,
  conversacion,
  max = 3,
  tamano = 320,
}: RadarHabilidadesProps) {
  const [anim, setAnim] = useState(0);
  const animadoRef = useRef(false);

  useEffect(() => {
    if (animadoRef.current) return;
    animadoRef.current = true;

    let raf: number;
    const inicio = performance.now();

    const paso = (ahora: number) => {
      const t = Math.min(1, (ahora - inicio) / DURACION_MS);
      setAnim(1 - Math.pow(1 - t, 3));
      if (t < 1) raf = requestAnimationFrame(paso);
    };

    raf = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(raf);
  }, []);

  const ejes: Eje[] = [
    { nombre: 'Vocabulario', valor: Math.max(0, Math.min(max, vocabulario)) },
    { nombre: 'Gramática', valor: Math.max(0, Math.min(max, gramatica)) },
    { nombre: 'Conversación', valor: Math.max(0, Math.min(max, conversacion)) },
  ];

  // Geometría: centro en (160,160), radio máximo 110 a partir del ángulo superior
  const centro = 160;
  const radioMax = 110;

  const punto = (idx: number, fraccion: number) => {
    // idx 0 = arriba, 1 = abajo-derecha, 2 = abajo-izquierda
    const angulo = (Math.PI * 2 * idx) / 3 - Math.PI / 2;
    return {
      x: centro + Math.cos(angulo) * radioMax * fraccion,
      y: centro + Math.sin(angulo) * radioMax * fraccion,
    };
  };

  const poligonoNivel = (nivel: number) =>
    ejes
      .map((_, i) => {
        const p = punto(i, nivel / max);
        return `${p.x},${p.y}`;
      })
      .join(' ');

  const poligonoDatos = ejes
    .map((eje, i) => {
      const p = punto(i, (eje.valor / max) * anim);
      return `${p.x},${p.y}`;
    })
    .join(' ');


  return (
    <div className="radar-wrapper">
      <svg
        className="radar-svg"
        viewBox="0 0 320 320"
        width={tamano}
        height={tamano}
        role="img"
        aria-label="Gráfico de habilidades"
      >
        <defs>
          <linearGradient id="radar-gradiente" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={COLOR_MODULO} stopOpacity="0.55" />
            <stop offset="100%" stopColor={COLOR_MODULO_OSCURO} stopOpacity="0.55" />
          </linearGradient>
        </defs>

        {/* Niveles de fondo */}
        {Array.from({ length: max }, (_, i) => i + 1).map((nivel) => (
          <polygon
            key={nivel}
            points={poligonoNivel(nivel)}
            className="radar-nivel"
          />
        ))}

        {/* Líneas de ejes */}
        {ejes.map((_, i) => {
          const p = punto(i, 1);
          return (
            <line
              key={i}
              x1={centro}
              y1={centro}
              x2={p.x}
              y2={p.y}
              className="radar-eje"
            />
          );
        })}

        {/* Polígono de datos */}
        <polygon points={poligonoDatos} className="radar-datos" />

        {/* Vértices */}
        {ejes.map((eje, i) => {
          const p = punto(i, (eje.valor / max) * anim);
          return <circle key={i} cx={p.x} cy={p.y} r="6" className="radar-vertice" />;
        })}
      </svg>

      {/* Etiquetas con nivel */}
      {ejes.map((eje, i) => {
        const p = punto(i, 1.22);
        return (
          <div
            key={i}
            className="radar-etiqueta"
            style={{
              left: `${(p.x / 320) * 100}%`,
              top: `${(p.y / 320) * 100}%`,
            }}
          >
            <span className="radar-nombre">{eje.nombre}</span>
            <span className="radar-valor">
              {'★'.repeat(eje.valor)}
              <span className="radar-vacias">{'★'.repeat(max - eje.valor)}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}
