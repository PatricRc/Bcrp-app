/**
 * Tipos para la API del BCRP
 */

// Frecuencia de los indicadores
export type FrecuenciaIndicador = 'diario' | 'mensual' | 'anual';

// Estructura de un indicador BCRP
export interface IndicadorBCRP {
  codigo: string;
  nombre: string;
  frecuencia: FrecuenciaIndicador;
  unidad: string;
  descripcion?: string;
}

// Estructura de un dato de serie temporal
export interface DatoSerie {
  fecha: string; // formato ISO
  valor: number;
}

// Respuesta formateada de la API BCRP
export interface RespuestaBCRP {
  codigo: string;
  nombre: string;
  datos: DatoSerie[];
}

/**
 * Tipos para la integración con Gemini
 */
export interface RespuestaGemini {
  texto: string;
  fuentes?: string[];
  esOffline?: boolean;
  timestamp: string;
}

/**
 * Tipos para el chatbot
 */
export interface MensajeChat {
  id: string;
  contenido: string;
  esUsuario: boolean;
  timestamp: string;
  fuentes?: string[];
}

export interface ConversacionChat {
  id: string;
  titulo: string;
  mensajes: MensajeChat[];
  fechaCreacion: string;
}

/**
 * Tipos para el módulo Analítica Avanzada (anteriormente Playground)
 */
export type TipoAnalisis = 'tendencia' | 'correlacion' | 'pronostico' | 'reporte' | 'resumen';

export interface AnalisisPlayground {
  indicador1: IndicadorBCRP;
  indicador2?: IndicadorBCRP;
  tipoAnalisis: TipoAnalisis;
  fechaInicio: string;
  fechaFin: string;
  resultado?: RespuestaGemini;
} 