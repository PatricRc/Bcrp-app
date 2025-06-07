"use client"

import { TrendingUp } from "lucide-react"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { IndicadorBCRP } from "@/lib/types"
import { COLORES_GRAFICOS } from "@/lib/constants"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

// Función para formatear fechas en el gráfico
const formatearFecha = (fecha: string) => {
  if (!fecha) return '';
  
  // Si la fecha tiene formato YYYY-MM
  if (fecha.match(/^\d{4}-\d{2}$/)) {
    const [año, mes] = fecha.split('-');
    const nombresMeses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${nombresMeses[parseInt(mes) - 1].slice(0, 3)}`;
  }
  
  // Si la fecha tiene formato YYYY-MM-DD
  if (fecha.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [, mes, dia] = fecha.split('-');
    return `${dia}/${mes}`;
  }
  
  return fecha;
};

interface AreaChartDemoProps {
  datos: any[];
  indicadores: IndicadorBCRP[];
}

export function AreaChartDemo({ datos, indicadores }: AreaChartDemoProps) {
  // Verificamos si tenemos datos y mostramos mensaje apropiado
  if (!datos || datos.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-gray-500">No hay datos disponibles para mostrar en el gráfico.</p>
      </div>
    );
  }

  // Limitar a los datos más recientes para mejorar la visualización (últimos 12 puntos)
  const datosRecientes = datos.slice(-12);

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

  return (
    <Card className="w-full h-full mb-12">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Evolución histórica</CardTitle>
        <CardDescription>
          {indicadores.length === 1 
            ? `Datos históricos de ${indicadores[0].nombre}`
            : `Comparativa de ${indicadores.length} indicadores`}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-6">
        <div className="h-[300px]">
          <ChartContainer config={chartConfig}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                accessibilityLayer
                data={datosRecientes}
                margin={{
                  left: 12,
                  right: 12,
                  top: 8,
                  bottom: 60
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
                  height={50}
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
                  content={<ChartTooltipContent indicator="dot" />}
                />
                
                {indicadores.map((indicador) => (
                  <Area
                    key={indicador.codigo}
                    type="monotone"
                    dataKey={indicador.codigo}
                    name={indicador.nombre}
                    fill={`var(--color-${indicador.codigo})`}
                    fillOpacity={0.4}
                    stroke={`var(--color-${indicador.codigo})`}
                    stackId="a"
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
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
  )
} 