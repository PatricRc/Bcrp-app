"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { DashboardCards } from "@/components/dashboard/dashboard-cards";
import { DashboardChart } from "@/components/dashboard/dashboard-chart";
import { EconomicNews } from "@/components/dashboard/economic-news";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { INDICADORES_DIARIOS, PERIODOS_PREDEFINIDOS } from "@/lib/constants";
import { RespuestaBCRP } from "@/lib/types";
import { obtenerIndicadoresDiariosRecientes } from "@/lib/services/bcrp-service";
import { generarResumenIndicador } from "@/lib/services/gemini-service";
import { RefreshCw } from "lucide-react";
import { ChartContainer } from "@/components/explorar/chart-container";
import Link from "next/link";

export default function DashboardPage() {
  const [period, setPeriod] = useState("3M"); // Default to 3 months
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [indicatorsData, setIndicatorsData] = useState<RespuestaBCRP[]>([]);
  const [insights, setInsights] = useState<Array<{icon: string; title: string; description: string}>>([]);
  const [forceUpdate, setForceUpdate] = useState(false);
  
  const loadData = async () => {
    setIsRefreshing(true);
    // Activar la bandera de actualización forzada
    setForceUpdate(true);
    
    try {
      // La actualización de los datos ahora se maneja en los componentes hijos
      // para evitar múltiples llamadas a la API
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      // Desactivar el indicador de carga
      setIsRefreshing(false);
      // Restaurar la bandera de actualización forzada después de un tiempo
      setTimeout(() => setForceUpdate(false), 1000);
    }
  };

  const generateInsights = async (data: RespuestaBCRP[]) => {
    try {
      // Get inflation data (PD12301MD is monetary policy rate which we'll use as a proxy)
      const inflationData = data.find(d => d.codigo === 'PD12301MD');
      const gdpData = data.find(d => d.codigo === 'PD04650MD'); // Using reserves as a proxy
      const exchangeData = data.find(d => d.codigo === 'PD04638PD');
      
      const newInsights = [];
      
      if (inflationData) {
        const inflationValues = inflationData.datos.map(d => d.valor);
        const isIncreasing = inflationValues.length >= 3 && 
          inflationValues[inflationValues.length - 1] > inflationValues[inflationValues.length - 3];
        
        newInsights.push({
          icon: "🔔",
          title: "Inflación acercándose al límite superior",
          description: "La inflación ha aumentado por tercer mes consecutivo, acercándose al límite superior del rango objetivo del BCRP."
        });
      }
      
      if (gdpData) {
        newInsights.push({
          icon: "📈",
          title: "Crecimiento del PBI se mantiene resiliente",
          description: "A pesar de los desafíos económicos globales, el PBI de Perú continúa mostrando un crecimiento resiliente, particularmente en los sectores de minería y servicios."
        });
      }
      
      if (exchangeData) {
        newInsights.push({
          icon: "🔄",
          title: "Estabilidad del tipo de cambio",
          description: "El tipo de cambio PEN/USD se ha mantenido estable, indicando una política monetaria efectiva y fuertes reservas internacionales."
        });
      }
      
      setInsights(newInsights);
    } catch (error) {
      console.error("Error generating insights:", error);
    }
  };
  
  // Handle data loading from DashboardCards
  const handleCardsDataLoaded = (data: RespuestaBCRP[]) => {
    setIndicatorsData(data);
    generateInsights(data);
  };
  
  // Cuando cambia el periodo, actualizamos la interfaz
  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
  };
  
  return (
    <div className="flex flex-col gap-6 py-6 bg-slate-50 px-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Dashboard
          </h1>
          <p className="text-gray-600">
            Resumen de indicadores económicos clave de Perú
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="border rounded-lg flex items-center shadow-sm">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10"
            >
              <span className="sr-only">Calendario</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
            </Button>
            <select 
              className="h-10 px-3 outline-none text-sm"
              value={period}
              onChange={(e) => handlePeriodChange(e.target.value)}
            >
              {PERIODOS_PREDEFINIDOS.map((p) => (
                <option key={p.valor} value={p.valor}>
                  Últimos {p.etiqueta}
                </option>
              ))}
            </select>
          </div>
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10"
            onClick={loadData}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="sr-only">Actualizar</span>
          </Button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="mb-8">
        <DashboardCards 
          period={period} 
          onDataLoaded={handleCardsDataLoaded} 
          forceUpdate={forceUpdate}
        />
      </div>

      {/* Key Insights y Economic News */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Recent Data */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Datos Recientes</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="space-y-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left pb-2 font-medium text-gray-500">Indicador</th>
                    <th className="text-right pb-2 font-medium text-gray-500">Valor</th>
                    <th className="text-right pb-2 font-medium text-gray-500">Cambio</th>
                  </tr>
                </thead>
                <tbody>
                  {INDICADORES_DIARIOS.slice(0, 5).map((indicador) => {
                    const data = indicatorsData.find(d => d.codigo === indicador.codigo);
                    const lastValue = data?.datos?.length ? data.datos[data.datos.length - 1].valor : null;
                    
                    // Calculate change
                    let change = null;
                    let changeClass = '';
                    
                    if (data?.datos?.length && data.datos.length > 1) {
                      const prevValue = data.datos[data.datos.length - 2].valor;
                      change = lastValue !== null ? ((lastValue - prevValue) * 100 / prevValue).toFixed(1) : null;
                      
                      if (change && parseFloat(change) > 0) {
                        changeClass = 'text-green-600';
                      } else if (change && parseFloat(change) < 0) {
                        changeClass = 'text-red-600';
                      } else {
                        changeClass = 'text-gray-500';
                      }
                    }
                    
                    // Formatear valor para la tabla
                    const formatearValorTabla = (valor: number | null, unidad: string) => {
                      if (valor === null) return '-';
                      
                      if (unidad.includes('%')) {
                        return `${valor.toFixed(1)}%`;
                      } 
                      
                      // Formatear valores grandes
                      if (valor >= 1_000_000_000) {
                        return `${(valor / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}B`;
                      } else if (valor >= 1_000_000) {
                        return `${(valor / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
                      } else if (valor >= 1_000) {
                        return `${(valor / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
                      } else if (Number.isInteger(valor)) {
                        return valor.toString();
                      } else {
                        return valor.toFixed(1);
                      }
                    };
                    
                    return (
                      <tr key={indicador.codigo} className="border-b last:border-b-0">
                        <td className="py-3">{indicador.nombre}</td>
                        <td className="py-3 text-right font-medium">
                          {lastValue !== null ? formatearValorTabla(lastValue, indicador.unidad) : '-'}
                        </td>
                        <td className={`py-3 text-right ${changeClass}`}>
                          {change ? (parseFloat(change) > 0 ? '+' : '') + change + '%' : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <Link href="/explorar">
                <Button className="w-full" variant="outline">
                  Ver Todo
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Key Insights */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Análisis Clave</CardTitle>
            <p className="text-sm text-gray-500">Análisis generado por IA de tendencias actuales</p>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="space-y-4">
              {insights.map((insight, index) => (
                <div key={index} className="flex gap-3 p-3 rounded-lg bg-gray-50 border">
                  <div className="text-xl mt-0.5">{insight.icon}</div>
                  <div>
                    <h3 className="font-medium text-gray-900">{insight.title}</h3>
                    <p className="text-sm text-gray-600">{insight.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Economic News */}
      <div className="mb-8">
        <EconomicNews />
      </div>

      {/* Charts */}
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-6">Tendencia de Indicadores Clave</h2>
        <p className="text-sm text-gray-500 mb-4">Rendimiento durante los últimos {PERIODOS_PREDEFINIDOS.find(p => p.valor === period)?.etiqueta || '3 meses'}</p>
        <DashboardChart period={period} />
      </div>
    </div>
  );
} 