import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { DatoSerie } from "./types"

/**
 * Combina clases de Tailwind con clsx y tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formatea una fecha para mostrarla en español
 */
export function formatFecha(fecha: Date): string {
  return fecha.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

/**
 * Formatea un número como moneda Soles (S/)
 */
export function formatSoles(valor: number): string {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2
  }).format(valor);
}

/**
 * Formatea un número como moneda dólares (US$)
 */
export function formatDolares(valor: number): string {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(valor);
}

/**
 * Formatea un número como porcentaje
 */
export function formatPorcentaje(valor: number): string {
  return new Intl.NumberFormat('es-PE', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(valor / 100);
}

/**
 * Reemplaza valores 0 o null en una serie de datos con el promedio de los valores válidos de la serie.
 * Esto evita caídas artificiales en los gráficos que no tienen sentido económico.
 * 
 * @param datos - Array de datos de serie temporal
 * @returns Array de datos con valores 0/null reemplazados por el promedio
 */
export function replaceZerosAndNullsWithAverage(datos: DatoSerie[]): DatoSerie[] {
  if (!datos || datos.length === 0) {
    return datos;
  }

  // Obtener todos los valores válidos (diferentes de 0, null, undefined, NaN)
  const valoresValidos = datos
    .map(d => d.valor)
    .filter(valor => valor !== null && valor !== undefined && valor !== 0 && !isNaN(valor));

  // Si no hay valores válidos, retornar los datos originales
  if (valoresValidos.length === 0) {
    console.warn('No se encontraron valores válidos para calcular promedio');
    return datos;
  }

  // Calcular el promedio de los valores válidos
  const promedio = valoresValidos.reduce((sum, valor) => sum + valor, 0) / valoresValidos.length;

  console.log(`Reemplazando ${datos.length - valoresValidos.length} valores 0/null con promedio: ${promedio.toFixed(4)}`);

  // Reemplazar valores 0, null, undefined o NaN con el promedio
  return datos.map(dato => ({
    ...dato,
    valor: (dato.valor === null || dato.valor === undefined || dato.valor === 0 || isNaN(dato.valor)) 
      ? promedio 
      : dato.valor
  }));
}

/**
 * Aplica suavizado a una serie de datos para reducir fluctuaciones extremas.
 * Útil para datos que pueden tener errores puntuales en la fuente.
 * 
 * @param datos - Array de datos de serie temporal
 * @param ventana - Tamaño de la ventana para el promedio móvil (por defecto 3)
 * @returns Array de datos suavizados
 */
export function smoothDataSeries(datos: DatoSerie[], ventana: number = 3): DatoSerie[] {
  if (!datos || datos.length === 0 || ventana <= 1) {
    return datos;
  }

  const datosOrdenados = [...datos].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
  
  return datosOrdenados.map((dato, index) => {
    // Para los primeros y últimos elementos, usar menos ventana
    const inicio = Math.max(0, index - Math.floor(ventana / 2));
    const fin = Math.min(datosOrdenados.length, index + Math.floor(ventana / 2) + 1);
    
    const valoresVentana = datosOrdenados.slice(inicio, fin)
      .map(d => d.valor)
      .filter(v => v !== null && v !== undefined && !isNaN(v));
    
    if (valoresVentana.length === 0) {
      return dato;
    }
    
    const promedioVentana = valoresVentana.reduce((sum, val) => sum + val, 0) / valoresVentana.length;
    
    return {
      ...dato,
      valor: promedioVentana
    };
  });
}

/**
 * Detecta y reemplaza outliers extremos en una serie de datos
 * 
 * @param datos - Array de datos de serie temporal
 * @param threshold - Umbral de desviación estándar para considerar outlier (por defecto 3)
 * @returns Array de datos con outliers reemplazados
 */
export function handleOutliers(datos: DatoSerie[], threshold: number = 3): DatoSerie[] {
  if (!datos || datos.length < 3) {
    return datos;
  }

  const valores = datos.map(d => d.valor).filter(v => v !== null && v !== undefined && !isNaN(v));
  
  if (valores.length < 3) {
    return datos;
  }

  // Calcular media y desviación estándar
  const media = valores.reduce((sum, val) => sum + val, 0) / valores.length;
  const varianza = valores.reduce((sum, val) => sum + Math.pow(val - media, 2), 0) / valores.length;
  const desviacionEstandar = Math.sqrt(varianza);

  const limiteInferior = media - (threshold * desviacionEstandar);
  const limiteSuperior = media + (threshold * desviacionEstandar);

  let outliersDetectados = 0;

  const datosCorregidos = datos.map(dato => {
    if (dato.valor !== null && dato.valor !== undefined && !isNaN(dato.valor)) {
      if (dato.valor < limiteInferior || dato.valor > limiteSuperior) {
        outliersDetectados++;
        return {
          ...dato,
          valor: media // Reemplazar outlier con la media
        };
      }
    }
    return dato;
  });

  if (outliersDetectados > 0) {
    console.log(`Detectados y corregidos ${outliersDetectados} outliers en la serie`);
  }

  return datosCorregidos;
}
