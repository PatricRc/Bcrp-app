import { FORMATO_API, IDIOMA_API } from "../constants";
import { DatoSerie, RespuestaBCRP } from "../types";
import { replaceZerosAndNullsWithAverage } from "../utils";
import { supabase } from "./supabase-service";

/**
 * Obtiene los datos de un indicador en un rango de fechas
 * @param codigo - Código del indicador BCRP
 * @param fechaInicio - Fecha de inicio en formato yyyy-mm (ej: 2020-01) o yyyy-mm-dd
 * @param fechaFin - Fecha de fin en formato yyyy-mm (ej: 2024-12) o yyyy-mm-dd
 * @returns - Datos del indicador formateados
 */
export async function obtenerDatosIndicador(
  codigo: string,
  fechaInicio: string,
  fechaFin: string
): Promise<RespuestaBCRP> {
  // Definimos un array donde guardaremos los errores para diagnóstico
  const errores: string[] = [];
  
  try {
    // Verificar primero si tenemos datos en caché
    try {
      const datosCacheados = await obtenerDeCache(codigo);
      if (datosCacheados) {
        console.log(`Usando datos en caché para ${codigo}`);
        // Aplicar limpieza de datos incluso a datos cacheados
        const datosLimpios = replaceZerosAndNullsWithAverage(datosCacheados.datos);
        return {
          ...datosCacheados,
          datos: datosLimpios
        };
      }
    } catch (cacheError) {
      console.log(`No hay datos en caché para ${codigo} o la tabla no existe aún`);
      // Continuamos con la petición a la API
    }

    // Construir URL de nuestro proxy API en lugar de llamar directamente a la API del BCRP
    // Esto evita problemas de CORS
    const url = `/api/bcrp?codigo=${codigo}&fechaInicio=${fechaInicio}&fechaFin=${fechaFin}&formato=${FORMATO_API}&idioma=${IDIOMA_API}`;
    
    console.log(`Consultando API proxy: ${url}`);
    
    // Aumentamos el timeout a 30 segundos para dar más tiempo a la API
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos de timeout
    
    try {
      // Primera estrategia: Consultar con rango de fechas
      const response = await fetch(url, { 
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        errores.push(`Error HTTP: ${response.status} en solicitud con fechas`);
        
        if (response.status === 403) {
          console.warn('Detectado error 403, posible problema de acceso a la API');
        }
        
        throw new Error(`Error HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Validar y formatear la respuesta según el formato de la API BCRP
      if (!data || !data.periods || !data.periods.length) {
        errores.push('La respuesta de la API no contiene datos válidos');
        throw new Error('La respuesta de la API no contiene datos válidos');
      }
      
      console.log('Datos recibidos correctamente de la API');
      
      // Transformar datos al formato que usamos internamente
      const datosSerie: DatoSerie[] = data.periods.map((periodo: any) => {
        return {
          fecha: periodo.name,
          valor: parseFloat(periodo.values[0]) || 0
        };
      });

      // Aplicar limpieza de datos: reemplazar 0s y nulls con el promedio de la serie
      console.log(`Aplicando limpieza de datos para ${codigo}`);
      const datosLimpios = replaceZerosAndNullsWithAverage(datosSerie);
      
      const respuesta = {
        codigo,
        nombre: data.config?.series?.[0]?.name || data.config?.title || codigo,
        datos: datosLimpios
      };

      // Guardar en caché de Supabase
      try {
        await guardarEnCache(codigo, respuesta);
        console.log(`Datos de ${codigo} guardados en caché`);
      } catch (cacheError) {
        console.warn('Error al guardar en caché:', cacheError);
        // No lanzamos error para continuar con el flujo
      }
      
      return respuesta;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      errores.push(`Error en fetch principal: ${(fetchError as Error).message}`);
      console.error('Error en fetch principal:', fetchError);
      throw fetchError;
    }
  } catch (error) {
    console.error('Error al obtener datos del BCRP:', error);
    errores.push(`Error general: ${(error as Error).message}`);
    
    // Segunda estrategia: Intentar sin usar signal/timeout que puede estar causando problemas
    try {
      console.log(`Intentando URL alternativa sin usar AbortController para ${codigo}`);
      const urlAlternativa = `/api/bcrp?codigo=${codigo}&formato=${FORMATO_API}&idioma=${IDIOMA_API}`;
      
      const respuestaAlt = await fetch(urlAlternativa, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      if (respuestaAlt.ok) {
        const dataAlt = await respuestaAlt.json();
        
        if (dataAlt && dataAlt.periods && dataAlt.periods.length > 0) {
          console.log('Datos recibidos correctamente de la API alternativa');
          
          const datosSerieAlt: DatoSerie[] = dataAlt.periods.map((periodo: any) => {
            return {
              fecha: periodo.name,
              valor: parseFloat(periodo.values[0]) || 0
            };
          });

          // Aplicar limpieza de datos también en la estrategia alternativa
          console.log(`Aplicando limpieza de datos (estrategia alternativa) para ${codigo}`);
          const datosLimpiosAlt = replaceZerosAndNullsWithAverage(datosSerieAlt);
          
          const respuestaAlt = {
            codigo,
            nombre: dataAlt.config?.series?.[0]?.name || dataAlt.config?.title || codigo,
            datos: datosLimpiosAlt
          };
          
          try {
            await guardarEnCache(codigo, respuestaAlt);
          } catch (cacheError) {
            console.warn('Error al guardar datos alternativos en caché:', cacheError);
            // Continuamos incluso si la caché falla
          }
          
          return respuestaAlt;
        }
      } else {
        errores.push(`Error HTTP ${respuestaAlt.status} en solicitud alternativa sin fechas`);
      }
    } catch (altError) {
      console.error('Error con URL alternativa:', altError);
      errores.push(`Error en solicitud alternativa: ${(altError as Error).message}`);
      // Fallamos silenciosamente para probar el siguiente enfoque
    }
    
    // Tercera estrategia: Intentar consultar la API usando un proxy CORS si estamos en el cliente
    if (typeof window !== 'undefined') {
      try {
        console.log(`Intentando consulta a través de proxy CORS para ${codigo}`);
        
        // Usamos un proxy CORS público como workaround (solo para desarrollo)
        const corsProxyUrl = 'https://corsproxy.io/?';
        const bcrpUrl = `https://estadisticas.bcrp.gob.pe/estadisticas/series/api/${codigo}/${FORMATO_API}/${IDIOMA_API}`;
        const urlProxied = corsProxyUrl + encodeURIComponent(bcrpUrl);
        
        const respuestaProxied = await fetch(urlProxied, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            'Origin': 'https://estadisticas.bcrp.gob.pe', 
            'Referer': 'https://estadisticas.bcrp.gob.pe/estadisticas/series/',
          }
        });
        
        if (respuestaProxied.ok) {
          const dataProxied = await respuestaProxied.json();
          
          if (dataProxied && dataProxied.periods && dataProxied.periods.length > 0) {
            console.log('Datos recibidos correctamente a través del proxy CORS');
            
            const datosSerieProxied: DatoSerie[] = dataProxied.periods.map((periodo: any) => {
              return {
                fecha: periodo.name,
                valor: parseFloat(periodo.values[0]) || 0
              };
            });

            // Aplicar limpieza de datos también en la estrategia de proxy
            console.log(`Aplicando limpieza de datos (proxy CORS) para ${codigo}`);
            const datosLimpiosProxied = replaceZerosAndNullsWithAverage(datosSerieProxied);
            
            const respuestaProxied = {
              codigo,
              nombre: dataProxied.config?.series?.[0]?.name || dataProxied.config?.title || codigo,
              datos: datosLimpiosProxied
            };
            
            try {
              await guardarEnCache(codigo, respuestaProxied);
            } catch (cacheError) {
              console.warn('Error al guardar datos del proxy en caché:', cacheError);
            }
            
            return respuestaProxied;
          }
        } else {
          errores.push(`Error HTTP ${respuestaProxied.status} en solicitud a través de proxy CORS`);
        }
      } catch (proxyError) {
        console.error('Error con proxy CORS:', proxyError);
        errores.push(`Error en solicitud a través de proxy CORS: ${(proxyError as Error).message}`);
      }
    }
    
    // Como último recurso, intentamos devolver datos de la caché incluso si están desactualizados
    try {
      console.log("Intentando recuperar datos potencialmente desactualizados de la caché");
      const datosDesactualizados = await obtenerDeCacheForzado(codigo);
      if (datosDesactualizados) {
        console.warn(`Usando datos potencialmente desactualizados para ${codigo} como último recurso`);
        // Aplicar limpieza de datos incluso a datos desactualizados
        const datosLimpios = replaceZerosAndNullsWithAverage(datosDesactualizados.datos);
        return {
          ...datosDesactualizados,
          datos: datosLimpios
        };
      }
    } catch (cacheForceError) {
      console.error("Error al intentar recuperar datos desactualizados:", cacheForceError);
    }
    
    // Si llegamos aquí, no pudimos obtener datos de ninguna manera
    // Incluir información de diagnóstico en el mensaje de error
    const mensajeError = `No se pudieron obtener datos para el indicador ${codigo}. Errores encontrados: ${errores.join(' | ')}`;
    console.error(mensajeError);
    throw new Error(`No se pudieron obtener datos para el indicador ${codigo}`);
  }
}

/**
 * Guarda los datos de un indicador en la caché de Supabase
 */
async function guardarEnCache(codigo: string, datos: RespuestaBCRP): Promise<void> {
  try {
    // Verificar si Supabase está disponible
    if (!supabase) {
      console.warn('Cliente Supabase no disponible para caché');
      return;
    }

    // Comprobar si podemos acceder a la tabla de caché
    try {
      // Intentar insertar/actualizar directamente, sin verificar la existencia de la tabla
      const { error } = await supabase
        .from('indicadores_cache')
        .upsert({
          codigo,
          datos,
          ultima_actualizacion: new Date().toISOString()
        }, {
          onConflict: 'codigo'
        });
      
      if (error) {
        // Si el error es por tabla inexistente, lo registramos pero no lo propagamos como error a la UI
        if (error.message && error.message.includes('does not exist')) {
          console.log('Tabla de caché no existe. Se omite el guardado en caché.');
        } else {
          console.warn('Error al guardar en caché:', error);
        }
        // No interrumpimos el flujo principal de la aplicación
        return;
      }
      
      console.log(`Datos de ${codigo} guardados en caché correctamente`);
    } catch (error) {
      // Capturamos cualquier error durante el proceso de caché pero no lo propagamos
      console.warn('Error durante proceso de caché:', error);
    }
  } catch (error) {
    // Error general en la función
    console.warn('Error en guardarEnCache:', error);
    // No propagamos el error para que la aplicación funcione sin caché
  }
}

/**
 * Obtiene los datos de un indicador desde la caché de Supabase
 */
async function obtenerDeCache(codigo: string): Promise<RespuestaBCRP | null> {
  try {
    // Verificar si Supabase está disponible
    if (!supabase) {
      console.warn('Cliente Supabase no disponible para caché');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('indicadores_cache')
        .select('datos')
        .eq('codigo', codigo)
        .maybeSingle();
      
      if (error) {
        // Si es un error de "tabla no existe", lo manejamos silenciosamente
        if (error.message && error.message.includes('does not exist')) {
          console.log('Tabla de caché no existe. Continuando sin cache.');
          return null;
        }
        console.warn('Error al obtener de caché:', error);
        return null;
      }
      
      if (data && data.datos) {
        console.log(`Datos obtenidos de caché para ${codigo}`);
        return data.datos;
      }
      
      return null;
    } catch (queryError) {
      console.warn('Error al consultar caché:', queryError);
      return null;
    }
  } catch (error) {
    console.warn('Error en obtenerDeCache:', error);
    return null; // Retornamos null en lugar de propagar el error
  }
}

/**
 * Obtiene datos de caché forzadamente, ignorando fechas de expiración
 */
async function obtenerDeCacheForzado(codigo: string): Promise<RespuestaBCRP | null> {
  if (!supabase) return null;
  
  try {
    const { data, error } = await supabase
      .from('indicadores_cache')
      .select('datos')
      .eq('codigo', codigo)
      .single();
    
    if (error) throw error;
    
    return data?.datos as RespuestaBCRP;
  } catch (error) {
    console.warn(`No se pudieron recuperar datos de caché para ${codigo}:`, error);
    return null;
  }
}

/**
 * Obtiene los datos de múltiples indicadores en un rango de fechas
 * @param codigos - Lista de códigos de indicadores BCRP
 * @param fechaInicio - Fecha de inicio en formato yyyy-mm (ej: 2020-01) o yyyy-mm-dd
 * @param fechaFin - Fecha de fin en formato yyyy-mm (ej: 2024-12) o yyyy-mm-dd
 * @returns - Lista de datos de indicadores formateados
 */
export async function obtenerMultiplesIndicadores(
  codigos: string[],
  fechaInicio: string,
  fechaFin: string
): Promise<RespuestaBCRP[]> {
  const promesas = codigos.map(codigo => 
    obtenerDatosIndicador(codigo, fechaInicio, fechaFin)
      .catch(error => {
        console.error(`Error al obtener datos para ${codigo}:`, error);
        return null;
      })
  );
  
  const resultados = await Promise.all(promesas);
  return resultados.filter(Boolean) as RespuestaBCRP[];
}

/**
 * Obtiene los datos más recientes de indicadores diarios
 * @param codigos - Lista de códigos de indicadores BCRP
 * @returns - Lista de datos de indicadores formateados con los datos más recientes
 */
export async function obtenerIndicadoresDiariosRecientes(codigos: string[]): Promise<RespuestaBCRP[]> {
  // Para datos diarios, usamos un endpoint sin fechas para obtener los más recientes
  const promesas = codigos.map(codigo => {
    // Construir URL sin fechas para obtener los más recientes
    const url = `/api/bcrp?codigo=${codigo}&formato=${FORMATO_API}&idioma=${IDIOMA_API}`;
    
    return fetch(url, {
      headers: {
        'Accept': 'application/json'
      },
      signal: AbortSignal.timeout(10000)
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      if (!data || !data.periods || !data.periods.length) {
        throw new Error('La respuesta de la API no contiene datos válidos');
      }
      
      // Solo nos quedamos con los últimos 30 datos para series diarias
      const limitedPeriods = data.periods.slice(-30);
      
      const datosSerie = limitedPeriods.map((periodo: any) => {
        return {
          fecha: periodo.name,
          valor: parseFloat(periodo.values[0]) || 0
        };
      });

      // Aplicar limpieza de datos para indicadores diarios recientes
      console.log(`Aplicando limpieza de datos (recientes) para ${codigo}`);
      const datosLimpios = replaceZerosAndNullsWithAverage(datosSerie);
      
      return {
        codigo,
        nombre: data.config?.series?.[0]?.name || data.config?.title || codigo,
        datos: datosLimpios
      };
    })
    .catch(error => {
      console.error(`Error al obtener datos recientes para ${codigo}:`, error);
      return null;
    });
  });
  
  const resultados = await Promise.all(promesas);
  return resultados.filter(Boolean) as RespuestaBCRP[];
} 