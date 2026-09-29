import React, { useEffect, useRef, useState } from 'react';
import { rangoPorPorcentaje, COLOR_MODULO, COLOR_MODULO_OSCURO } from '../rangos';
import './AnilloProgreso.css';

interface AnilloProgresoProps {
  porcentaje: number;
  xp: number;
  tamano?: number;
}

const DURACION_MS = 1500;

export default function AnilloProgreso({ porcentaje, xp, tamano = 260 }: AnilloProgresoProps) {
  const objetivo = Math.max(0, Math.min(100, porcentaje));
  const [progreso, setProgreso] = useState(0);
  const [xpAnimado, setXpAnimado] = useState(0);
  const animadoRef = useRef(false);

  useEffect(() => {
    if (animadoRef.current) return;
    animadoRef.current = true;

    let raf: number;
    const inicio = performance.now();

    const paso = (ahora: number) => {
      const t = Math.min(1, (ahora - inicio) / DURACION_MS);
      const eased = 1 - Math.pow(1 - t, 3);
      setProgreso(eased * objetivo);
      setXpAnimado(Math.round(eased * xp));
      if (t < 1) raf = requestAnimationFrame(paso);
    };

    raf = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(raf);
  }, [objetivo, xp]);

  const rango = rangoPorPorcentaje(objetivo);

  const radio = 100;
  const circunferencia = 2 * Math.PI * radio;
  const offset = circunferencia - (progreso / 100) * circunferencia;

  return (
    <div className="anillo-wrapper" style={{ width: tamano, height: tamano }}>
      <svg className="anillo-svg" viewBox="0 0 240 240">
        <defs>
          <linearGradient id="anillo-gradiente" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={COLOR_MODULO} />
            <stop offset="100%" stopColor={COLOR_MODULO_OSCURO} />
          </linearGradient>
        </defs>
        <circle className="anillo-fondo" cx="120" cy="120" r={radio} />
        <circle
          className="anillo-limite"
          cx="120"
          cy="120"
          r={radio}
          strokeDasharray={circunferencia}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="anillo-centro">
        <span className="anillo-porcentaje">{Math.round(progreso)}%</span>
        <span className="anillo-xp">{xpAnimado.toLocaleString('es-CO')} XP</span>
        <span
          className="anillo-rango"
          style={{ backgroundColor: `${rango.color}22`, color: rango.color }}
        >
          {rango.nombre}
        </span>
      </div>
    </div>
  );
}
