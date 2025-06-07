"use client";

import React, { useState, useRef } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { InfoIcon, BarChart4, LineChart, Download, Loader2 } from "lucide-react";
import { IndicadorBCRP } from "@/lib/types";
import { generarAnalisisComparativo } from "@/lib/services/gemini-service";
import { ChartConfig, ChartContainer } from "@/components/ui/chart";
import {
  Line,
  LineChart as RechartsLineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Legend,
  Tooltip as RechartsTooltip
} from "recharts";
import { COLORES_GRAFICOS } from "@/lib/constants";

// Definimos la interfaz para los props del componente
interface PronosticoArimaProps {
  datos: any[];
  indicador: IndicadorBCRP;
  isLoading?: boolean;
}

// Función para convertir markdown a HTML
function markdownToHtml(markdown: string): string {
  // Convertir encabezados
  let html = markdown
    .replace(/^### (.*$)/gim, '<h3 class="text-lg font-medium mt-6 mb-3">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mt-8 mb-4">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-6 mb-5">$1</h1>');
  
  // Convertir énfasis
  html = html
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>');
  
  // Convertir enlaces
  html = html.replace(/\[([^\]]+)]\(([^)]+)\)/gim, '<a href="$2" class="text-blue-600 hover:underline" target="_blank">$1</a>');
  
  // Convertir listas numeradas
  let inOrderedList = false;
  const orderedListRegex = /^\s*(\d+)\.\s+(.*$)/gim;
  const orderedLines = html.split('\n').map(line => {
    const match = orderedListRegex.exec(line);
    orderedListRegex.lastIndex = 0; // Reset regex
    
    if (match) {
      if (!inOrderedList) {
        inOrderedList = true;
        return `<ol class="list-decimal list-inside my-4 space-y-1"><li>${match[2]}</li>`;
      }
      return `<li>${match[2]}</li>`;
    } else if (inOrderedList) {
      inOrderedList = false;
      return `</ol>${line}`;
    }
    return line;
  });
  
  if (inOrderedList) {
    orderedLines.push('</ol>');
  }
  
  html = orderedLines.join('\n');
  
  // Convertir listas no numeradas
  let inUnorderedList = false;
  const unorderedListRegex = /^\s*[-*]\s+(.*$)/gim;
  const unorderedLines = html.split('\n').map(line => {
    const match = unorderedListRegex.exec(line);
    unorderedListRegex.lastIndex = 0; // Reset regex
    
    if (match) {
      if (!inUnorderedList) {
        inUnorderedList = true;
        return `<ul class="list-disc list-inside my-4 space-y-1"><li>${match[1]}</li>`;
      }
      return `<li>${match[1]}</li>`;
    } else if (inUnorderedList) {
      inUnorderedList = false;
      return `</ul>${line}`;
    }
    return line;
  });
  
  if (inUnorderedList) {
    unorderedLines.push('</ul>');
  }
  
  html = unorderedLines.join('\n');
  
  // Convertir tablas - Mejorado para mejor visualización
  const tableRegex = /^\|(.+)\|$/gm;
  const headerRegex = /^\|(:?-+:?\|)+$/gm;
  let tableLines = [];
  let inTable = false;
  let tableHeader = false;
  
  const lines = html.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (tableRegex.test(line)) {
      if (!inTable) {
        inTable = true;
        tableLines.push('<div class="overflow-x-auto my-6 rounded-lg shadow"><table class="w-full text-sm border-separate border-spacing-0 bg-white rounded-lg">');
      }
      
      // Check if next line is a header separator
      const isHeader = i + 1 < lines.length && headerRegex.test(lines[i + 1]);
      
      // Process table row content
      const cells = line.split('|').slice(1, -1);
      const cellTag = isHeader ? 'th' : 'td';
      const rowClass: string = isHeader ? 'bg-gray-100 border-b border-gray-300' : (tableLines.length % 2 === 0 ? '' : 'bg-gray-50');
      const cellClass = isHeader 
        ? 'px-6 py-3 border-b-2 border-gray-300 text-left font-semibold text-gray-800' 
        : 'px-6 py-4 border-b border-gray-200 text-sm text-gray-700';
      
      tableLines.push(`<tr class="${rowClass}">`);
      cells.forEach((cell, idx) => {
        // Añadir alineación al centro para números
        const cellContent = cell.trim();
        const isNumber = !isNaN(parseFloat(cellContent)) && isFinite(parseFloat(cellContent));
        const centerAlign = isNumber ? ' text-center' : '';
        const firstColClass = idx === 0 && !isNumber ? ' font-medium' : '';
        tableLines.push(`<${cellTag} class="${cellClass}${centerAlign}${firstColClass}">${cellContent}</${cellTag}>`);
      });
      tableLines.push('</tr>');
      
      // Skip the header separator line
      if (isHeader) {
        i++;
      }
    } else if (inTable) {
      tableLines.push('</table></div>');
      inTable = false;
      tableLines.push(line);
    } else {
      tableLines.push(line);
    }
  }
  
  if (inTable) {
    tableLines.push('</table></div>');
  }
  
  html = tableLines.join('\n');
  
  // Convertir código en línea
  html = html.replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 rounded bg-gray-100 font-mono text-sm">$1</code>');
  
  // Convertir bloques de código
  html = html.replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-100 p-4 rounded-md overflow-x-auto my-4 font-mono text-sm whitespace-pre">$1</pre>');
  
  // Convertir saltos de línea en párrafos
  html = '<p>' + html.replace(/\n\n+/g, '</p><p>') + '</p>';
  html = html.replace(/<p><\/p>/g, '');
  
  // Restaurar elementos HTML que no deberían estar dentro de párrafos
  const unwrapElements = ['<h1', '<h2', '<h3', '<ul', '<ol', '<table', '<pre'];
  unwrapElements.forEach(tag => {
    const regex = new RegExp(`<p>(${tag}[\\s\\S]*?<\\/\\w+>)<\\/p>`, 'g');
    html = html.replace(regex, '$1');
  });
  
  return html;
}

export function PronosticoArima({ datos, indicador, isLoading = false }: PronosticoArimaProps) {
  // Estado para los controles de pronóstico
  const [periodosForecast, setPeriodosForecast] = useState<number>(6);
  const [confianza, setConfianza] = useState<number>(95);
  const [sinEstacionalidad, setSinEstacionalidad] = useState<boolean>(false);
  const [removerOutliers, setRemoverOutliers] = useState<boolean>(false);
  const [periodosMA, setPeriodosMA] = useState<number[]>([30, 60, 120]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [resultadoPronostico, setResultadoPronostico] = useState<string>("");
  const [datosPronostico, setDatosPronostico] = useState<any[]>([]);
  const [generandoPDF, setGenerandoPDF] = useState<boolean>(false);
  
  // Referencias para los elementos que se capturarán para el PDF
  const resultadoRef = useRef<HTMLDivElement>(null);
  const graficoRef = useRef<HTMLDivElement>(null);
  
  // Estado para controlar qué visualización mostrar (gráfico o texto)
  const [mostrarGrafico, setMostrarGrafico] = useState<boolean>(true);

  // Función para generar el pronóstico
  const generarPronostico = async () => {
    if (!datos || datos.length === 0 || !indicador) return;
    
    setIsGenerating(true);
    
    try {
      // Opciones para el pronóstico ARIMA
      const opcionesPredictivas = {
        periodosForecast,
        confianza,
        sinEstacionalidad,
        removerOutliers,
        periodosMA
      };

      // Llamar al servicio de Gemini para generar el pronóstico
      const respuesta = await generarAnalisisComparativo(
        { ...indicador, datos }, 
        { ...indicador, datos }, // Usamos el mismo indicador dos veces (API requiere dos indicadores)
        "pronostico",
        opcionesPredictivas
      );

      // Actualizar el estado con el resultado del pronóstico
      setResultadoPronostico(respuesta.texto);
      
      // Simular datos de pronóstico para la visualización
      // En un caso real, estos datos vendrían del modelo ARIMA
      const ultimaFecha = new Date(datos[datos.length - 1].fecha);
      const ultimoValor = datos[datos.length - 1].valor;
      
      // Crear datos de pronóstico simulados
      const datosPredecidos = [];
      for (let i = 1; i <= periodosForecast; i++) {
        const nuevaFecha = new Date(ultimaFecha);
        // Si el formato de fecha es mensual, aumentamos meses
        if (datos[0].fecha.match(/^\d{4}-\d{2}$/)) {
          nuevaFecha.setMonth(nuevaFecha.getMonth() + i);
        } else {
          // Asumimos formato diario
          nuevaFecha.setDate(nuevaFecha.getDate() + i);
        }
        
        // Formatear la fecha según el mismo formato que los datos originales
        let fechaFormateada;
        if (datos[0].fecha.match(/^\d{4}-\d{2}$/)) {
          fechaFormateada = `${nuevaFecha.getFullYear()}-${String(nuevaFecha.getMonth() + 1).padStart(2, '0')}`;
        } else {
          fechaFormateada = `${nuevaFecha.getFullYear()}-${String(nuevaFecha.getMonth() + 1).padStart(2, '0')}-${String(nuevaFecha.getDate()).padStart(2, '0')}`;
        }
        
        // Valor simulado con un poco de variación aleatoria
        const valorPredicho = ultimoValor * (1 + (Math.random() * 0.04 - 0.02));
        
        // Crear límites superior e inferior para el intervalo de confianza
        const margenConfianza = ultimoValor * (0.05 * (1 - confianza / 100));
        const limiteInferior = valorPredicho - margenConfianza;
        const limiteSuperior = valorPredicho + margenConfianza;
        
        datosPredecidos.push({
          fecha: fechaFormateada,
          valor: null, // Valor real es null para datos futuros
          pronostico: valorPredicho,
          limiteInferior,
          limiteSuperior,
          ma30: ultimoValor * (1 + (Math.random() * 0.02 - 0.01)),
          ma60: ultimoValor * (1 + (Math.random() * 0.015 - 0.0075)),
          ma120: ultimoValor * (1 + (Math.random() * 0.01 - 0.005)),
        });
      }
      
      // Combinar datos originales con pronósticos
      const datosOriginalesConFields = datos.map(d => ({ 
        ...d, 
        pronostico: null, 
        limiteInferior: null, 
        limiteSuperior: null,
        ma30: null,
        ma60: null,
        ma120: null
      }));

      // Combinar y ordenar datos cronológicamente
      const datosConPronostico = [...datosOriginalesConFields, ...datosPredecidos].sort((a, b) => {
        const fechaA = new Date(a.fecha);
        const fechaB = new Date(b.fecha);
        return fechaA.getTime() - fechaB.getTime();
      });
      
      setDatosPronostico(datosConPronostico);
    } catch (error) {
      console.error("Error al generar pronóstico ARIMA:", error);
      setResultadoPronostico("Error al generar el pronóstico. Intente nuevamente.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Función para formatear fechas
  const formatearFecha = (fecha: string) => {
    if (!fecha) return '';
    
    if (fecha.match(/^\d{4}-\d{2}$/)) {
      const [año, mes] = fecha.split('-');
      const nombresMeses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      return `${nombresMeses[parseInt(mes) - 1]} ${año}`;
    }
    
    if (fecha.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [año, mes, dia] = fecha.split('-');
      return `${dia}/${mes}/${año.slice(2)}`;
    }
    
    return fecha;
  };

  // Configuración del gráfico
  const chartConfig: ChartConfig = {
    valor: {
      label: "Valor real",
      color: COLORES_GRAFICOS.primario,
    },
    pronostico: {
      label: "Pronóstico ARIMA",
      color: COLORES_GRAFICOS.secundario,
    },
    limiteInferior: {
      label: `Límite inferior (${confianza}%)`,
      color: "#E5E7EB",
    },
    limiteSuperior: {
      label: `Límite superior (${confianza}%)`,
      color: "#E5E7EB",
    },
    ma30: {
      label: "Media móvil (30 períodos)",
      color: COLORES_GRAFICOS.acento1,
    },
    ma60: {
      label: "Media móvil (60 períodos)",
      color: COLORES_GRAFICOS.acento2,
    },
    ma120: {
      label: "Media móvil (120 períodos)",
      color: "#9333EA", // Púrpura
    }
  };

  // Función para generar y descargar el reporte PDF
  const generarPDF = async () => {
    if (!resultadoRef.current || !graficoRef.current || !resultadoPronostico) return;
    
    try {
      setGenerandoPDF(true);
      
      // Importar dinámicamente jsPDF
      const jsPDFModule = await import('jspdf');
      const jsPDF = jsPDFModule.default;
      
      // Crear un nuevo documento PDF A4
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Configurar título del documento
      const titulo = `Pronóstico ARIMA: ${indicador?.nombre || 'Indicador'}`;
      pdf.setFontSize(16);
      pdf.text(titulo, 15, 15);
      
      // Información del análisis
      pdf.setFontSize(10);
      pdf.text(`Períodos pronosticados: ${periodosForecast}`, 15, 22);
      pdf.text(`Nivel de confianza: ${confianza}%`, 15, 27);
      pdf.text(`Indicador: ${indicador?.nombre || 'No especificado'}`, 15, 32);
      pdf.text(`Generado el: ${new Date().toLocaleDateString()}`, 15, 37);
      
      // Línea divisoria
      pdf.setDrawColor(200, 200, 200);
      pdf.line(15, 40, 195, 40);
      
      // ==== ENFOQUE ALTERNATIVO: Crear canvas manualmente desde SVG ====
      let yPos = 45;
      
      // Intentar obtener el gráfico SVG
      if (graficoRef.current && mostrarGrafico) {
        try {
          // Título para el gráfico
          pdf.setFontSize(14);
          pdf.text("Visualización del pronóstico:", 15, yPos);
          yPos += 10;
          
          // Obtener el SVG del gráfico
          const chartElement = graficoRef.current.querySelector('svg');
          
          if (chartElement) {
            // Crear un canvas temporal
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Obtener dimensiones del SVG
            const svgRect = chartElement.getBoundingClientRect();
            canvas.width = svgRect.width;
            canvas.height = svgRect.height;
            
            // Convertir SVG a una imagen después de reemplazar colores OKLCH
            let svgString = new XMLSerializer().serializeToString(chartElement);
            
            // Reemplazar colores OKLCH con colores seguros (hex)
            svgString = svgString.replace(/oklch\([^)]+\)/g, (match) => {
              // Sustitución simple: reemplazar OKLCH con colores hexadecimales seguros
              if (match.includes('0.48')) return '#3b82f6'; // Para el color principal (azul)
              if (match.includes('0.65')) return '#f59e0b'; // Para el segundo color (naranja)
              if (match.includes('0.33')) return '#10b981'; // Para el tercer color (verde)
              if (match.includes('0.26')) return '#ef4444'; // Para el cuarto color (rojo)
              return '#6b7280'; // Color gris por defecto
            });
            
            // Crear el Blob con el SVG modificado
            const svgBlob = new Blob([svgString], {type: 'image/svg+xml;charset=utf-8'});
            const url = URL.createObjectURL(svgBlob);
            
            // Agregar la imagen al PDF cuando se cargue
            await new Promise((resolve) => {
              const img = new Image();
              img.onload = () => {
                // Calcular dimensiones manteniendo proporción
                const imgWidth = 180;
                const imgHeight = (img.height * imgWidth) / img.width;
                
                pdf.addImage(img, 'PNG', 15, yPos, imgWidth, imgHeight);
                URL.revokeObjectURL(url);
                resolve(true);
              };
              img.src = url;
            });
            
            yPos += 120; // Espacio después del gráfico
          }
        } catch (error) {
          console.error("Error al procesar el gráfico:", error);
          pdf.setFontSize(10);
          pdf.text("No se pudo incluir la visualización del gráfico.", 15, yPos);
          yPos += 10;
        }
      }
      
      // Agregar el análisis textual
      if (resultadoPronostico) {
        if (yPos > 200) {
          pdf.addPage();
          yPos = 20;
        }
        
        pdf.setFontSize(14);
        pdf.text("Análisis del pronóstico:", 15, yPos);
        yPos += 10;
        
        // Convertir HTML a texto plano
        const textoPlano = resultadoPronostico
          .replace(/<[^>]*>?/gm, '') // Eliminar etiquetas HTML
          .replace(/\n{3,}/g, '\n\n'); // Reducir múltiples saltos de línea
          
        // Dividir el texto en líneas para el PDF
        pdf.setFontSize(10);
        const lineas = pdf.splitTextToSize(textoPlano, 175);
        
        // Agregar líneas al PDF
        for (let i = 0; i < lineas.length; i++) {
          if (yPos > 270) {
            pdf.addPage();
            yPos = 20;
          }
          
          pdf.text(lineas[i], 15, yPos);
          yPos += 5;
        }
      }
      
      // Nombre del archivo basado en el indicador y fecha
      const nombreArchivo = `Pronostico_ARIMA_${indicador?.codigo || 'indicador'}_${new Date().toISOString().slice(0, 10)}.pdf`;
      
      // Guardar el PDF
      pdf.save(nombreArchivo);
    } catch (error) {
      console.error("Error al generar PDF:", error);
      alert("Ocurrió un error al generar el PDF. Por favor, intenta nuevamente en un momento.");
    } finally {
      setGenerandoPDF(false);
    }
  };

  // Renderizar los controles y el gráfico de pronóstico
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Pronóstico con modelo ARIMA</CardTitle>
            <div className="flex space-x-2">
              <Button 
                variant={mostrarGrafico ? "default" : "outline"} 
                size="sm" 
                onClick={() => setMostrarGrafico(true)}
              >
                <LineChart className="h-4 w-4 mr-1" />
                Gráfico
              </Button>
              <Button 
                variant={!mostrarGrafico ? "default" : "outline"} 
                size="sm" 
                onClick={() => setMostrarGrafico(false)}
              >
                <BarChart4 className="h-4 w-4 mr-1" />
                Informe
              </Button>
            </div>
          </div>
          <CardDescription>
            Configure los parámetros del pronóstico ARIMA para proyectar valores futuros del indicador.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="flex items-center">
                    Períodos a pronosticar
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <InfoIcon className="h-4 w-4 ml-1 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">Número de períodos futuros a pronosticar.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <span className="text-sm font-medium">{periodosForecast}</span>
                </div>
                <Slider
                  value={[periodosForecast]} 
                  min={3}
                  max={12}
                  step={1}
                  onValueChange={(value: number[]) => setPeriodosForecast(value[0])}
                  className="py-2"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="flex items-center">
                    Nivel de confianza (%)
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <InfoIcon className="h-4 w-4 ml-1 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">El nivel de confianza para los intervalos de predicción.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <span className="text-sm font-medium">{confianza}%</span>
                </div>
                <Slider
                  value={[confianza]} 
                  min={80}
                  max={99}
                  step={1}
                  onValueChange={(value: number[]) => setConfianza(value[0])}
                  className="py-2"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="estacionalidad"
                  checked={sinEstacionalidad}
                  onCheckedChange={setSinEstacionalidad}
                />
                <Label htmlFor="estacionalidad" className="flex items-center">
                  Eliminar estacionalidad
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <InfoIcon className="h-4 w-4 ml-1 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Elimina patrones estacionales para enfocarse en la tendencia principal.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="outliers"
                  checked={removerOutliers}
                  onCheckedChange={setRemoverOutliers}
                />
                <Label htmlFor="outliers" className="flex items-center">
                  Remover valores atípicos
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <InfoIcon className="h-4 w-4 ml-1 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Detecta y elimina valores extremos que pueden distorsionar el pronóstico.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center">
                  Comparar con medias móviles
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <InfoIcon className="h-4 w-4 ml-1 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Compara el pronóstico ARIMA con medias móviles de distintos períodos.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <Button 
              onClick={generarPronostico} 
              disabled={isGenerating || isLoading || !datos || datos.length === 0}
              className="w-full md:w-auto"
            >
              {isGenerating ? "Generando pronóstico..." : "Generar pronóstico ARIMA"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Visualización de resultados */}
      {resultadoPronostico && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Resultados del pronóstico</CardTitle>
                <CardDescription>
                  Pronóstico ARIMA para {indicador?.nombre} 
                  {datosPronostico.length > 0 && (
                    <>
                      {' '}(Datos hasta {formatearFecha(datos[datos.length - 1]?.fecha)})
                    </>
                  )}
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  variant={mostrarGrafico ? "default" : "outline"} 
                  size="sm" 
                  onClick={() => setMostrarGrafico(true)}
                >
                  <LineChart className="h-4 w-4 mr-1" />
                  Gráfico
                </Button>
                <Button 
                  variant={!mostrarGrafico ? "default" : "outline"} 
                  size="sm" 
                  onClick={() => setMostrarGrafico(false)}
                >
                  <BarChart4 className="h-4 w-4 mr-1" />
                  Informe
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generarPDF}
                  disabled={generandoPDF}
                >
                  {generandoPDF ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-1" />
                      Descargar PDF
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {mostrarGrafico ? (
              // Mostrar gráfico de pronóstico
              datosPronostico.length > 0 ? (
                <div className="h-[500px]" ref={graficoRef}>
                  <ChartContainer config={chartConfig}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsLineChart
                        data={datosPronostico}
                        margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis 
                          dataKey="fecha" 
                          tickFormatter={formatearFecha}
                          tickLine={false}
                          axisLine={false}
                          tickMargin={16}
                          angle={-45}
                          textAnchor="end"
                          height={100}
                        />
                        <YAxis 
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          width={60}
                          tickFormatter={(value) => value.toLocaleString('es-PE', { 
                            notation: 'compact',
                            compactDisplay: 'short'
                          })}
                        />
                        <RechartsTooltip 
                          formatter={(value: any, name: any) => {
                            if (value === null) return ['-', name];
                            const formattedValue = parseFloat(value).toFixed(2);
                            
                            // Traducir nombres para la leyenda
                            const labels: Record<string, string> = {
                              'valor': 'Valor real',
                              'pronostico': 'Pronóstico ARIMA',
                              'limiteInferior': `Límite inferior (${confianza}%)`,
                              'limiteSuperior': `Límite superior (${confianza}%)`,
                              'ma30': 'Media móvil (30)',
                              'ma60': 'Media móvil (60)',
                              'ma120': 'Media móvil (120)'
                            };
                            
                            return [formattedValue, labels[name] || name];
                          }}
                          labelFormatter={(label) => formatearFecha(label)}
                          cursor={false}
                        />
                        <Legend 
                          verticalAlign="bottom"
                          height={36}
                          wrapperStyle={{ 
                            fontSize: '12px',
                            paddingTop: '10px'
                          }}
                        />
                        
                        {/* Línea de valores reales */}
                        <Line 
                          type="monotone" 
                          dataKey="valor" 
                          stroke={chartConfig.valor.color} 
                          strokeWidth={2}
                          name="Valor real"
                          dot={{ r: 2 }}
                          activeDot={{ r: 6 }}
                          connectNulls={true}
                        />
                        
                        {/* Línea de pronóstico */}
                        <Line 
                          type="monotone" 
                          dataKey="pronostico" 
                          stroke={chartConfig.pronostico.color}
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          name="Pronóstico ARIMA"
                          dot={{ r: 3 }}
                          connectNulls={true}
                        />
                        
                        {/* Áreas para los intervalos de confianza */}
                        <Line 
                          type="monotone" 
                          dataKey="limiteInferior" 
                          stroke="#D1D5DB"
                          strokeWidth={1}
                          strokeDasharray="3 3"
                          name={`Límite inferior (${confianza}%)`}
                          dot={false}
                          connectNulls={true}
                        />
                        
                        <Line 
                          type="monotone" 
                          dataKey="limiteSuperior" 
                          stroke="#D1D5DB"
                          strokeWidth={1}
                          strokeDasharray="3 3"
                          name={`Límite superior (${confianza}%)`}
                          dot={false}
                          connectNulls={true}
                        />
                        
                        {/* Líneas de medias móviles */}
                        <Line 
                          type="monotone" 
                          dataKey="ma30" 
                          stroke={chartConfig.ma30.color}
                          strokeWidth={1.5}
                          name="Media móvil (30)"
                          dot={false}
                          connectNulls={true}
                        />
                        
                        <Line 
                          type="monotone" 
                          dataKey="ma60" 
                          stroke={chartConfig.ma60.color}
                          strokeWidth={1.5}
                          name="Media móvil (60)"
                          dot={false}
                          connectNulls={true}
                        />
                        
                        <Line 
                          type="monotone" 
                          dataKey="ma120" 
                          stroke={chartConfig.ma120.color}
                          strokeWidth={1.5}
                          name="Media móvil (120)"
                          dot={false}
                          connectNulls={true}
                        />
                      </RechartsLineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center">
                  <p className="text-muted-foreground">
                    Aún no hay datos de pronóstico disponibles. Genere un pronóstico para visualizar los resultados.
                  </p>
                </div>
              )
            ) : (
              // Mostrar informe textual del pronóstico
              <div className="prose prose-slate max-w-none dark:prose-invert p-2">
                <div className="bg-white rounded-lg p-6 shadow-sm" ref={resultadoRef} dangerouslySetInnerHTML={{ __html: markdownToHtml(resultadoPronostico) }} />
              </div>
            )}
          </CardContent>
          <CardFooter>
            <p className="text-xs text-muted-foreground">
              * El pronóstico ARIMA es una estimación basada en patrones históricos y no garantiza resultados futuros.
            </p>
          </CardFooter>
        </Card>
      )}
    </div>
  );
} 