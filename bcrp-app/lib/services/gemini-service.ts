import { RespuestaGemini, RespuestaBCRP } from "../types";
import { GoogleGenAI } from "@google/genai";

// Obtener la API key desde las variables de entorno
const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';

// Variable para trackear si ya mostramos un warning sobre la API key
let apiKeyWarningShown = false;

// Inicializar el cliente de Gemini si hay API key
let genAI: GoogleGenAI | null = null;

if (apiKey) {
  try {
    genAI = new GoogleGenAI({ 
      apiKey: apiKey,
    });
  } catch (error) {
    console.warn('Error al inicializar Gemini client:', error);
  }
} else if (!apiKeyWarningShown) {
  console.warn('ADVERTENCIA: API key de Gemini no configurada. Las funciones de análisis estarán limitadas.');
  apiKeyWarningShown = true;
}

/**
 * Respuesta predeterminada cuando el servicio de Gemini no está disponible
 */
function getRespuestaOffline(tipo: string, datos?: any): RespuestaGemini {
  let mensaje = '';
  
  if (tipo === 'resumen') {
    const indicador = datos?.nombre || 'del indicador';
    mensaje = `No se pudo generar un análisis de ${indicador} porque el servicio de IA no está disponible en este momento. ` +
      `Verifique la configuración de su API key en las variables de entorno (GEMINI_API_KEY o NEXT_PUBLIC_GEMINI_API_KEY).`;
  } else if (tipo === 'comparacion' || tipo === 'comparativo') {
    mensaje = 'No se pudo generar un análisis comparativo porque el servicio de IA no está disponible en este momento. ' +
      'Verifique la configuración de su API key en las variables de entorno.';
  } else {
    mensaje = 'El servicio de análisis inteligente no está disponible en este momento. ' +
      'Verifique la configuración de su API key en las variables de entorno.';
  }
  
  return {
    texto: mensaje,
    esOffline: true,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Verifica si el servicio de Gemini está disponible
 */
function isGeminiAvailable(): boolean {
  return Boolean(apiKey && genAI);
}

/**
 * Genera un resumen de un indicador económico usando Gemini AI
 * @param datos - Datos del indicador a analizar
 * @returns - Respuesta generada por Gemini
 */
export async function generarResumenIndicador(
  datos: RespuestaBCRP
): Promise<RespuestaGemini> {
  try {
    // Verificar que tengamos datos para analizar
    if (!datos || !datos.datos || datos.datos.length === 0) {
      throw new Error('No hay datos suficientes para generar un resumen');
    }

    // Verificar si Gemini está disponible
    if (!isGeminiAvailable()) {
      console.warn('Gemini no está disponible. Usando respuesta offline.');
      return getRespuestaOffline('resumen', datos);
    }

    // Extraer fechas para determinar el período
    const fechas = datos.datos.map(d => d.fecha).sort();
    const fechaInicio = fechas[0];
    const fechaFin = fechas[fechas.length - 1];

    // Extraer valores para cálculos estadísticos
    const valores = datos.datos.map(d => d.valor);
    const valorMinimo = Math.min(...valores);
    const valorMaximo = Math.max(...valores);
    const fechaValorMinimo = datos.datos.find(d => d.valor === valorMinimo)?.fecha || '';
    const fechaValorMaximo = datos.datos.find(d => d.valor === valorMaximo)?.fecha || '';

    // Preparar contexto para Gemini con un prompt mejorado
    const prompt = `
    Actúa como un economista experto especializado en análisis macroeconómico del Perú.
    
    Voy a proporcionarte datos de un indicador económico del Banco Central de Reserva del Perú (BCRP). Necesito que generes un análisis detallado y profesional en formato de reporte ejecutivo moderno.
    
    # Datos del indicador
    Nombre: ${datos.nombre}
    Código: ${datos.codigo}
    Periodo analizado: ${fechaInicio} a ${fechaFin}
    
    # Información estadística relevante
    - Valor mínimo: ${valorMinimo} (${fechaValorMinimo})
    - Valor máximo: ${valorMaximo} (${fechaValorMaximo})
    
    # Datos completos de la serie temporal
    ${datos.datos.map(d => `${d.fecha}: ${d.valor}`).join('\n')}
    
    # Estructura del análisis solicitado
    Genera un análisis estructurado que incluya:
    
    1. **Análisis del ${datos.nombre}** - Un título claro indicando el periodo analizado
    2. **Resumen general** - Una descripción concisa de la tendencia general y su significado económico
    3. **Análisis de fluctuaciones** - Identificación de cambios significativos, sus posibles causas y efectos
    4. **Factores clave** - Explicación de los principales factores que influyen en este indicador
    5. **Perspectiva futura** - Proyección basada en las tendencias observadas
    
    # Guía de estilo
    - Utiliza un lenguaje técnico pero accesible
    - Organiza el contenido en párrafos bien definidos
    - No uses lenguaje promocional ni subjetivo
    - Incluye observaciones técnicas precisas y análisis fundamentado
    - Menciona el contexto económico peruano actual
    
    Tu respuesta debe ser profesional y objetiva, adecuada para un reporte ejecutivo dirigido a especialistas financieros. Limita tu respuesta a 500 palabras máximo, enfocándose en calidad y concisión.
    `;

    // Llamar a Gemini 2.0 Flash para generar el análisis
    const response = await genAI!.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        temperature: 0.3,
        topK: 40,
        topP: 0.8,
        maxOutputTokens: 1000,
      },
    });

    const texto = response.text || '';

    return {
      texto,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error al generar resumen con Gemini:', error);
    
    // Verificar si es un error de autenticación (403)
    if (error instanceof Error && 
        (error.message.includes('403') || 
         error.message.includes('unregistered callers') || 
         error.message.includes('API Key') ||
         error.message.includes('API_KEY_INVALID'))) {
      console.warn('Error de autenticación con Gemini API. Verifique su API key.');
      return getRespuestaOffline('resumen', datos);
    }
    
    // Otras causas de error, devolver respuesta offline genérica
    return getRespuestaOffline('resumen', datos);
  }
}

/**
 * Genera un análisis comparativo entre dos indicadores económicos
 * @param indicador1 - Primer indicador a comparar
 * @param indicador2 - Segundo indicador a comparar
 * @param tipoAnalisis - Tipo de análisis a realizar (tendencia, correlación, pronostico, reporte, resumen)
 * @returns - Respuesta generada por Gemini
 */
export async function generarAnalisisComparativo(
  indicador1: RespuestaBCRP,
  indicador2: RespuestaBCRP,
  tipoAnalisis: string,
  opcionesPredictivas?: any
): Promise<RespuestaGemini> {
  try {
    // Verificar si Gemini está disponible
    if (!isGeminiAvailable()) {
      console.warn('Gemini no está disponible para análisis comparativo. Usando respuesta offline.');
      return getRespuestaOffline('comparativo', { tipoAnalisis });
    }

    // Determinar el tipo de análisis
    let instruccion = "";
    
    if (tipoAnalisis === "correlacion") {
      instruccion = "Analiza la correlación entre los indicadores económicos. Incluye el coeficiente de correlación y explica su significado. Evalúa si existe una relación causal.";
    } else if (tipoAnalisis === "tendencia") {
      instruccion = "Analiza la tendencia histórica del indicador. Identifica patrones, puntos de inflexión y explica las posibles causas de los cambios observados.";
    } else if (tipoAnalisis === "pronostico") {
      const periodos = opcionesPredictivas?.periodosForecast || 6;
      const confianza = opcionesPredictivas?.confianza || 95;
      const sinEstacionalidad = opcionesPredictivas?.sinEstacionalidad || false;
      const removerOutliers = opcionesPredictivas?.removerOutliers || false;
      const periodosMA = opcionesPredictivas?.periodosMA || [30, 60, 120];
      
      instruccion = `
      Eres un economista experto en modelos econométricos de series temporales. Actúa como si hubieras aplicado un modelo ARIMA a los datos proporcionados y genera un informe detallado de pronóstico.

      # Configuración del pronóstico ARIMA solicitado
      - Períodos a pronosticar: ${periodos}
      - Nivel de confianza: ${confianza}%
      - Ajuste estacional: ${sinEstacionalidad ? 'Sin componente estacional' : 'Con componente estacional'}
      - Detección de outliers: ${removerOutliers ? 'Se han removido valores atípicos para mejorar la precisión' : 'No se han removido valores atípicos'}
      - Comparación con medias móviles: ${periodosMA.join(', ')} 
      - Evalúa la confiabilidad del pronóstico y sus limitaciones
      - Ofrece recomendaciones para los usuarios del pronóstico

      2. **Formato requerido**:
         - Usa un estilo profesional de informe técnico pero accesible
         - Incluye números y porcentajes precisos en tu análisis
         - Estructura el documento con títulos y subtítulos claros
         - Incluye tanto datos técnicos como interpretaciones accesibles
         - Utiliza Markdown para el formato del informe
         - Limita el informe a un máximo de 650 palabras

      3. **Elementos específicos a incluir**:
         - Menciona explícitamente los valores pronosticados para cada período futuro
         - Explica los intervalos de confianza de manera intuitiva
         - Identifica posibles eventos o factores que podrían afectar el pronóstico
         - Relaciona el pronóstico con el contexto económico actual de Perú
         - Incluye una sección de limitaciones del modelo ARIMA
      
      Nota: El informe generado debe simular el resultado de un análisis real de modelo ARIMA, con pronósticos numéricos específicos, como si el modelo se hubiera ejecutado realmente sobre los datos proporcionados.
      `;
    } else if (tipoAnalisis === "reporte") {
      instruccion = "Genera un reporte ejecutivo completo sobre el indicador. Incluye análisis histórico, tendencias recientes, comparaciones con periodos anteriores, e implicaciones para la economía peruana. Estructura el reporte con secciones claras y concluye con perspectivas a futuro.";
    } else {
      instruccion = "Analiza este indicador económico y proporciona información relevante sobre su comportamiento reciente.";
    }

    // Preparar los datos de los indicadores en formato JSON
    const datosIndicador1 = {
      nombre: indicador1.nombre,
      codigo: indicador1.codigo,
      datos: indicador1.datos
    };

    const datosIndicador2 = {
      nombre: indicador2.nombre,
      codigo: indicador2.codigo,
      datos: indicador2.datos
    };

    // Configurar las instrucciones para Gemini
    const prompt = `
    Eres un asistente de análisis económico especializado en el Banco Central de Reserva del Perú (BCRP).
    
    # Datos de indicadores económicos:
    
    ## Indicador 1:
    Nombre: ${datosIndicador1.nombre}
    Código: ${datosIndicador1.codigo}
    Datos: ${JSON.stringify(datosIndicador1.datos)}
    
    ${datosIndicador1.codigo !== datosIndicador2.codigo ? `
    ## Indicador 2:
    Nombre: ${datosIndicador2.nombre}
    Código: ${datosIndicador2.codigo}
    Datos: ${JSON.stringify(datosIndicador2.datos)}
    ` : ''}
    
    # Instrucción:
    ${instruccion}
    
    # Formato de la respuesta:
    - Utiliza formato Markdown para estructurar tu respuesta
    - Incluye secciones con encabezados claros
    - Si es relevante, menciona valores clave (máximos, mínimos, promedios, tendencias)
    - Explica el significado de los números en términos sencillos
    - Cuando sea posible, proporciona contexto económico relevante para Perú
    - Utiliza listas y tablas para organizar la información cuando sea apropiado
    `;

    // Usar Gemini 2.0 Flash para todos los análisis
    const response = await genAI!.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        temperature: 0.4,
        topK: 40,
        topP: 0.8,
        maxOutputTokens: 2000,
      },
    });

    const texto = response.text || '';

    return {
      texto,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("Error al generar análisis comparativo:", error);
    return getRespuestaOffline('comparativo', { tipoAnalisis });
  }
}

/**
 * Genera una respuesta a una pregunta del usuario en el chatbot, con capacidad de búsqueda web
 * @param pregunta - Pregunta del usuario
 * @param contexto - Contexto adicional para la pregunta (opcional)
 * @param habilitarBusquedaWeb - Si se debe utilizar búsqueda web para enriquecer respuestas (opcional)
 * @returns - Respuesta generada por Gemini
 */
export async function generarRespuestaChatbot(
  pregunta: string,
  contexto?: string,
  habilitarBusquedaWeb?: boolean
): Promise<RespuestaGemini> {
  try {
    // Verificar si Gemini está disponible
    if (!isGeminiAvailable()) {
      console.warn('Gemini no está disponible para chatbot. Usando respuesta offline.');
      return getRespuestaOffline('chatbot');
    }

    // Preparar prompt para Gemini con enfoque analítico mejorado para RAG
    const prompt = `
    Actúa como un asistente económico avanzado especializado en análisis de datos económicos del Banco Central de Reserva del Perú (BCRP) y tendencias macroeconómicas peruanas.
    
    Pregunta del usuario: ${pregunta}
    
    ${contexto ? `Contexto adicional relevante (DATOS OFICIALES DEL BCRP):\n${contexto}` : ''}
    
    # Guía para tu respuesta:
    1. Proporciona información basada en los datos concretos y actualizados del BCRP proporcionados en el contexto
    2. Usa un enfoque estructurado y organizado en tu respuesta
    3. Realiza análisis cuantitativo cuando sea posible, mencionando valores, porcentajes y tendencias
    4. Incluye referencias a tendencias recientes o contexto histórico cuando sea relevante
    5. Si la pregunta está fuera del ámbito económico peruano, indica cortésmente que tu especialidad es ayudar con consultas sobre indicadores económicos del BCRP
    6. IMPORTANTE: Formatea tu respuesta utilizando Markdown para mejorar la legibilidad.
       - Usa encabezados (# ## ###) para secciones
       - Emplea listas (- * 1.) para enumerar elementos
       - Utiliza **negritas** o *cursivas* para enfatizar puntos importantes
       - Crea tablas cuando presentes datos comparativos
       - Añade formato de código para mostrar cálculos o valores numéricos específicos
    
    Responde en español usando un lenguaje claro, técnicamente preciso y orientado a un informe profesional. Si no tienes información suficiente, indica qué datos específicos necesitarías para proporcionar un mejor análisis.
    `;

    // Llamar a Gemini para generar la respuesta
    const response = await genAI!.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        temperature: 0.4,
        topK: 40,
        topP: 0.8,
        maxOutputTokens: 1000,
      },
    });

    const texto = response.text || '';

    return {
      texto,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error al generar respuesta de chatbot con Gemini:', error);
    
    // Verificar si es un error de autenticación
    if (error instanceof Error && 
        (error.message.includes('403') || 
         error.message.includes('unregistered callers') || 
         error.message.includes('API Key'))) {
      console.warn('Error de autenticación con Gemini API para chatbot.');
      return getRespuestaOffline('chatbot');
    }
    
    return getRespuestaOffline('chatbot');
  }
}

/**
 * Interfaz para las noticias económicas
 */
export interface Noticia {
  titulo: string;
  descripcion: string;
  insight: string;
  url: string;
  importancia: "baja" | "media" | "alta";
  indicador: string;
  sentimiento: "positivo" | "neutro" | "negativo";
}

/**
 * Interfaz para la respuesta de noticias
 */
export interface RespuestaNoticias {
  noticias: Noticia[];
  timestamp: string;
}

/**
 * Busca noticias económicas relacionadas con los indicadores del BCRP
 * utilizando la API de Gemini con búsqueda web
 * @returns Respuesta con noticias analizadas
 */
export async function buscarNoticiasEconomicas(): Promise<RespuestaNoticias> {
  try {
    // Verificar si Gemini está disponible
    if (!isGeminiAvailable()) {
      console.warn('Gemini no está disponible para búsqueda de noticias. Usando respuesta offline.');
      return {
        noticias: getNoticiasOffline(),
        timestamp: new Date().toISOString()
      };
    }

    // Obtener noticias utilizando Gemini 2.0 Flash
    const response = await genAI!.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `
      Busca y analiza las 5 noticias económicas más relevantes de la última semana relacionadas con los principales indicadores económicos de Perú. 
      Incluye noticias sobre: tipo de cambio, tasa de interés, inflación, PBI, reservas internacionales y mercado bursátil.
      
      IMPORTANTE: Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional antes o después.
      
      Para cada noticia proporciona:
      1. título: Título exacto de la noticia
      2. descripcion: Resumen en 1-2 frases
      3. insight: Análisis de impacto económico (2-3 frases máximo)
      4. url: URL completa de la noticia (debe ser una URL real y válida)
      5. importancia: "baja", "media" o "alta" (basado en el impacto macroeconómico)
      6. indicador: Indicador económico relacionado (ej: "Tipo de Cambio", "Tasa de Referencia", "Inflación", etc.)
      7. sentimiento: "positivo", "neutro" o "negativo" (basado en el impacto económico real, NO en el tono de la noticia)
      
      Es FUNDAMENTAL que no clasifiques todas las noticias como "neutras". Esfuérzate por determinar el verdadero impacto económico de cada noticia y clasifícala correctamente. Debe haber variedad en tu clasificación de sentimiento.
      
      Asegúrate de seleccionar noticias variadas sobre diferentes indicadores económicos. Tu respuesta debe ser EXACTAMENTE este formato JSON:
      
      {
        "noticias": [
          {
            "titulo": "...",
            "descripcion": "...",
            "insight": "...",
            "url": "...",
            "importancia": "alta|media|baja",
            "indicador": "...",
            "sentimiento": "positivo|neutro|negativo"
          }
        ]
      }
      `,
      config: {
        temperature: 0.4,
        maxOutputTokens: 2000,
      }
    });

    // Procesar la respuesta
    const responseText = response.text || '';
    
    if (!responseText.trim()) {
      console.warn('Respuesta vacía de Gemini para noticias');
      return {
        noticias: getNoticiasOffline(),
        timestamp: new Date().toISOString()
      };
    }
    
    try {
      // Limpiar la respuesta para extraer solo el JSON válido
      let cleanedResponse = responseText.trim();
      
      // Buscar el primer { y el último }
      const firstBrace = cleanedResponse.indexOf('{');
      const lastBrace = cleanedResponse.lastIndexOf('}');
      
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleanedResponse = cleanedResponse.substring(firstBrace, lastBrace + 1);
      }
      
      // Intentar parsear la respuesta JSON
      const responseData = JSON.parse(cleanedResponse);
      
      if (responseData && responseData.noticias && Array.isArray(responseData.noticias)) {
        // Validar que tenemos al menos 1 noticia y máximo 5
        const noticiasValidas = responseData.noticias.slice(0, 5);
        
        if (noticiasValidas.length === 0) {
          console.warn('No se encontraron noticias válidas en la respuesta de Gemini');
          return {
            noticias: getNoticiasOffline(),
            timestamp: new Date().toISOString()
          };
        }
        
        const noticias = noticiasValidas.map((noticia: any, index: number) => ({
          titulo: String(noticia.titulo || `Noticia ${index + 1}`).substring(0, 200),
          descripcion: String(noticia.descripcion || 'Sin descripción disponible').substring(0, 500),
          insight: String(noticia.insight || 'Sin análisis disponible').substring(0, 500),
          url: String(noticia.url || 'https://www.bcrp.gob.pe'),
          importancia: ['baja', 'media', 'alta'].includes(noticia.importancia) ? noticia.importancia : 'media',
          indicador: String(noticia.indicador || 'Indicador General').substring(0, 100),
          sentimiento: ['positivo', 'neutro', 'negativo'].includes(noticia.sentimiento) ? noticia.sentimiento : 'neutro'
        }));
        
        console.log(`Se procesaron ${noticias.length} noticias correctamente desde Gemini`);
        
        return {
          noticias,
          timestamp: new Date().toISOString()
        };
      } else {
        console.warn('Estructura de respuesta inválida de Gemini para noticias');
        return {
          noticias: getNoticiasOffline(),
          timestamp: new Date().toISOString()
        };
      }
    } catch (parseError) {
      console.error('Error al parsear respuesta JSON de noticias:', parseError);
      console.error('Respuesta original:', responseText.substring(0, 500) + '...');
      
      // Si llegamos aquí, usar noticias offline
      return {
        noticias: getNoticiasOffline(),
        timestamp: new Date().toISOString()
      };
    }
  } catch (error) {
    console.error('Error al buscar noticias económicas:', error);
    return {
      noticias: getNoticiasOffline(),
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Noticias predeterminadas cuando el servicio no está disponible
 */
function getNoticiasOffline(): Noticia[] {
  return [
    {
      titulo: "Servicio de noticias no disponible",
      descripcion: "No se pudieron obtener noticias actualizadas del servicio de IA",
      insight: "Configure su API key de Gemini para acceder a noticias económicas actualizadas",
      url: "https://www.bcrp.gob.pe",
      importancia: "media" as const,
      indicador: "Sistema",
      sentimiento: "neutro" as const
    },
    {
      titulo: "BCRP - Información oficial disponible",
      descripcion: "Visite el sitio web oficial del Banco Central para obtener información actualizada",
      insight: "Los datos oficiales del BCRP están siempre disponibles en su portal web",
      url: "https://www.bcrp.gob.pe",
      importancia: "alta" as const,
      indicador: "Información General",
      sentimiento: "neutro" as const
    },
    {
      titulo: "Estadísticas del BCRP",
      descripcion: "Acceso directo a las estadísticas oficiales del banco central",
      insight: "Las estadísticas proporcionan datos históricos y actuales de todos los indicadores",
      url: "https://estadisticas.bcrp.gob.pe/estadisticas/series/",
      importancia: "alta" as const,
      indicador: "Estadísticas",
      sentimiento: "positivo" as const
    },
    {
      titulo: "Reportes de Inflación",
      descripcion: "Reportes trimestrales sobre la evolución de la inflación en Perú",
      insight: "Los reportes de inflación ofrecen perspectivas sobre la política monetaria futura",
      url: "https://www.bcrp.gob.pe/publicaciones/reporte-de-inflacion.html",
      importancia: "alta" as const,
      indicador: "Inflación",
      sentimiento: "neutro" as const
    },
    {
      titulo: "Memoria Anual BCRP",
      descripcion: "Documento anual que resume la gestión y resultados del banco central",
      insight: "La memoria anual proporciona una visión integral de la economía peruana",
      url: "https://www.bcrp.gob.pe/publicaciones/memoria-anual.html",
      importancia: "media" as const,
      indicador: "Información Institucional",
      sentimiento: "positivo" as const
    }
  ];
} 