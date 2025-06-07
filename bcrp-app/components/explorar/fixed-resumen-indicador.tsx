"use client";

import React, { useState, useEffect } from "react";
import { IndicadorBCRP, RespuestaBCRP, RespuestaGemini } from "@/lib/types";
import { obtenerDatosIndicador } from "@/lib/services/bcrp-service";
import { generarResumenIndicador } from "@/lib/services/gemini-service";
import { COLORES_GRAFICOS } from "@/lib/constants";
import { FileText, Loader2 } from "lucide-react";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { subMonths } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DatosIndicadorTable } from "./datos-indicador-table";
import { IndicadorChart } from "./indicador-chart";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ResumenIndicadorProps {
  indicadores: IndicadorBCRP[];
}

export function ResumenIndicador({ indicadores }: ResumenIndicadorProps) {
  const [datosIndicadores, setDatosIndicadores] = useState<Record<string, RespuestaBCRP>>({});
  const [datosGrafico, setDatosGrafico] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [analisisIA, setAnalisisIA] = useState<Record<string, RespuestaGemini>>({});
  const [cargandoAnalisis, setCargandoAnalisis] = useState(false);
  const [pestanaActiva, setPestanaActiva] = useState<string>(indicadores[0]?.codigo || "");
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subMonths(new Date(), 12),
    to: new Date(),
  });
  const [vistaActiva, setVistaActiva] = useState<"grafico" | "tabla">("grafico");

  // Cargar datos al cambiar indicadores seleccionados o rango de fechas
  useEffect(() => {
    const cargarDatos = async () => {
      if (indicadores.length === 0 || !dateRange?.from) {
        setCargando(false);
        return;
      }

      try {
        setErrorCarga(null);
        setCargando(true);
        
        // Usar las fechas del datepicker
        const fechaInicio = dateRange.from;
        const fechaFin = dateRange.to || new Date();
        
        const fechaInicioFormato = `${fechaInicio.getFullYear()}-${String(fechaInicio.getMonth() + 1).padStart(2, '0')}`;
        const fechaFinFormato = `${fechaFin.getFullYear()}-${String(fechaFin.getMonth() + 1).padStart(2, '0')}`;
        
        console.log(`Cargando datos: ${fechaInicioFormato} a ${fechaFinFormato}`);
        
        // Cargar datos para cada indicador seleccionado
        const resultados: Record<string, RespuestaBCRP> = {};
        const errores: string[] = [];
        
        for (const indicador of indicadores) {
          try {
            console.log(`Obteniendo datos para ${indicador.codigo}`);
            const datos = await obtenerDatosIndicador(indicador.codigo, fechaInicioFormato, fechaFinFormato);
            
            if (datos && datos.datos && datos.datos.length > 0) {
              resultados[indicador.codigo] = datos;
              console.log(`Datos recibidos: ${datos.datos.length} registros`);
            } else {
              errores.push(`No hay datos disponibles para ${indicador.nombre}`);
            }
          } catch (error) {
            console.error(`Error al obtener datos para ${indicador.codigo}:`, error);
            errores.push(`${indicador.nombre}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
            // Continuar con el siguiente indicador en caso de error
          }
        }
        
        // Solo procesar resultados si hay datos disponibles
        if (Object.keys(resultados).length > 0) {
          setDatosIndicadores(resultados);
          
          // Preparar los datos para el gráfico
          const datosFormateados = prepararDatosGrafico(resultados);
          setDatosGrafico(datosFormateados);
          
          // Establecer la pestaña activa al primer indicador disponible
          const primerCodigo = Object.keys(resultados)[0];
          if (primerCodigo) {
            setPestanaActiva(primerCodigo);
            // Generar análisis para el primer indicador con el nuevo rango de fechas
            generarAnalisis(primerCodigo, resultados[primerCodigo]);
          }
          
          // Mostrar advertencia si algunos indicadores fallaron
          if (errores.length > 0) {
            setErrorCarga(`Algunos indicadores no pudieron cargarse: ${errores.join(', ')}`);
          }
        } else {
          setErrorCarga("No se pudieron cargar datos para ningún indicador. Por favor verifique su conexión a Internet o inténtelo más tarde.");
        }
      } catch (error) {
        console.error("Error general al cargar datos:", error);
        setErrorCarga(`Error al cargar datos: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      } finally {
        setCargando(false);
      }
    };
    
    cargarDatos();
  }, [indicadores, dateRange]);

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
        // Convertir explícitamente a número
        punto[codigo] = dato ? parseFloat(dato.valor.toString()) : null;
      });
      
      return punto;
    });
  };

  // Generar análisis de IA para un indicador con un prompt mejorado
  const generarAnalisis = async (codigo: string, datos: RespuestaBCRP) => {
    if (!datos) return;
    
    try {
      setCargandoAnalisis(true);
      
      // Verificar si ya tenemos el análisis o si ha cambiado el rango de fechas
      if (analisisIA[codigo]) {
        // Limpiar análisis anteriores si ha cambiado el rango de fechas
        setAnalisisIA({});
      }
      
      // Generar análisis con Gemini usando un prompt mejorado
      const analisis = await generarResumenIndicador(datos);
      
      // Actualizar estado
      setAnalisisIA(prev => ({
        ...prev,
        [codigo]: analisis
      }));
    } catch (error) {
      console.error("Error al generar análisis:", error);
    } finally {
      setCargandoAnalisis(false);
    }
  };

  // Cambiar pestaña activa
  const cambiarPestana = (codigo: string) => {
    setPestanaActiva(codigo);
    
    // Si no tenemos análisis para este indicador, generarlo
    if (!analisisIA[codigo] && datosIndicadores[codigo]) {
      generarAnalisis(codigo, datosIndicadores[codigo]);
    }
  };

  // Obtener color para el gráfico
  const obtenerColor = (index: number) => {
    const colores = [
      COLORES_GRAFICOS.primario,
      COLORES_GRAFICOS.secundario,
      COLORES_GRAFICOS.acento1,
      COLORES_GRAFICOS.acento2
    ];
    
    return colores[index % colores.length];
  };

  // Exportar a PDF
  const exportarPDF = async () => {
    // Only import jsPDF on the client side
    if (typeof window === 'undefined') return;
    
    try {
      // Dynamically import jsPDF
      const jsPDFModule = await import('jspdf');
      const jsPDF = jsPDFModule.default;
      
      const doc = new jsPDF();
      
      // Título
      doc.setFontSize(16);
      doc.text('Análisis de Indicadores Económicos BCRP', 20, 20);
      
      // Fecha
      doc.setFontSize(10);
      doc.text(`Generado el: ${new Date().toLocaleDateString('es-PE')}`, 20, 30);

      // Periodo analizado
      if (dateRange?.from) {
        doc.text(`Periodo analizado: ${dateRange.from.toLocaleDateString('es-PE')} - ${dateRange.to?.toLocaleDateString('es-PE') || new Date().toLocaleDateString('es-PE')}`, 20, 35);
      }
      
      // Agregar análisis de cada indicador
      let yPos = 45;
      
      indicadores.forEach((indicador, i) => {
        // Verificar si necesitamos una nueva página
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }
        
        // Título del indicador
        doc.setFontSize(14);
        doc.text(`${indicador.nombre} (${indicador.codigo})`, 20, yPos);
        yPos += 10;
        
        // Análisis
        if (analisisIA[indicador.codigo]) {
          doc.setFontSize(10);
          // Dividir el texto en líneas para que quepa en la página
          const lineas = doc.splitTextToSize(analisisIA[indicador.codigo].texto, 170);
          doc.text(lineas, 20, yPos);
          yPos += lineas.length * 5 + 10;
        } else {
          doc.setFontSize(10);
          doc.text('No hay análisis disponible para este indicador.', 20, yPos);
          yPos += 10;
        }
      });
      
      // Guardar PDF
      doc.save('analisis-indicadores-bcrp.pdf');
    } catch (error) {
      console.error("Error al exportar a PDF:", error);
    }
  };

  if (cargando) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="mr-2 h-8 w-8 animate-spin text-[#002B5B]" />
        <span>Cargando datos...</span>
      </div>
    );
  }

  if (errorCarga && Object.keys(datosIndicadores).length === 0) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4 text-center">
        <div className="rounded-lg bg-red-50 p-4 text-red-800">
          <h3 className="mb-2 font-semibold">Error de conexión</h3>
          <p>{errorCarga}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Selección de fecha */}
      <div className="flex items-center justify-between gap-4">
        <DatePickerWithRange 
          dateRange={dateRange || { from: subMonths(new Date(), 12), to: new Date() }}
          setDateRange={setDateRange as React.Dispatch<React.SetStateAction<DateRange>>}
        />
        
        <Button
          variant="outline"
          size="sm"
          onClick={exportarPDF}
          className="ml-auto flex items-center gap-1"
        >
          <FileText className="h-4 w-4" />
          Exportar PDF
        </Button>
      </div>
      
      {/* Visualización principal */}
      <Card className="w-full">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                {/* No repetir el título, mostramos solo uno */}
                {indicadores.length === 1 
                  ? `${indicadores[0].nombre}`
                  : `Indicadores BCRP Seleccionados`}
              </CardTitle>
              <CardDescription>
                {dateRange?.from && (
                  `Datos desde ${dateRange.from.toLocaleDateString('es-PE')} hasta ${dateRange.to?.toLocaleDateString('es-PE') || new Date().toLocaleDateString('es-PE')}`
                )}
              </CardDescription>
            </div>
            
            {/* Selector de vista */}
            <Tabs 
              value={vistaActiva} 
              onValueChange={(value) => setVistaActiva(value as "grafico" | "tabla")}
              className="w-[200px]"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="grafico">Gráfico</TabsTrigger>
                <TabsTrigger value="tabla">Tabla</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {/* Visualización según la pestaña seleccionada */}
          {vistaActiva === "grafico" ? (
            /* Gráfico mejorado */
            <div className="h-[350px] pt-2">
              <IndicadorChart 
                datos={datosGrafico}
                indicadores={indicadores}
              />
            </div>
          ) : (
            /* Tabla de datos */
            <div className="mt-2">
              <DatosIndicadorTable datosIndicadores={datosIndicadores} />
            </div>
          )}
          
          {/* Selector de pestañas para análisis individual */}
          {indicadores.length > 0 && (
            <div className="mt-6">
              <div className="mb-2 flex border-b">
                {Object.entries(datosIndicadores).map(([codigo, datos]) => (
                  <button
                    key={codigo}
                    className={`px-4 py-2 border-b-2 transition-colors ${
                      pestanaActiva === codigo
                        ? 'border-blue-500 text-blue-800'
                        : 'border-transparent hover:border-gray-300'
                    }`}
                    onClick={() => cambiarPestana(codigo)}
                  >
                    {datos.nombre}
                  </button>
                ))}
              </div>
              
              {/* Análisis de IA */}
              <div className="rounded-lg bg-white p-4">
                {cargandoAnalisis ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="mr-2 h-5 w-5 animate-spin text-gray-500" />
                    <span className="text-gray-500">Generando análisis...</span>
                  </div>
                ) : analisisIA[pestanaActiva] ? (
                  <div className="prose max-w-none">
                    <h3 className="text-lg font-semibold mb-2">Análisis de IA</h3>
                    <div className="text-gray-700">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          // Add custom styling through components
                          p: ({node, ...props}) => <p className="my-2 text-gray-700" {...props} />,
                          h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-blue-800 mt-4 mb-2" {...props} />,
                          h2: ({node, ...props}) => <h2 className="text-xl font-bold text-blue-800 mt-3 mb-2" {...props} />,
                          h3: ({node, ...props}) => <h3 className="text-lg font-bold text-blue-800 mt-3 mb-1" {...props} />,
                          ul: ({node, ...props}) => <ul className="list-disc pl-6 my-2" {...props} />,
                          ol: ({node, ...props}) => <ol className="list-decimal pl-6 my-2" {...props} />,
                          li: ({node, ...props}) => <li className="my-1" {...props} />,
                          a: ({node, ...props}) => <a className="text-blue-600 underline" {...props} />,
                          blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-gray-300 pl-4 italic my-2" {...props} />,
                          code: ({node, inline, className, ...props}: any) => 
                            inline 
                              ? <code className="bg-gray-100 px-1 py-0.5 rounded text-red-600" {...props} />
                              : <code className="block bg-gray-100 p-2 rounded my-2 overflow-x-auto" {...props} />,
                          table: ({node, ...props}) => <table className="border-collapse border border-gray-300 my-4" {...props} />,
                          th: ({node, ...props}) => <th className="border border-gray-300 px-4 py-2 bg-gray-100" {...props} />,
                          td: ({node, ...props}) => <td className="border border-gray-300 px-4 py-2" {...props} />,
                        }}
                      >
                        {analisisIA[pestanaActiva].texto}
                      </ReactMarkdown>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-gray-500">
                    No hay análisis disponible para este indicador.
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 