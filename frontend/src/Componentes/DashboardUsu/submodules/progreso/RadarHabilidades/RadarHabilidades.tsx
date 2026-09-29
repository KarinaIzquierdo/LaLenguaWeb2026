import React, { useEffect, useRef, useState } from 'react';
import { COLOR_MODULO, COLOR_MODULO_OSCURO } from '../rangos';
import './RadarHabilidades.css';

interface DatoEje {
  valor: number;
  intentos: number;
  aciertos: number;
}

interface RadarHabilidadesProps {
  datos: Record<'vocabulario' | 'gramatica' | 'conversacion' | 'expresiones', DatoEje>;
  max?: number;
  tamano?: number;
  minIntentosEvaluar?: number;
}

const DURACION_MS = 1200;

export default function RadarHabilidades({
  datos,
  max = 3,
  tamano = 340,
  minIntentosEvaluar = 5,
}: RadarHabilidadesProps) {
  const [anim, setAnim] = useState(0);
  const animadoRef = useRef(false);
  const [ejeActivo, setEjeActivo] = useState<number | null>(null);

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

  const ejes = [
    { nombre: 'Vocabulario', ...datos.vocabulario },
    { nombre: 'Gramática', ...datos.gramatica },
    { nombre: 'Conversación', ...datos.conversacion },
    { nombre: 'Expresiones', ...datos.expresiones },
  ].map((eje) => ({
    ...eje,
    valor: Math.max(0, Math.min(max, eje.valor)),
  }));

  // Geometría genérica para N ejes
  const centro = 160;
  const radioMax = 95;
  const totalEjes = ejes.length;

  const punto = (idx: number, fraccion: number) => {
    const angulo = (Math.PI * 2 * idx) / totalEjes - Math.PI / 2;
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

  const textoTooltip = (eje: (typeof ejes)[number]) => {
    const { intentos, aciertos, valor } = eje;
    if (intentos < minIntentosEvaluar) {
      const faltan = minIntentosEvaluar - intentos;
      return `${aciertos} aciertos de ${intentos} preguntas · Responde ${faltan} reto${faltan > 1 ? 's' : ''} más para calcular tu nivel`;
    }
    if (valor >= max) return `${aciertos} aciertos de ${intentos} preguntas · ¡Nivel máximo! 🏆`;
    // Siguiente estrella según umbrales de precisión
    const umbrales = [0.5, 0.7, 0.85];
    const precision = aciertos / intentos;
    const siguiente = umbrales[valor];
    const necesarios = siguiente ? Math.ceil(siguiente * intentos - aciertos) : 0;
    const pctRequerido = Math.round((siguiente || 0) * 100);
    const pct = Math.round(precision * 100);
    return `${aciertos} aciertos de ${intentos} preguntas (${pct}%) · ${
      necesarios > 0 ? `Te falta${necesarios > 1 ? 'n' : ''} ${necesarios} acierto${necesarios > 1 ? 's' : ''} (${pctRequerido}%) para ★${valor + 1}` : `Consigue ${pctRequerido}% para ★${valor + 1}`
    }`;
  };

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

        {/* Vértices interactivos */}
        {ejes.map((eje, i) => {
          const p = punto(i, (eje.valor / max) * anim);
          return (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r="6"
              className="radar-vertice"
              onMouseEnter={() => setEjeActivo(i)}
              onMouseLeave={() => setEjeActivo(null)}
            />
          );
        })}
      </svg>

      {/* Etiquetas con nivel (interactivas al hover) */}
      {ejes.map((eje, i) => {
        const p = punto(i, 1.3);
        return (
          <div
            key={i}
            className={`radar-etiqueta ${ejeActivo === i ? 'activa' : ''}`}
            style={{
              left: `${(p.x / 320) * 100}%`,
              top: `${(p.y / 320) * 100}%`,
            }}
            onMouseEnter={() => setEjeActivo(i)}
            onMouseLeave={() => setEjeActivo(null)}
          >
            <span className="radar-nombre">{eje.nombre}</span>
            <span className="radar-valor">
              {Array.from({ length: max }, (_, s) => (
                <span
                  key={s}
                  className={s < eje.valor ? 'radar-estrella llena' : 'radar-estrella vacia'}
                  style={{ animationDelay: `${1.1 + s * 0.15}s` }}
                >
                  ★
                </span>
              ))}
            </span>
          </div>
        );
      })}

      {/* Tooltip con datos reales */}
      {ejeActivo !== null && (
        <div
          className="radar-tooltip"
          style={{
            left: `${(punto(ejeActivo, 1.3).x / 320) * 100}%`,
            top: `${(punto(ejeActivo, 1.3).y / 320) * 100}%`,
          }}
        >
          <strong>{ejes[ejeActivo].nombre}</strong>
          <span style={{ whiteSpace: 'normal' }}>{textoTooltip(ejes[ejeActivo])}</span>
        </div>
      )}
    </div>
  );
}
