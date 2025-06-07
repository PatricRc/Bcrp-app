"use client";

import React, { useState } from "react";
import {
  Line,
  LineChart,
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Legend
} from "recharts";
import { IndicadorBCRP } from "@/lib/types";
import { COLORES_GRAFICOS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { 
  AreaChart as AreaChartIcon, 
  LineChart as LineChartIcon, 
  BarChart3,
  TrendingUp
} from "lucide-react";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { TooltipProps } from "recharts";

interface IndicadorChartProps {
  datos: any[];
  indicadores: IndicadorBCRP[];
}

// Custom tooltip component
interface CustomTooltipProps extends TooltipProps<any, any> {
  indicadores: IndicadorBCRP[];
}

const CustomTooltip = ({ active, payload, label, indicadores }: CustomTooltipProps) => {
  if (!active || !payload || payload.length === 0) return null;

  // Formatear la fecha
  const fechaFormateada = formatearFecha(label);

  return (
    <div className="rounded-lg border bg-background p-3 shadow-md">
      <div className="mb-2 font-medium text-sm border-b pb-1">{fechaFormateada}</div>
      <div className="flex flex-col gap-2">
        {payload.map((entry: any, index: number) => {
          // Buscar el nombre del indicador basado en el código
          const indicador = indicadores.find(ind => ind.codigo === entry.dataKey);
          const nombreIndicador = indicador ? indicador.nombre : entry.dataKey;
          
          // Formatear el valor
          const valor = entry.value !== null && entry.value !== undefined 
            ? entry.value.toLocaleString('es-PE', {
                maximumFractionDigits: 2,
                minimumFractionDigits: 2
              })
            : 'N/A';
            
          return (
            <div key={`tooltip-${index}`} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-xs text-muted-foreground">{nombreIndicador}:</span>
              </div>
              <span className="text-xs font-semibold ml-2">{valor}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Función para formatear fechas en el gráfico
const formatearFecha = (fecha: string) => {
  if (!fecha) return '';
  
  // Si la fecha tiene formato YYYY-MM
  if (fecha.match(/^\d{4}-\d{2}$/)) {
    const [año, mes] = fecha.split('-');
    const nombresMeses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${nombresMeses[parseInt(mes) - 1].slice(0, 3)} ${año}`;
  }
  
  // Si la fecha tiene formato YYYY-MM-DD
  if (fecha.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [año, mes, dia] = fecha.split('-');
    return `${dia}/${mes}/${año.slice(2)}`;
  }
  
  return fecha;
};

// Componente para gráfico de líneas
function LineChartComponent({ 
  datos, 
  indicadores, 
  chartConfig 
}: { 
  datos: any[]; 
  indicadores: IndicadorBCRP[]; 
  chartConfig: ChartConfig 
}) {
  // Verificamos si tenemos datos y mostramos mensaje apropiado
  if (!datos || datos.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-gray-500">No hay datos disponibles para mostrar en el gráfico.</p>
      </div>
    );
  }

  // Log para verificar la estructura de los datos en desarrollo
  if (process.env.NODE_ENV === 'development') {
    console.log('LineChart - Datos recibidos:', datos.slice(0, 2));
    console.log('LineChart - Indicadores:', indicadores);
    console.log('LineChart - ChartConfig:', chartConfig);
  }

  // Ordenar datos cronológicamente para asegurar que el eje X va de más antiguo a más reciente
  const datosOrdenados = [...datos].sort((a, b) => {
    const fechaA = new Date(a.fecha);
    const fechaB = new Date(b.fecha);
    return fechaA.getTime() - fechaB.getTime();
  });

  // Limitar a los datos más recientes para mejorar la visualización
  const datosRecientes = datosOrdenados.slice(-12);

  return (
    <Card className="w-full h-full mb-8">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Evolución histórica</CardTitle>
        <CardDescription>
          {indicadores.length === 1 
            ? `Datos históricos de ${indicadores[0].nombre}`
            : `Comparativa de ${indicadores.length} indicadores`}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-8">
        <ChartContainer config={chartConfig}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              accessibilityLayer
              data={datosRecientes}
              margin={{
                left: 12,
                right: 12,
                top: 12,
                bottom: 50
              }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="fecha"
                tickLine={false}
                axisLine={false}
                tickMargin={12}
                tickFormatter={formatearFecha}
                angle={-45}
                textAnchor="end"
                height={40}
              />
              <YAxis 
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={40}
                tickFormatter={(value) => value.toLocaleString('es-PE', { 
                  notation: 'compact',
                  compactDisplay: 'short'
                })}
              />
              <ChartTooltip
                cursor={false}
                content={<CustomTooltip indicadores={indicadores} />}
                defaultIndex={datosRecientes.length > 0 ? datosRecientes.length - 1 : 0}
              />
              
              {indicadores.map((indicador) => (
                <Line
                  key={indicador.codigo}
                  type="monotone"
                  dataKey={indicador.codigo}
                  name={indicador.nombre}
                  stroke={`var(--color-${indicador.codigo})`}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
              ))}
              
              {/* Add Legend for multiple indicators */}
              {indicadores.length > 1 && (
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  formatter={(value, entry) => {
                    // Use indicator name for the legend
                    const indicator = indicadores.find(ind => ind.nombre === value);
                    return indicator ? indicator.nombre : value;
                  }}
                  wrapperStyle={{ 
                    fontSize: '12px',
                    paddingTop: '10px'
                  }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
      <CardFooter className="pb-4">
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-1">
            {datos.length > 0 && indicadores.length > 0 && (
              <div className="flex items-center gap-2 font-medium leading-none">
                {datos[datos.length - 1][indicadores[0].codigo] > datos[datos.length - 2]?.[indicadores[0].codigo] ? (
                  <>Subió en el último período <TrendingUp className="h-4 w-4 text-green-500" /></>
                ) : (
                  <>Tendencia a la baja en el último período <TrendingUp className="h-4 w-4 rotate-180 text-red-500" /></>
                )}
              </div>
            )}
            <div className="flex items-center gap-2 leading-none text-muted-foreground">
              {datos.length > 0 && 
                `${formatearFecha(datos[0].fecha)} - ${formatearFecha(datos[datos.length - 1].fecha)}`}
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}

// Componente para gráfico de área
function AreaChartComponent({ 
  datos, 
  indicadores, 
  chartConfig 
}: { 
  datos: any[]; 
  indicadores: IndicadorBCRP[]; 
  chartConfig: ChartConfig 
}) {
  if (!datos || datos.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-gray-500">No hay datos disponibles para mostrar en el gráfico.</p>
      </div>
    );
  }

  // Ordenar datos cronológicamente para asegurar que el eje X va de más antiguo a más reciente
  const datosOrdenados = [...datos].sort((a, b) => {
    const fechaA = new Date(a.fecha);
    const fechaB = new Date(b.fecha);
    return fechaA.getTime() - fechaB.getTime();
  });

  // Limitar a los datos más recientes para mejorar la visualización
  const datosRecientes = datosOrdenados.slice(-12);

  return (
    <Card className="w-full h-full mb-8">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Evolución histórica</CardTitle>
        <CardDescription>
          {indicadores.length === 1 
            ? `Datos históricos de ${indicadores[0].nombre}`
            : `Comparativa de ${indicadores.length} indicadores`}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-8">
        <ChartContainer config={chartConfig}>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart
              accessibilityLayer
              data={datosRecientes}
              margin={{
                left: 12,
                right: 12,
                top: 12,
                bottom: 50
              }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="fecha"
                tickLine={false}
                axisLine={false}
                tickMargin={12}
                tickFormatter={formatearFecha}
                angle={-45}
                textAnchor="end"
                height={40}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={40}
                tickFormatter={(value) => value.toLocaleString('es-PE', { 
                  notation: 'compact',
                  compactDisplay: 'short'
                })}
              />
              <ChartTooltip
                cursor={false}
                content={<CustomTooltip indicadores={indicadores} />}
                defaultIndex={datosRecientes.length > 0 ? datosRecientes.length - 1 : 0}
              />
              
              {indicadores.map((indicador) => (
                <Area
                  key={indicador.codigo}
                  type="monotone"
                  dataKey={indicador.codigo}
                  name={indicador.nombre}
                  fill={`var(--color-${indicador.codigo})`}
                  stroke={`var(--color-${indicador.codigo})`}
                  fillOpacity={0.2}
                />
              ))}
              
              {/* Add Legend for multiple indicators */}
              {indicadores.length > 1 && (
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  formatter={(value, entry) => {
                    // Use indicator name for the legend
                    const indicator = indicadores.find(ind => ind.nombre === value);
                    return indicator ? indicator.nombre : value;
                  }}
                  wrapperStyle={{ 
                    fontSize: '12px',
                    paddingTop: '10px'
                  }}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
      <CardFooter className="pb-4">
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-1">
            {datos.length > 0 && indicadores.length > 0 && (
              <div className="flex items-center gap-2 font-medium leading-none">
                {datos[datos.length - 1][indicadores[0].codigo] > datos[datos.length - 2]?.[indicadores[0].codigo] ? (
                  <>Subió en el último período <TrendingUp className="h-4 w-4 text-green-500" /></>
                ) : (
                  <>Tendencia a la baja en el último período <TrendingUp className="h-4 w-4 rotate-180 text-red-500" /></>
                )}
              </div>
            )}
            <div className="flex items-center gap-2 leading-none text-muted-foreground">
              {datos.length > 0 && 
                `${formatearFecha(datos[0].fecha)} - ${formatearFecha(datos[datos.length - 1].fecha)}`}
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}

// Componente para gráfico de barras
function BarChartComponent({ 
  datos, 
  indicadores, 
  chartConfig 
}: { 
  datos: any[]; 
  indicadores: IndicadorBCRP[]; 
  chartConfig: ChartConfig 
}) {
  if (!datos || datos.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-gray-500">No hay datos disponibles para mostrar en el gráfico.</p>
      </div>
    );
  }

  // Ordenar datos cronológicamente para asegurar que el eje X va de más antiguo a más reciente
  const datosOrdenados = [...datos].sort((a, b) => {
    const fechaA = new Date(a.fecha);
    const fechaB = new Date(b.fecha);
    return fechaA.getTime() - fechaB.getTime();
  });

  // Limitar a los datos más recientes para mejorar la visualización
  const datosRecientes = datosOrdenados.slice(-12);

  return (
    <Card className="w-full h-full mb-8">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Evolución histórica</CardTitle>
        <CardDescription>
          {indicadores.length === 1 
            ? `Datos históricos de ${indicadores[0].nombre}`
            : `Comparativa de ${indicadores.length} indicadores`}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-8">
        <ChartContainer config={chartConfig}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              accessibilityLayer
              data={datosRecientes}
              margin={{
                left: 12,
                right: 12,
                top: 12,
                bottom: 50
              }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="fecha"
                tickLine={false}
                axisLine={false}
                tickMargin={12}
                tickFormatter={formatearFecha}
                angle={-45}
                textAnchor="end"
                height={40}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={40}
                tickFormatter={(value) => value.toLocaleString('es-PE', { 
                  notation: 'compact',
                  compactDisplay: 'short'
                })}
              />
              <ChartTooltip
                cursor={false}
                content={<CustomTooltip indicadores={indicadores} />}
                defaultIndex={datosRecientes.length > 0 ? datosRecientes.length - 1 : 0}
              />
              
              {indicadores.map((indicador) => (
                <Bar
                  key={indicador.codigo}
                  dataKey={indicador.codigo}
                  name={indicador.nombre}
                  fill={`var(--color-${indicador.codigo})`}
                  radius={[4, 4, 0, 0]}
                />
              ))}
              
              {/* Add Legend for multiple indicators */}
              {indicadores.length > 1 && (
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  formatter={(value, entry) => {
                    // Use indicator name for the legend
                    const indicator = indicadores.find(ind => ind.nombre === value);
                    return indicator ? indicator.nombre : value;
                  }}
                  wrapperStyle={{ 
                    fontSize: '12px',
                    paddingTop: '10px'
                  }}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
      <CardFooter className="pb-4">
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-1">
            {datos.length > 0 && indicadores.length > 0 && (
              <div className="flex items-center gap-2 font-medium leading-none">
                {datos[datos.length - 1][indicadores[0].codigo] > datos[datos.length - 2]?.[indicadores[0].codigo] ? (
                  <>Subió en el último período <TrendingUp className="h-4 w-4 text-green-500" /></>
                ) : (
                  <>Tendencia a la baja en el último período <TrendingUp className="h-4 w-4 rotate-180 text-red-500" /></>
                )}
              </div>
            )}
            <div className="flex items-center gap-2 leading-none text-muted-foreground">
              {datos.length > 0 && 
                `${formatearFecha(datos[0].fecha)} - ${formatearFecha(datos[datos.length - 1].fecha)}`}
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}

export function IndicadorChart({ datos, indicadores }: IndicadorChartProps) {
  const [tipoGrafico, setTipoGrafico] = useState<'line' | 'area' | 'bar'>('line');
  
  // Verificar si tenemos datos para mostrar
  if (!datos || datos.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-gray-500">No hay datos disponibles para mostrar en el gráfico.</p>
      </div>
    );
  }

  // Función para obtener color según el índice
  const obtenerColor = (index: number) => {
    const colores = [
      COLORES_GRAFICOS.primario,
      COLORES_GRAFICOS.secundario,
      COLORES_GRAFICOS.acento1,
      COLORES_GRAFICOS.acento2
    ];
    
    return colores[index % colores.length];
  };

  // Crear configuración para ChartContainer
  const chartConfig = indicadores.reduce((config, indicador, index) => {
    config[indicador.codigo] = {
      label: indicador.nombre,
      color: obtenerColor(index),
    };
    return config;
  }, {} as ChartConfig);

  // Renderizar el tipo de gráfico seleccionado
  const renderizarGrafico = () => {
    switch (tipoGrafico) {
      case 'line':
        return <LineChartComponent datos={datos} indicadores={indicadores} chartConfig={chartConfig} />;
      case 'area':
        return <AreaChartComponent datos={datos} indicadores={indicadores} chartConfig={chartConfig} />;
      case 'bar':
        return <BarChartComponent datos={datos} indicadores={indicadores} chartConfig={chartConfig} />;
      default:
        return <LineChartComponent datos={datos} indicadores={indicadores} chartConfig={chartConfig} />;
    }
  };

  return (
    <div className="flex flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={tipoGrafico === 'line' ? 'default' : 'outline'}
            className="h-8 w-8 p-0"
            onClick={() => setTipoGrafico('line')}
          >
            <LineChartIcon className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={tipoGrafico === 'area' ? 'default' : 'outline'}
            className="h-8 w-8 p-0"
            onClick={() => setTipoGrafico('area')}
          >
            <AreaChartIcon className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={tipoGrafico === 'bar' ? 'default' : 'outline'}
            className="h-8 w-8 p-0"
            onClick={() => setTipoGrafico('bar')}
          >
            <BarChart3 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="h-[350px] overflow-visible">
        {renderizarGrafico()}
      </div>
    </div>
  );
} 