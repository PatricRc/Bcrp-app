"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Filter, ChevronRight, ChevronLeft } from "lucide-react";

// Import using absolute imports with @/ prefix instead of relative imports
import { ResumenIndicador } from "@/components/explorar/resumen-indicador";
import { SelectorIndicadores } from "@/components/explorar/selector-indicadores";
import { IndicadorBCRP } from "@/lib/types";
import { INDICADORES_DIARIOS, INDICADORES_MENSUALES, INDICADORES_ANUALES } from "@/lib/constants";

export function ExplorarIndicadores() {
  const [indicadoresSeleccionados, setIndicadoresSeleccionados] = useState<IndicadorBCRP[]>([]);
  const [frecuenciaActiva, setFrecuenciaActiva] = useState<"diario" | "mensual" | "anual">("diario");
  const [mostrarAnalisis, setMostrarAnalisis] = useState(false);
  const [filtroBusqueda, setFiltroBusqueda] = useState("");
  const [sidebarAbierto, setSidebarAbierto] = useState(true);

  // Función para alternar la selección de un indicador
  const toggleIndicador = (indicador: IndicadorBCRP) => {
    if (indicadoresSeleccionados.some((ind) => ind.codigo === indicador.codigo)) {
      // Si ya está seleccionado, removerlo
      setIndicadoresSeleccionados(indicadoresSeleccionados.filter((ind) => ind.codigo !== indicador.codigo));
    } else {
      // Si no está seleccionado, agregarlo (máximo 4)
      if (indicadoresSeleccionados.length < 4) {
        setIndicadoresSeleccionados([...indicadoresSeleccionados, indicador]);
      } else {
        // Aquí se podría agregar una notificación de límite alcanzado
        console.warn("Máximo 4 indicadores permitidos");
      }
    }
  };

  // Función para cambiar la frecuencia y resetear seleccionados
  const cambiarFrecuencia = (frecuencia: "diario" | "mensual" | "anual") => {
    setFrecuenciaActiva(frecuencia);
    setIndicadoresSeleccionados([]);
  };

  // Función para obtener indicadores por frecuencia
  const obtenerIndicadoresPorFrecuencia = () => {
    switch (frecuenciaActiva) {
      case "diario":
        return INDICADORES_DIARIOS;
      case "mensual":
        return INDICADORES_MENSUALES;
      case "anual":
        return INDICADORES_ANUALES;
      default:
        return [];
    }
  };

  // Función para filtrar indicadores por búsqueda
  const filtrarIndicadores = () => {
    const indicadores = obtenerIndicadoresPorFrecuencia();
    if (!filtroBusqueda) return indicadores;
    
    const termino = filtroBusqueda.toLowerCase();
    return indicadores.filter(
      (ind) => 
        ind.nombre.toLowerCase().includes(termino) || 
        ind.codigo.toLowerCase().includes(termino)
    );
  };
  
  // Alternar sidebar
  const toggleSidebar = () => {
    setSidebarAbierto(!sidebarAbierto);
  };

  return (
    <div className="flex h-full flex-col md:flex-row gap-0">
      {/* Panel izquierdo (Selector de indicadores) */}
      <div 
        className={`border-r border-gray-200 transition-all duration-300 ${
          sidebarAbierto ? 'w-full md:w-80' : 'w-0 overflow-hidden'
        }`}
      >
        <div className="flex h-full flex-col p-4">
          <h2 className="mb-4 text-xl font-bold text-gray-800">Explorar Indicadores</h2>
          
          <div className="relative mb-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar indicadores..."
              className="pl-9"
              value={filtroBusqueda}
              onChange={(e) => setFiltroBusqueda(e.target.value)}
            />
          </div>

          <Tabs
            defaultValue="diario"
            value={frecuenciaActiva}
            onValueChange={(v) => cambiarFrecuencia(v as any)}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="diario">Diario</TabsTrigger>
              <TabsTrigger value="mensual">Mensual</TabsTrigger>
              <TabsTrigger value="anual">Anual</TabsTrigger>
            </TabsList>
            <TabsContent value="diario" className="mt-4">
              <ScrollArea className="h-[calc(100vh-220px)] md:h-[calc(100vh-220px)]">
                <SelectorIndicadores
                  indicadores={filtrarIndicadores()}
                  seleccionados={indicadoresSeleccionados}
                  onToggleIndicador={toggleIndicador}
                />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="mensual" className="mt-4">
              <ScrollArea className="h-[calc(100vh-220px)] md:h-[calc(100vh-220px)]">
                <SelectorIndicadores
                  indicadores={filtrarIndicadores()}
                  seleccionados={indicadoresSeleccionados}
                  onToggleIndicador={toggleIndicador}
                />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="anual" className="mt-4">
              <ScrollArea className="h-[calc(100vh-220px)] md:h-[calc(100vh-220px)]">
                <SelectorIndicadores
                  indicadores={filtrarIndicadores()}
                  seleccionados={indicadoresSeleccionados}
                  onToggleIndicador={toggleIndicador}
                />
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Botón para alternar sidebar - visible solo en versión móvil */}
      <button 
        onClick={toggleSidebar}
        className="flex h-8 w-6 items-center justify-center self-center bg-gray-100 hover:bg-gray-200 md:flex"
      >
        {sidebarAbierto ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>

      {/* Panel derecho (Resumen y análisis) */}
      <div className={`flex-1 overflow-auto p-2 md:p-6 ${!sidebarAbierto ? 'block' : 'hidden md:block'}`}>
        {indicadoresSeleccionados.length > 0 ? (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle>Análisis de Indicadores</CardTitle>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <Filter className="h-4 w-4" />
                    Filtros
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ResumenIndicador indicadores={indicadoresSeleccionados} />
            </CardContent>
          </Card>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <div className="rounded-lg bg-gray-50 p-4 md:p-12">
              <h3 className="mb-2 text-xl font-semibold text-gray-800">
                Seleccione indicadores para analizar
              </h3>
              <p className="text-gray-600">
                Elija hasta 4 indicadores del panel izquierdo para visualizar su comportamiento
                y comparar tendencias.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 