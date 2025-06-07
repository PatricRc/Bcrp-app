import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    // Parse the URL and get query parameters
    const { searchParams } = new URL(request.url);
    const codigo = searchParams.get('codigo');
    let fechaInicio = searchParams.get('fechaInicio');
    let fechaFin = searchParams.get('fechaFin');
    const formato = searchParams.get('formato') || 'json';
    const idioma = searchParams.get('idioma') || 'esp';

    // Validate required parameters
    if (!codigo) {
      return NextResponse.json(
        { error: 'El parámetro código es obligatorio' },
        { status: 400 }
      );
    }

    // Log the requested indicator code
    console.log(`[Server] Processing request for indicator: ${codigo}`);

    // Format dates properly if needed (convert YYYY-M to YYYY-MM-DD format)
    if (fechaInicio) {
      // If the format is YYYY-M, convert to YYYY-MM-DD
      if (/^\d{4}-\d{1,2}$/.test(fechaInicio)) {
        const [year, month] = fechaInicio.split('-');
        const paddedMonth = month.padStart(2, '0');
        fechaInicio = `${year}-${paddedMonth}-01`;
      }
    }

    if (fechaFin) {
      // If the format is YYYY-M, convert to YYYY-MM-DD
      if (/^\d{4}-\d{1,2}$/.test(fechaFin)) {
        const [year, month] = fechaFin.split('-');
        const paddedMonth = month.padStart(2, '0');
        // Last day of the month
        const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
        fechaFin = `${year}-${paddedMonth}-${lastDay}`;
      }
    }

    // Special handling for PBI annual indicators which often have issues
    const isPBIIndicator = codigo === 'PM04908AA' || codigo === 'PM05373BA';
    
    // For PBI indicators, we'll try direct access to the specific endpoints that work better for these series
    if (isPBIIndicator) {
      console.log(`[Server] Using specialized handling for PBI indicator: ${codigo}`);
      const result = await fetchPBIData(codigo, formato, idioma);
      
      if (result.success) {
        return NextResponse.json(result.data);
      }
      // If specialized handling fails, we'll fall back to standard approach
      console.log(`[Server] Specialized PBI handling failed, falling back to standard approach`);
    }

    // Construct BCRP API URL
    let url = `https://estadisticas.bcrp.gob.pe/estadisticas/series/api/${codigo}/${formato}`;
    
    // Add date range if provided
    if (fechaInicio && fechaFin) {
      url += `/${fechaInicio}/${fechaFin}`;
    }
    
    // Add language
    url += `/${idioma}`;

    console.log(`[Server] Fetching from BCRP API: ${url}`);

    // Enhanced headers to mimic a browser request
    const headers = {
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      'Origin': 'https://estadisticas.bcrp.gob.pe',
      'Referer': 'https://estadisticas.bcrp.gob.pe/estadisticas/series/',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
      'Pragma': 'no-cache',
      'Cache-Control': 'no-cache'
    };

    // Try to get data from the API with retries
    const result = await fetchWithRetry(url, headers, codigo, formato, idioma);
    
    if (!result.success) {
      return NextResponse.json(
        { 
          error: result.error,
          url: url 
        },
        { status: result.statusCode || 500 }
      );
    }
    
    // Return the data as JSON
    console.log(`[Server] Successfully received data for ${codigo}`);
    return NextResponse.json(result.data);
    
  } catch (error) {
    console.error('[Server] Error proxying BCRP API request:', error);
    return NextResponse.json(
      { 
        error: 'Error al procesar la solicitud a la API del BCRP',
        details: (error as Error).message
      },
      { status: 500 }
    );
  }
}

/**
 * Specialized function to fetch PBI data using alternative methods
 */
async function fetchPBIData(
  codigo: string,
  formato: string,
  idioma: string
): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  console.log(`[Server] Attempting specialized PBI data fetch for ${codigo}`);
  
  // Enhanced headers to mimic a browser request more closely
  const headers = {
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Origin': 'https://estadisticas.bcrp.gob.pe',
    'Referer': 'https://estadisticas.bcrp.gob.pe/estadisticas/series/anuales/pbi',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-origin',
    'Pragma': 'no-cache',
    'Cache-Control': 'no-cache'
  };
  
  // Use a different endpoint specifically for PBI annual data
  const pbiEndpoint = `https://estadisticas.bcrp.gob.pe/estadisticas/series/anuales/resultados/`;
  
  try {
    // First try with annual PBI specific endpoint 
    console.log(`[Server] Trying PBI specific endpoint: ${pbiEndpoint}`);
    
    // Adjust which PBI dataset to request based on the code
    const pbiType = codigo === 'PM04908AA' ? 'PBI-nivel' : 'PBI-var';
    
    const response = await fetch(`${pbiEndpoint}${pbiType}`, {
      headers,
      cache: 'no-store',
      signal: AbortSignal.timeout(30000) // 30 seconds timeout
    });
    
    if (response.ok) {
      const html = await response.text();
      
      // Extract the JSON data from the HTML page
      const dataMatch = html.match(/var\s+data\s+=\s+(\{[\s\S]*?\});/);
      if (dataMatch && dataMatch[1]) {
        try {
          const extractedData = JSON.parse(dataMatch[1]);
          
          // Transform the extracted data into the expected API format
          const transformedData = transformPBIData(extractedData, codigo);
          return { success: true, data: transformedData };
        } catch (parseError) {
          console.error('[Server] Error parsing extracted PBI data:', parseError);
        }
      }
    }
    
    // Second attempt using base web endpoint
    console.log(`[Server] Trying alternative base endpoint for PBI data`);
    const baseEndpoint = `https://estadisticas.bcrp.gob.pe/estadisticas/series/api/${codigo}/${formato}/${idioma}`;
    
    const baseResponse = await fetch(baseEndpoint, {
      headers,
      cache: 'no-store',
      signal: AbortSignal.timeout(30000)
    });
    
    if (baseResponse.ok) {
      const data = await baseResponse.json();
      return { success: true, data };
    }
    
    // All specialized attempts failed
    return { 
      success: false, 
      error: 'No se pudieron obtener los datos PBI usando métodos especializados' 
    };
    
  } catch (error) {
    console.error('[Server] Error in specialized PBI fetch:', error);
    return { 
      success: false, 
      error: `Error en fetch especializado para PBI: ${(error as Error).message}` 
    };
  }
}

/**
 * Transform extracted PBI data to match the expected API format
 */
function transformPBIData(extractedData: any, codigo: string): any {
  try {
    const seriesName = codigo === 'PM04908AA' ? 'PBI (millones S/)' : 'PBI (var%)';
    
    // Extract periods and values
    const periods = [];
    if (extractedData.periodos && Array.isArray(extractedData.periodos)) {
      for (let i = 0; i < extractedData.periodos.length; i++) {
        const period = extractedData.periodos[i];
        let value = null;
        
        if (extractedData.series && extractedData.series.length > 0) {
          value = extractedData.series[0].datos[i];
        }
        
        if (period && value !== null) {
          periods.push({
            name: period.toString(),
            values: [value.toString()]
          });
        }
      }
    }
    
    // Create formatted response
    return {
      config: {
        series: [{
          name: seriesName,
          serieCodigo: codigo,
          codigoFrecuencia: "A",
          frecuencia: "Anual"
        }],
        titulo: seriesName
      },
      periods: periods
    };
  } catch (error) {
    console.error('[Server] Error transforming PBI data:', error);
    return {
      config: {
        series: [{
          name: codigo === 'PM04908AA' ? 'PBI (millones S/)' : 'PBI (var%)',
          serieCodigo: codigo
        }],
        titulo: codigo === 'PM04908AA' ? 'PBI (millones S/)' : 'PBI (var%)'
      },
      periods: []
    };
  }
}

/**
 * Helper function to perform fetch with retries and alternative URL
 */
async function fetchWithRetry(
  url: string, 
  headers: HeadersInit, 
  codigo: string, 
  formato: string, 
  idioma: string
): Promise<{
  success: boolean;
  data?: any;
  error?: string;
  statusCode?: number;
}> {
  const maxRetries = 3;
  let retryCount = 0;
  
  // Retry loop
  while (retryCount < maxRetries) {
    try {
      // Make request to BCRP API
      const response = await fetch(url, {
        headers,
        cache: 'no-store',
        signal: AbortSignal.timeout(30000) // 30 seconds timeout
      });
      
      console.log(`[Server] BCRP API response status: ${response.status}`);
      
      if (response.ok) {
        const responseText = await response.text();
        try {
          const data = JSON.parse(responseText);
          return { success: true, data };
        } catch (parseError) {
          console.error('[Server] JSON parse error:', parseError);
          return { 
            success: false, 
            error: 'Error parsing BCRP API response', 
            statusCode: 500 
          };
        }
      }
      
      // If we hit a 403 or 500 error, try an alternative URL without dates
      if (response.status === 403 || response.status === 500) {
        console.log(`[Server] ${response.status} response, trying alternative URL without dates`);
        const alternativeUrl = `https://estadisticas.bcrp.gob.pe/estadisticas/series/api/${codigo}/${formato}/${idioma}`;
        
        try {
          const altResponse = await fetch(alternativeUrl, {
            headers,
            cache: 'no-store',
            signal: AbortSignal.timeout(30000)
          });
          
          if (altResponse.ok) {
            const altResponseText = await altResponse.text();
            try {
              const altData = JSON.parse(altResponseText);
              return { success: true, data: altData };
            } catch (parseError) {
              console.error('[Server] Alternative URL JSON parse error:', parseError);
            }
          }
        } catch (altError) {
          console.error('[Server] Alternative URL fetch error:', altError);
        }
      }
      
      // If we reach here, the current attempt failed
      retryCount++;
      
      if (retryCount < maxRetries) {
        // Exponential backoff delay
        const delay = Math.pow(2, retryCount) * 1000;
        console.log(`[Server] Retry ${retryCount}/${maxRetries} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        // Last retry failed
        return { 
          success: false, 
          error: `Error from BCRP API: ${response.status} ${response.statusText}`,
          statusCode: response.status
        };
      }
      
    } catch (fetchError) {
      console.error(`[Server] Fetch error on attempt ${retryCount + 1}:`, fetchError);
      retryCount++;
      
      if (retryCount < maxRetries) {
        const delay = Math.pow(2, retryCount) * 1000;
        console.log(`[Server] Retry ${retryCount}/${maxRetries} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        // All retries failed
        return { 
          success: false, 
          error: `Network error: ${(fetchError as Error).message}`,
          statusCode: 500
        };
      }
    }
  }
  
  // This shouldn't be reached but just in case
  return {
    success: false,
    error: 'Maximum retries reached without success',
    statusCode: 500
  };
}

export const dynamic = 'force-dynamic'; // Don't cache this route 