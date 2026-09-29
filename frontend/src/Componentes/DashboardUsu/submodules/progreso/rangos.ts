export const COLOR_MODULO = '#53B1B4';
export const COLOR_MODULO_OSCURO = '#23787B';

export interface Rango {
  nombre: string;
  min: number;
  color: string;
}

export const RANGOS: Rango[] = [
  { nombre: 'Novato', min: 0, color: '#9FCBCD' },
  { nombre: 'Explorador', min: 15, color: '#7FC6C8' },
  { nombre: 'Aventurero', min: 35, color: '#53B1B4' },
  { nombre: 'Intermedio', min: 60, color: '#3E9295' },
  { nombre: 'Avanzado', min: 80, color: '#2C7578' },
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
