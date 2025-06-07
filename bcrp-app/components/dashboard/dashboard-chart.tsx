"use client";

import { useState, useEffect } from "react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";
import { COLORES_GRAFICOS, INDICADORES_DIARIOS } from "@/lib/constants";
import { obtenerDatosIndicador } from "@/lib/services/bcrp-service";
import { RespuestaBCRP } from "@/lib/types";

// Indicadores que mostraremos en el gráfico por defecto
const INDICADORES_GRAFICO_DEFAULT = [
  'PD04692MD', // Tasa de Interés Interbancaria, S/
  'PD04693MD'  // Tasa de Interés Interbancaria, US$
];

interface DashboardChartProps {
  period?: string;
}

export function DashboardChart({ period = "3M" }: DashboardChartProps) {
  const [datosGrafico, setDatosGrafico] = useState<any[]>([]);
  const [indicadoresSeleccionados, setIndicadoresSeleccionados] = useState<string[]>(INDICADORES_GRAFICO_DEFAULT);
  const [cargando, setCargando] = useState(true);
  const [datosSeries, setDatosSeries] = useState<Record<string, RespuestaBCRP>>({});

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setCargando(true);
        
        // Obtener fechas según el periodo seleccionado
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
        } else { // "MAX" o cualquier otro valor
          // Para "MAX", tomamos datos de los últimos 5 años como máximo
          fechaInicio.setFullYear(fechaInicio.getFullYear() - 5);
        }
        
        const fechaInicioFormato = `${fechaInicio.getFullYear()}-${String(fechaInicio.getMonth() + 1).padStart(2, '0')}`;
        const fechaFinFormato = `${fechaFin.getFullYear()}-${String(fechaFin.getMonth() + 1).padStart(2, '0')}`;
        
        // Cargar datos para cada indicador seleccionado
        const resultados: Record<string, RespuestaBCRP> = {};
        
        for (const codigo of indicadoresSeleccionados) {
          const datos = await obtenerDatosIndicador(codigo, fechaInicioFormato, fechaFinFormato);
          resultados[codigo] = datos;
        }
        
        setDatosSeries(resultados);
        
        // Procesar datos para gráfico
        const datosFormateados = prepararDatosGrafico(resultados);
        setDatosGrafico(datosFormateados);
      } catch (error) {
        console.error("Error al cargar datos para el gráfico:", error);
      } finally {
        setCargando(false);
      }
    };
    
    cargarDatos();
  }, [indicadoresSeleccionados, period]);

  // Función para preparar datos para el gráfico
  const prepararDatosGrafico = (datos: Record<string, RespuestaBCRP>) => {
    if (Object.keys(datos).length === 0) return [];
    
    // Encontrar todas las fechas únicas
    const todasFechas = new Set<string>();
    
    Object.values(datos).forEach(serie => {
      serie.datos.forEach(dato => {
        todasFechas.add(dato.fecha);
      });
    });
    
    // Ordenar fechas
    const fechasOrdenadas = Array.from(todasFechas).sort();
    
    // Crear objeto con datos formateados para el gráfico
    return fechasOrdenadas.map(fecha => {
      const punto: any = { fecha };
      
      Object.entries(datos).forEach(([codigo, serie]) => {
        const dato = serie.datos.find(d => d.fecha === fecha);
        const nombreIndicador = INDICADORES_DIARIOS.find(i => i.codigo === codigo)?.nombre || codigo;
        punto[nombreIndicador] = dato ? dato.valor : null;
      });
      
      return punto;
    });
  };

  // Cambiar indicadores seleccionados
  const toggleIndicador = (codigo: string) => {
    setIndicadoresSeleccionados(prev => {
      if (prev.includes(codigo)) {
        return prev.filter(c => c !== codigo);
      } else {
        return [...prev, codigo];
      }
    });
  };

  // Obtener colores para cada línea
  const obtenerColor = (index: number) => {
    const colores = [
      COLORES_GRAFICOS.primario,
      COLORES_GRAFICOS.secundario,
      COLORES_GRAFICOS.acento1,
      COLORES_GRAFICOS.acento2
    ];
    
    return colores[index % colores.length];
  };

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      {/* Selector de indicadores */}
      <div className="mb-4 flex flex-wrap gap-2">
        {INDICADORES_DIARIOS.slice(0, 4).map((indicador, index) => (
          <button
            key={indicador.codigo}
            onClick={() => toggleIndicador(indicador.codigo)}
            className={`rounded-lg px-3 py-1 text-sm transition-colors ${
              indicadoresSeleccionados.includes(indicador.codigo)
                ? `bg-[${obtenerColor(index)}] text-white`
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            style={
              indicadoresSeleccionados.includes(indicador.codigo) 
                ? { backgroundColor: obtenerColor(index) } 
                : {}
            }
          >
            {indicador.nombre}
          </button>
        ))}
      </div>
      
      {/* Gráfico */}
      <div className="h-80 w-full">
        {cargando ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-sm text-gray-500">Cargando datos...</div>
          </div>
        ) : datosGrafico.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={datosGrafico}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="fecha" />
              <YAxis />
              <Tooltip />
              <Legend />
              
              {indicadoresSeleccionados.map((codigo, index) => {
                const indicador = INDICADORES_DIARIOS.find(i => i.codigo === codigo);
                if (!indicador) return null;
                
                return (
                  <Line
                    key={codigo}
                    type="monotone"
                    dataKey={indicador.nombre}
                    stroke={obtenerColor(index)}
                    activeDot={{ r: 8 }}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-sm text-gray-500">
              No hay datos disponibles. Seleccione indicadores para visualizar.
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 