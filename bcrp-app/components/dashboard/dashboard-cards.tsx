"use client";

import { useEffect, useState } from "react";
import { INDICADORES_DIARIOS } from "@/lib/constants";
import { obtenerDatosIndicador, obtenerIndicadoresDiariosRecientes } from "@/lib/services/bcrp-service";
import { RespuestaBCRP, DatoSerie } from "@/lib/types";
import { formatDolares, formatPorcentaje } from "@/lib/utils";
import { 
  ArrowUp, 
  ArrowDown, 
  Minus,
  BarChart3,
  Percent,
  DollarSign
} from "lucide-react";

// Datos de respaldo para cuando falla la conexión con la API
const DATOS_RESPALDO: Record<string, {valor: number, tendencia: "subida" | "bajada" | "estable"}> = {
  'PD04650MD': { valor: 85090.1, tendencia: "bajada" }, // Reservas internacionales
  'PD12301MD': { valor: 4.8, tendencia: "estable" }, // Tasa de Referencia
  'PD04692MD': { valor: 4.8, tendencia: "estable" }, // Tasa Interbancaria S/
  'PD04693MD': { valor: 4.5, tendencia: "estable" }, // Tasa Interbancaria US$
  'PD04637PD': { valor: 3.7, tendencia: "subida" }, // Tipo de Cambio - Compra
  'PD04638PD': { valor: 3.7, tendencia: "subida" }, // Tipo de Cambio - Venta
  'PD38026MD': { valor: 24517.8, tendencia: "subida" }, // Índice General BVL
  'PD04694MD': { valor: 1.2, tendencia: "subida" }, // Índice General BVL (var%)
  'PD04701XD': { valor: 410.5, tendencia: "subida" }, // Cobre
  'PD04704XD': { valor: 2379.5, tendencia: "subida" }, // Oro
  'PD04721XD': { valor: 0.3, tendencia: "subida" } // Dow Jones (var%)
};

// Componente para cada tarjeta de indicador
function IndicadorCard({ 
  titulo, 
  valor, 
  unidad, 
  codigo,
  delta,
  tendencia
}: { 
  titulo: string; 
  valor: number | null; 
  unidad: string; 
  codigo: string;
  delta: string | null;
  tendencia: "subida" | "bajada" | "estable" | "desconocida";
}) {
  // Determinar icono basado en tendencia
  const TendenciaIcon = () => {
    switch (tendencia) {
      case "subida":
        return <ArrowUp className="h-4 w-4 text-green-600" />;
      case "bajada":
        return <ArrowDown className="h-4 w-4 text-red-600" />;
      case "estable":
        return <Minus className="h-4 w-4 text-gray-600" />;
      default:
        return null;
    }
  };

  // Colorear el delta
  const getDeltaColor = () => {
    if (!delta) return "text-gray-400";
    
    if (delta.startsWith("+")) return "text-green-600";
    if (delta.startsWith("-")) return "text-red-600";
    return "text-gray-400";
  };

  // Icono según tipo de indicador
  const getTipoIcon = () => {
    if (unidad.includes('%')) {
      return <Percent className="h-5 w-5 text-gray-700" />;
    } else if (unidad.includes('US$') || unidad.includes('S/')) {
      return <DollarSign className="h-5 w-5 text-gray-700" />;
    } else {
      return <BarChart3 className="h-5 w-5 text-gray-700" />;
    }
  };

  // Formatear valor según unidad
  const formatearValor = (valor: number, unidad: string) => {
    if (unidad.includes('%')) {
      return formatPorcentaje(valor);
    } else if (unidad.includes('US$') || unidad.includes('S/')) {
      return formatearNumeroAbreviado(valor);
    } else {
      return formatearNumeroAbreviado(valor);
    }
  };

  // Formatear número con abreviaciones (K, M, B)
  const formatearNumeroAbreviado = (valor: number) => {
    if (valor >= 1_000_000_000) {
      return `${(valor / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}B`;
    } else if (valor >= 1_000_000) {
      return `${(valor / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
    } else if (valor >= 1_000) {
      return `${(valor / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
    } else if (Number.isInteger(valor)) {
      return valor.toString();
    } else {
      return valor.toFixed(2);
    }
  };

  // Obtener prefijo según unidad
  const getValorPrefix = () => {
    if (unidad.includes('US$')) {
      return "USD";
    }
    if (unidad.includes('S/')) {
      return "S/";
    }
    return "";
  };

  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex flex-col h-full justify-between">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center">
            <div className="mr-2">
              {getTipoIcon()}
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700">{titulo}</h3>
              <p className="text-xs text-gray-500">{codigo}</p>
            </div>
          </div>
          <div className="flex items-center">
            <TendenciaIcon />
          </div>
        </div>
        
        <div className="mt-auto">
          {valor !== null ? (
            <>
              <div className="flex items-end">
                <div className="text-3xl font-bold text-gray-900">
                  {getValorPrefix()} {formatearValor(valor, unidad)}
                </div>
                {delta && (
                  <div className={`ml-2 mb-1 text-sm font-medium ${getDeltaColor()}`}>
                    {delta}
                  </div>
                )}
              </div>
              <div className="mt-1 text-xs text-gray-500">{unidad}</div>
            </>
          ) : (
            <div className="h-9 w-24 animate-pulse rounded bg-gray-200"></div>
          )}
        </div>
      </div>
    </div>
  );
}

interface DashboardCardsProps {
  period?: string;
  onDataLoaded?: (data: RespuestaBCRP[]) => void;
  forceUpdate?: boolean;
}

export function DashboardCards({ period = "3M", onDataLoaded, forceUpdate = false }: DashboardCardsProps) {
  const [datosIndicadores, setDatosIndicadores] = useState<RespuestaBCRP[]>([]);
  const [cargando, setCargando] = useState(true);
  const [datosUltimaActualizacion, setDatosUltimaActualizacion] = useState<string>("No disponible");
  const [errorConexion, setErrorConexion] = useState<boolean>(false);

  // Función para cargar datos desde localStorage
  const cargarDatosGuardados = () => {
    try {
      const datosGuardadosString = localStorage.getItem('bcrp_indicadores_data');
      if (datosGuardadosString) {
        const datosGuardados = JSON.parse(datosGuardadosString);
        
        // Verificar si tenemos datos guardados para la fecha de hoy
        const fechaHoy = new Date().toISOString().split('T')[0];
        if (datosGuardados.fecha === fechaHoy) {
          setDatosIndicadores(datosGuardados.indicadores);
          setDatosUltimaActualizacion(datosGuardados.fecha);
          setCargando(false);
          
          if (onDataLoaded) {
            onDataLoaded(datosGuardados.indicadores);
          }
          
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error("Error al cargar datos guardados:", error);
      return false;
    }
  };

  // Función para guardar datos en localStorage
  const guardarDatosLocalmente = (datos: RespuestaBCRP[]) => {
    try {
      const fechaHoy = new Date().toISOString().split('T')[0];
      localStorage.setItem('bcrp_indicadores_data', JSON.stringify({
        indicadores: datos,
        fecha: fechaHoy
      }));
      setDatosUltimaActualizacion(fechaHoy);
    } catch (error) {
      console.error("Error al guardar datos localmente:", error);
    }
  };

  // Función para crear datos de respaldo cuando falla la conexión con la API
  const crearDatosRespaldo = (): RespuestaBCRP[] => {
    return INDICADORES_DIARIOS.map(indicador => {
      const datoRespaldo = DATOS_RESPALDO[indicador.codigo] || { valor: 0, tendencia: "desconocida" };
      
      // Crear series de datos ficticias para los últimos 7 días
      const datos: DatoSerie[] = [];
      const hoy = new Date();
      
      for (let i = 6; i >= 0; i--) {
        const fecha = new Date(hoy);
        fecha.setDate(fecha.getDate() - i);
        
        // Fluctuación aleatoria pequeña para simular variación de datos
        const fluctuacion = (Math.random() * 0.02) - 0.01; // -1% a +1%
        const valorBase = datoRespaldo.valor;
        const valorDia = valorBase * (1 + (fluctuacion * i));
        
        datos.push({
          fecha: fecha.toISOString().split('T')[0],
          valor: Number(valorDia.toFixed(2))
        });
      }
      
      return {
        codigo: indicador.codigo,
        nombre: indicador.nombre,
        datos: datos
      };
    });
  };

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setErrorConexion(false);
      
      // Si no es una actualización forzada, intentar usar datos guardados localmente
      if (!forceUpdate && cargarDatosGuardados()) {
        return;
      }
      
      const codigos = INDICADORES_DIARIOS.map(indicador => indicador.codigo);
      
      // Intentar obtener datos reales
      try {
        let datos: RespuestaBCRP[] = [];
        
        if (period === "MAX") {
          // Si estamos mostrando todos los datos, usar el endpoint de datos recientes
          datos = await obtenerIndicadoresDiariosRecientes(codigos);
        } else {
          // Calcular fechas basadas en el periodo seleccionado
          const fechaFin = new Date();
          const fechaInicio = new Date();
          
          // Ajustar fecha inicio según periodo
          if (period === "1M") {
            fechaInicio.setMonth(fechaInicio.getMonth() - 1);
          } else if (period === "3M") {
            fechaInicio.setMonth(fechaInicio.getMonth() - 3);
          } else if (period === "6M") {
            fechaInicio.setMonth(fechaInicio.getMonth() - 6);
          } else if (period === "1Y") {
            fechaInicio.setFullYear(fechaInicio.getFullYear() - 1);
          } else if (period === "2Y") {
            fechaInicio.setFullYear(fechaInicio.getFullYear() - 2);
          } else if (period === "5Y") {
            fechaInicio.setFullYear(fechaInicio.getFullYear() - 5);
          }
          
          const fechaInicioStr = `${fechaInicio.getFullYear()}-${String(fechaInicio.getMonth() + 1).padStart(2, '0')}`;
          const fechaFinStr = `${fechaFin.getFullYear()}-${String(fechaFin.getMonth() + 1).padStart(2, '0')}`;
          
          // Obtener datos para cada indicador
          const promesas = codigos.map(codigo => obtenerDatosIndicador(codigo, fechaInicioStr, fechaFinStr)
            .catch(error => {
              console.warn(`Error al obtener datos para ${codigo}:`, error);
              return null;
            })
          );
          
          const resultados = await Promise.all(promesas);
          datos = resultados.filter(Boolean) as RespuestaBCRP[];
        }
        
        // Si tenemos datos válidos, los guardamos y actualizamos el estado
        if (datos.length > 0) {
          guardarDatosLocalmente(datos);
          setDatosIndicadores(datos);
          
          if (onDataLoaded) {
            onDataLoaded(datos);
          }
        } else {
          throw new Error("No se obtuvieron datos válidos de la API");
        }
      } catch (apiError) {
        console.error("Error al obtener datos reales:", apiError);
        
        // Intentar usar datos guardados localmente
        const datosGuardadosExisten = cargarDatosGuardados();
        
        if (!datosGuardadosExisten) {
          // Si no hay datos guardados, usar datos de respaldo
          setErrorConexion(true);
          const datosRespaldo = crearDatosRespaldo();
          setDatosIndicadores(datosRespaldo);
          
          if (onDataLoaded) {
            onDataLoaded(datosRespaldo);
          }
        }
      }
    } catch (error) {
      console.error("Error al cargar indicadores:", error);
      setErrorConexion(true);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    // Al iniciar, intentamos cargar datos guardados
    if (!cargarDatosGuardados()) {
      // Si no hay datos guardados, cargamos datos nuevos
      cargarDatos();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo se ejecuta al montar el componente

  // Cuando cambia el periodo, actualizamos los datos solo si es una actualización forzada
  useEffect(() => {
    if (forceUpdate) {
      cargarDatos();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, forceUpdate]);

  // Determinar tendencia comparando último valor con penúltimo
  const obtenerTendencia = (datos: any[]) => {
    if (!datos || datos.length < 2) return "desconocida";
    
    const ultimoValor = datos[datos.length - 1].valor;
    const penultimoValor = datos[datos.length - 2].valor;
    
    if (Math.abs(ultimoValor - penultimoValor) < 0.001) {
      return "estable";
    } else if (ultimoValor > penultimoValor) {
      return "subida";
    } else {
      return "bajada";
    }
  };

  // Obtener último valor de un indicador
  const obtenerUltimoValor = (codigo: string) => {
    const indicador = datosIndicadores.find(i => i.codigo === codigo);
    
    if (!indicador || !indicador.datos || !indicador.datos.length) {
      // Si no hay datos disponibles, usar datos de respaldo
      if (errorConexion && DATOS_RESPALDO[codigo]) {
        return DATOS_RESPALDO[codigo].valor;
      }
      return null;
    }
    
    return indicador.datos[indicador.datos.length - 1].valor;
  };

  // Obtener tendencia de un indicador
  const obtenerTendenciaIndicador = (codigo: string) => {
    const indicador = datosIndicadores.find(i => i.codigo === codigo);
    
    if (!indicador || !indicador.datos || indicador.datos.length < 2) {
      // Si no hay datos disponibles, usar datos de respaldo
      if (errorConexion && DATOS_RESPALDO[codigo]) {
        return DATOS_RESPALDO[codigo].tendencia;
      }
      return "desconocida";
    }
    
    return obtenerTendencia(indicador.datos);
  };

  // Calcular el delta (cambio porcentual) según el periodo seleccionado
  const calcularDelta = (codigo: string) => {
    const indicador = datosIndicadores.find(i => i.codigo === codigo);
    
    if (!indicador || !indicador.datos || indicador.datos.length < 2) {
      return null;
    }
    
    const datos = indicador.datos;
    const ultimoValor = datos[datos.length - 1].valor;
    
    let valorComparacion;
    
    // Determinar el valor de comparación según el periodo
    if (period === "1M" && datos.length > 4) {
      // Para 1 mes, comparar con el valor de hace aproximadamente 1 mes
      valorComparacion = datos[Math.max(0, datos.length - 30)].valor;
    } else if (period === "3M" && datos.length > 12) {
      // Para 3 meses, comparar con el valor de hace aproximadamente 3 meses
      valorComparacion = datos[Math.max(0, datos.length - 90)].valor;
    } else if (period === "6M" && datos.length > 24) {
      // Para 6 meses, comparar con el valor de hace aproximadamente 6 meses
      valorComparacion = datos[Math.max(0, datos.length - 180)].valor;
    } else if (period === "1Y" && datos.length > 50) {
      // Para 1 año, comparar con el valor de hace aproximadamente 1 año
      valorComparacion = datos[Math.max(0, datos.length - 365)].valor;
    } else {
      // Por defecto, comparar con el penúltimo valor disponible
      valorComparacion = datos[datos.length - 2].valor;
    }
    
    if (ultimoValor === 0 || valorComparacion === 0) {
      return "0.0%";
    }
    
    const cambio = ((ultimoValor - valorComparacion) / Math.abs(valorComparacion)) * 100;
    const signo = cambio > 0 ? "+" : "";
    return `${signo}${cambio.toFixed(1)}%`;
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {cargando ? (
          // Mostrar placeholders de carga
          Array(8).fill(0).map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-xl bg-gray-100"></div>
          ))
        ) : (
          // Mostrar tarjetas con datos reales
          INDICADORES_DIARIOS.slice(0, 8).map((indicador) => (
            <IndicadorCard
              key={indicador.codigo}
              titulo={indicador.nombre}
              valor={obtenerUltimoValor(indicador.codigo)}
              unidad={indicador.unidad}
              tendencia={obtenerTendenciaIndicador(indicador.codigo)}
              codigo={indicador.codigo}
              delta={calcularDelta(indicador.codigo)}
            />
          ))
        )}
      </div>
      
      {errorConexion && (
        <div className="text-center text-xs text-yellow-600 mt-2">
          Algunos datos pueden no estar actualizados. Usando datos de respaldo disponibles.
        </div>
      )}
      
      <div className="text-center text-xs text-gray-500">
        Última actualización: {datosUltimaActualizacion}
      </div>
    </div>
  );
} 