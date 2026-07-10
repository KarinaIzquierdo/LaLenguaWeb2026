import { getAuthHeaders, API_BASE_URL } from '../config/api';

interface GamificacionEstadoResponse {
  success: boolean;
  data?: {
    total_dulces: number;
    total_xp: number;
    reto_racha_actual: number;
    reto_mejor_racha: number;
    reto_ultima_fecha: string | null;
    reto_completados_total?: number;
    reto_fallidos_total?: number;
    title?: string;
    title_code?: string;
    next_title_xp?: number | null;
    achievements?: any[];
  };
  message?: string;
}

interface GamificacionAccionResponse {
  success: boolean;
  message?: string;
  data?: {
    total_dulces: number;
    total_xp: number;
    reto_racha_actual?: number;
    reto_mejor_racha?: number;
    reto_ultima_fecha?: string | null;
    reto_semana_progreso?: number;
    dulces_ganados?: number;
    xp_ganado?: number;
    bonus_aplicado?: boolean;
    already_completed?: boolean;
    title?: string;
    title_code?: string;
    next_title_xp?: number | null;
    achievements?: any[];
    new_achievements?: any[];
  };
}

export const gamificationService = {
  async getEstado(): Promise<GamificacionEstadoResponse> {
    const res = await fetch(`${API_BASE_URL}/gamificacion/estado/`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const json = (await res.json()) as GamificacionEstadoResponse;
    if (!res.ok) {
      throw new Error(json.message || 'Error al obtener estado de gamificación');
    }
    return json;
  },

  async claimDailyChallenge(): Promise<GamificacionAccionResponse> {
    const res = await fetch(`${API_BASE_URL}/gamificacion/reto-diario/`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });

    const json = (await res.json()) as GamificacionAccionResponse;
    // El backend puede devolver success=false pero 200 si ya reclamó hoy
    if (!res.ok) {
      throw new Error(json.message || 'Error al reclamar recompensa de reto diario');
    }
    return json;
  },

  async registerDailyChallengeFailure(): Promise<GamificacionAccionResponse> {
    const res = await fetch(`${API_BASE_URL}/gamificacion/reto-diario-fallo/`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });

    const json = (await res.json()) as GamificacionAccionResponse;
    if (!res.ok) {
      throw new Error(json.message || 'Error al registrar fallo de reto diario');
    }
    return json;
  },

  async claimMissionReward(missionKey?: string): Promise<GamificacionAccionResponse> {
    const res = await fetch(`${API_BASE_URL}/gamificacion/mision/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ mission_key: missionKey || '' }),
    });

    const json = (await res.json()) as GamificacionAccionResponse;
    if (!res.ok) {
      throw new Error(json.message || 'Error al registrar recompensa de misión');
    }
    return json;
  },
};
