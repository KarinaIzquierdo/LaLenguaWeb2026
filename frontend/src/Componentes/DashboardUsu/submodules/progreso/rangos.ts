export interface Rango {
  nombre: string;
  min: number;
  color: string;
}

export const RANGOS: Rango[] = [
  { nombre: 'Novato', min: 0, color: '#94a3b8' },
  { nombre: 'Explorador', min: 15, color: '#22c55e' },
  { nombre: 'Aventurero', min: 35, color: '#14b8a6' },
  { nombre: 'Intermedio', min: 60, color: '#3b82f6' },
  { nombre: 'Avanzado', min: 80, color: '#a855f7' },
  { nombre: 'Experto', min: 95, color: '#f59e0b' },
];

export function rangoPorPorcentaje(porcentaje: number): Rango {
  const p = Math.max(0, Math.min(100, porcentaje));
  let actual = RANGOS[0];
  for (const rango of RANGOS) {
    if (p >= rango.min) actual = rango;
  }
  return actual;
}
