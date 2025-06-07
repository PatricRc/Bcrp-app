import { IndicadorBCRP } from "./types";

/**
 * Constantes de la API del BCRP
 */
export const BCRP_API_URL = process.env.BCRP_API_URL || 'https://estadisticas.bcrp.gob.pe/estadisticas/series/api';
export const FORMATO_API = 'json';
export const IDIOMA_API = 'esp';

// Agregar una constante para determinar si estamos en desarrollo
export const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';

/**
 * Colores para gráficos
 */
export const COLORES_GRAFICOS = {
  primario: "#2563eb", // Azul principal
  secundario: "#f97316", // Naranjo
  acento1: "#16a34a", // Verde
  acento2: "#9333ea", // Púrpura
  gris: "#9ca3af", // Gris para elementos desactivados
};

/**
 * Lista de indicadores diarios
 */
export const INDICADORES_DIARIOS: IndicadorBCRP[] = [
  { 
    codigo: 'PD04650MD', 
    nombre: 'Reservas internacionales netas', 
    frecuencia: 'diario',
    unidad: 'US$ millones'
  },
  { 
    codigo: 'PD12301MD', 
    nombre: 'Tasa de Referencia de la Política Monetaria', 
    frecuencia: 'diario',
    unidad: '%'
  },
  { 
    codigo: 'PD04692MD', 
    nombre: 'Tasa de Interés Interbancaria, S/', 
    frecuencia: 'diario',
    unidad: '%'
  },
  { 
    codigo: 'PD04693MD', 
    nombre: 'Tasa de Interés Interbancaria, US$', 
    frecuencia: 'diario',
    unidad: '%'
  },
  { 
    codigo: 'PD04637PD', 
    nombre: 'Tipo de Cambio - Compra', 
    frecuencia: 'diario',
    unidad: 'S/ por US$'
  },
  { 
    codigo: 'PD04638PD', 
    nombre: 'Tipo de Cambio - Venta', 
    frecuencia: 'diario',
    unidad: 'S/ por US$'
  },
  { 
    codigo: 'PD38026MD', 
    nombre: 'Índice General Bursátil BVL (índice)', 
    frecuencia: 'diario',
    unidad: 'índice'
  },
  { 
    codigo: 'PD04694MD', 
    nombre: 'Índice General Bursátil BVL (var%)', 
    frecuencia: 'diario',
    unidad: '%'
  },
  { 
    codigo: 'PD04701XD', 
    nombre: 'Cobre (Londres, cUS$ por libras)', 
    frecuencia: 'diario',
    unidad: 'cUS$ por libras'
  },
  { 
    codigo: 'PD04704XD', 
    nombre: 'Oro (Londres, US$ por onzas troy)', 
    frecuencia: 'diario',
    unidad: 'US$ por onzas troy'
  },
  { 
    codigo: 'PD04721XD', 
    nombre: 'Dow Jones (var%)', 
    frecuencia: 'diario',
    unidad: '%'
  }
];

/**
 * Lista de indicadores mensuales
 */
export const INDICADORES_MENSUALES: IndicadorBCRP[] = [
  { 
    codigo: 'PN38705PM', 
    nombre: 'Índice de Precios al Consumidor (IPC)', 
    frecuencia: 'mensual',
    unidad: 'índice'
  },
  { 
    codigo: 'PN01271PM', 
    nombre: 'IPC var%', 
    frecuencia: 'mensual',
    unidad: '%'
  },
  { 
    codigo: 'PN01496BM', 
    nombre: 'Exportaciones Total', 
    frecuencia: 'mensual',
    unidad: 'US$ millones'
  },
  { 
    codigo: 'PN02294FM', 
    nombre: 'Ingresos Tributarios', 
    frecuencia: 'mensual',
    unidad: 'millones S/'
  },
  { 
    codigo: 'PN38072FM', 
    nombre: 'Gasto Total del Gobierno General', 
    frecuencia: 'mensual',
    unidad: 'millones S/'
  }
];

/**
 * Lista de indicadores anuales
 */
export const INDICADORES_ANUALES: IndicadorBCRP[] = [
  { 
    codigo: 'PM04908AA', 
    nombre: 'PBI Anual (Nivel)', 
    frecuencia: 'anual',
    unidad: 'millones S/'
  },
  { 
    codigo: 'PM05373BA', 
    nombre: 'PBI Anual (Var%)', 
    frecuencia: 'anual',
    unidad: '%'
  }
];

// Formatos de exportación disponibles
export const FORMATOS_EXPORTACION = ["PDF", "EXCEL", "CSV"]

// Períodos de tiempo predefinidos
export const PERIODOS_PREDEFINIDOS = [
  { valor: "1M", etiqueta: "1 Mes" },
  { valor: "3M", etiqueta: "3 Meses" },
  { valor: "6M", etiqueta: "6 Meses" },
  { valor: "1Y", etiqueta: "1 Año" },
  { valor: "2Y", etiqueta: "2 Años" },
  { valor: "5Y", etiqueta: "5 Años" },
  { valor: "MAX", etiqueta: "Máximo" },
] 