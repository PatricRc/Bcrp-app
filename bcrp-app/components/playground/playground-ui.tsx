"use client";

import { useState, useEffect, useRef } from "react";
import { 
  INDICADORES_DIARIOS, 
  INDICADORES_MENSUALES, 
  INDICADORES_ANUALES,
  COLORES_GRAFICOS 
} from "@/lib/constants";
import { IndicadorBCRP, RespuestaBCRP, TipoAnalisis } from "@/lib/types";
import { obtenerDatosIndicador } from "@/lib/services/bcrp-service";
import { generarAnalisisComparativo } from "@/lib/services/gemini-service";
import { Loader2, Info, Download } from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  Slider 
} from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IndicadorChart } from "@/components/explorar/indicador-chart";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export function PlaygroundUI() {
  // Estados para selección de indicadores y fechas
  const [indicador1, setIndicador1] = useState<IndicadorBCRP | null>(null);
  const [indicador2, setIndicador2] = useState<IndicadorBCRP | null>(null);
  const [tipoAnalisis, setTipoAnalisis] = useState<TipoAnalisis>("tendencia");
  const [fechaInicio, setFechaInicio] = useState<string>("");
  const [fechaFin, setFechaFin] = useState<string>("");
  
  // Estados para datos y UI
  const [datosIndicador1, setDatosIndicador1] = useState<RespuestaBCRP | null>(null);
  const [datosIndicador2, setDatosIndicador2] = useState<RespuestaBCRP | null>(null);
  const [datosGrafico, setDatosGrafico] = useState<any[]>([]);
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState<string>("");
  const [cargandoResultado, setCargandoResultado] = useState(false);
  const [generandoPDF, setGenerandoPDF] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Referencias para capturar elementos para el PDF
  const resultadoRef = useRef<HTMLDivElement>(null);
  const graficoRef = useRef<HTMLDivElement>(null);
  
  // Estados para opciones de pronóstico
  const [periodosForecast, setPeriodosForecast] = useState<number>(6);
  const [confianza, setConfianza] = useState<number>(95);
  const [sinEstacionalidad, setSinEstacionalidad] = useState<boolean>(false);
  const [removerOutliers, setRemoverOutliers] = useState<boolean>(false);
  
  // Inicializar fechas por defecto
  useEffect(() => {
    try {
      // Fecha fin: hoy
      const hoy = new Date();
      const fechaFinStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
      setFechaFin(fechaFinStr);
      
      // Fecha inicio: 1 año atrás
      const inicioAño = new Date();
      inicioAño.setFullYear(inicioAño.getFullYear() - 1);
      const fechaInicioStr = `${inicioAño.getFullYear()}-${String(inicioAño.getMonth() + 1).padStart(2, '0')}`;
      setFechaInicio(fechaInicioStr);
    } catch (err) {
      console.error("Error initializing dates:", err);
      setError("Error al inicializar las fechas");
    }
  }, []);
  
  // Obtener todos los indicadores para selección
  const todosLosIndicadores = [...INDICADORES_DIARIOS, ...INDICADORES_MENSUALES, ...INDICADORES_ANUALES];
  
  // Función para cargar datos de los indicadores seleccionados
  const cargarDatos = async () => {
    if (!indicador1) return;
    
    try {
      setCargando(true);
      setDatosGrafico([]);
      setResultado("");
      setError(null);
      
      // Cargar datos del primer indicador
      const datos1 = await obtenerDatosIndicador(indicador1.codigo, fechaInicio, fechaFin);
      setDatosIndicador1(datos1);
      
      // Si hay un segundo indicador, cargar también
      let datos2 = null;
      if (indicador2) {
        datos2 = await obtenerDatosIndicador(indicador2.codigo, fechaInicio, fechaFin);
        setDatosIndicador2(datos2);
      }
      
      // Preparar datos para visualización
      prepararDatosTendencia(datos1, datos2);
      
    } catch (error) {
      console.error("Error al cargar datos:", error);
      setError("Error al cargar los datos. Por favor, intente nuevamente.");
    } finally {
      setCargando(false);
    }
  };
  
  // Preparar datos para gráfico de tendencia
  const prepararDatosTendencia = (datos1: RespuestaBCRP, datos2: RespuestaBCRP | null) => {
    try {
      if (!datos1) return;
      
      // Crear conjunto de fechas únicas
      const todasFechas = new Set<string>();
      
      datos1.datos.forEach(d => todasFechas.add(d.fecha));
      if (datos2) {
        datos2.datos.forEach(d => todasFechas.add(d.fecha));
      }
      
      // Ordenar fechas
      const fechasOrdenadas = Array.from(todasFechas).sort((a, b) => {
        return new Date(a).getTime() - new Date(b).getTime();
      });
      
      // Preparar datos para el gráfico
      const datosGrafico = fechasOrdenadas.map(fecha => {
        const punto: any = { fecha };
        
        const dato1 = datos1.datos.find(d => d.fecha === fecha);
        if (dato1) {
          punto[datos1.codigo] = parseFloat(String(dato1.valor)) || 0;
        }
        
        if (datos2) {
          const dato2 = datos2.datos.find(d => d.fecha === fecha);
          if (dato2) {
            punto[datos2.codigo] = parseFloat(String(dato2.valor)) || 0;
          }
        }
        
        return punto;
      });
      
      setDatosGrafico(datosGrafico);
    } catch (error) {
      console.error("Error preparing trend data:", error);
      setError("Error al preparar los datos para visualización");
    }
  };
  
  // Generar análisis con IA
  const generarAnalisis = async () => {
    if (!indicador1 || !datosIndicador1) return;
    
    try {
      setCargandoResultado(true);
      setError(null);
      
      // Preparar información adicional para el tipo de análisis
      const informacionAdicional = tipoAnalisis === "pronostico" 
        ? {
            periodosForecast, 
            confianza, 
            sinEstacionalidad,
            removerOutliers,
            comparacionMA: true,
            periodosMA: [30, 60, 120]
          }
        : undefined;
      
      let analisis;
      
      // Si tenemos un segundo indicador, generamos análisis comparativo
      if (indicador2 && datosIndicador2) {
        analisis = await generarAnalisisComparativo(
          datosIndicador1, 
          datosIndicador2, 
          tipoAnalisis, 
          informacionAdicional
        );
      } else {
        // Si solo tenemos un indicador, generamos análisis individual
        analisis = await generarAnalisisComparativo(
          datosIndicador1, 
          datosIndicador1, 
          tipoAnalisis, 
          informacionAdicional
        );
      }
      
      setResultado(analisis.texto || "");
    } catch (error) {
      console.error("Error al generar análisis:", error);
      setResultado("Lo sentimos, ha ocurrido un error al generar el análisis. Por favor, intenta nuevamente.");
    } finally {
      setCargandoResultado(false);
    }
  };
  
  // Obtener indicadores para gráfico
  const obtenerIndicadoresGrafico = (): IndicadorBCRP[] => {
    const indicadores = [];
    if (indicador1) indicadores.push(indicador1);
    if (indicador2) indicadores.push(indicador2);
    return indicadores;
  };
  
  // Función para generar y descargar el reporte PDF
  const generarPDF = async () => {
    if (!resultadoRef.current || !graficoRef.current || !resultado) return;
    
    try {
      setGenerandoPDF(true);
      setError(null);
      
      // Importar dinámicamente jsPDF y html2canvas
      const [jsPDFModule, html2canvasModule] = await Promise.all([
        import('jspdf'),
        import('html2canvas')
      ]);
      
      const jsPDF = jsPDFModule.default;
      const html2canvas = html2canvasModule.default;
      
      // Crear un nuevo documento PDF A4
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Configurar título del documento
      const titulo = `Análisis: ${indicador1?.nombre || 'Indicador'}`;
      pdf.setFontSize(16);
      pdf.text(titulo, 15, 15);
      
      // Información del análisis
      pdf.setFontSize(10);
      pdf.text(`Tipo de análisis: ${tipoAnalisis}`, 15, 22);
      pdf.text(`Indicador: ${indicador1?.nombre || 'No especificado'}`, 15, 27);
      pdf.text(`Generado el: ${new Date().toLocaleDateString()}`, 15, 32);
      
      // Línea divisoria
      pdf.setDrawColor(200, 200, 200);
      pdf.line(15, 35, 195, 35);
      
      let yPos = 40;
      
      // Capturar el gráfico de forma segura
      if (graficoRef.current) {
        try {
          // Usar html2canvas directamente para mayor compatibilidad
          const canvasElement = await html2canvas(graficoRef.current, {
            scale: 1.5,
            backgroundColor: '#ffffff',
            logging: false,
            useCORS: true,
          });
          
          if (canvasElement) {
            const imgData = canvasElement.toDataURL('image/jpeg', 0.95);
            
            pdf.text("Visualización del indicador:", 15, yPos);
            yPos += 8;
            
            const imgWidth = 180;
            const imgHeight = (canvasElement.height * imgWidth) / canvasElement.width;
            
            // Verificar si necesitamos una nueva página
            if (yPos + imgHeight > 280) {
              pdf.addPage();
              yPos = 20;
            }
            
            pdf.addImage(imgData, 'JPEG', 15, yPos, imgWidth, imgHeight);
            yPos += imgHeight + 10;
          }
        } catch (chartError) {
          console.error("Error capturing chart:", chartError);
          pdf.text("Error al generar la visualización del gráfico.", 15, yPos);
          yPos += 10;
        }
      }
      
      // Crear y capturar el análisis textual
      if (resultado) {
        try {
          // Verificar si necesitamos una nueva página
          if (yPos > 200) {
            pdf.addPage();
            yPos = 20;
          }
          
          // Convertir markdown a texto plano para el PDF
          const textoPlano = resultado
            .replace(/#{1,6}\s*(.*)/g, '$1') // Eliminar marcadores de encabezado
            .replace(/\*\*(.*?)\*\*/g, '$1') // Eliminar negritas
            .replace(/\*(.*?)\*/g, '$1') // Eliminar cursivas
            .replace(/`(.*?)`/g, '$1') // Eliminar código inline
            .replace(/```[\s\S]*?```/g, '') // Eliminar bloques de código
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convertir enlaces a solo texto
            .replace(/\n\s*\n/g, '\n'); // Limpiar líneas vacías múltiples
          
          pdf.text("Análisis:", 15, yPos);
          yPos += 8;
          
          // Dividir el texto en líneas que quepan en la página
          const lineas = pdf.splitTextToSize(textoPlano, 170);
          
          // Agregar texto línea por línea, manejando saltos de página
          lineas.forEach((linea: string) => {
            if (yPos > 280) {
              pdf.addPage();
              yPos = 20;
            }
            pdf.text(linea, 15, yPos);
            yPos += 5;
          });
          
        } catch (textError) {
          console.error("Error processing analysis text:", textError);
          pdf.text("Error al procesar el análisis textual.", 15, yPos);
        }
      }
      
      // Nombre del archivo basado en el indicador y fecha
      const nombreArchivo = `Analisis_${tipoAnalisis}_${indicador1?.codigo || 'indicador'}_${new Date().toISOString().slice(0, 10)}.pdf`;
      
      // Guardar el PDF
      pdf.save(nombreArchivo);
    } catch (error) {
      console.error("Error al generar PDF:", error);
      setError("Ocurrió un error al generar el PDF. Por favor, intente nuevamente.");
    } finally {
      setGenerandoPDF(false);
    }
  };
  
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Panel izquierdo - Controles */}
      <div className="lg:col-span-1">
        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Indicador 1 (Principal)
            </label>
            <select
              value={indicador1?.codigo || ""}
              onChange={(e) => {
                const indicador = todosLosIndicadores.find(i => i.codigo === e.target.value);
                setIndicador1(indicador || null);
              }}
              className="w-full rounded-lg border border-gray-300 p-2 text-sm"
            >
              <option value="">Seleccione un indicador</option>
              <optgroup label="Indicadores Diarios">
                {INDICADORES_DIARIOS.map(i => (
                  <option key={i.codigo} value={i.codigo}>
                    {i.nombre} ({i.codigo})
                  </option>
                ))}
              </optgroup>
              <optgroup label="Indicadores Mensuales">
                {INDICADORES_MENSUALES.map(i => (
                  <option key={i.codigo} value={i.codigo}>
                    {i.nombre} ({i.codigo})
                  </option>
                ))}
              </optgroup>
              <optgroup label="Indicadores Anuales">
                {INDICADORES_ANUALES.map(i => (
                  <option key={i.codigo} value={i.codigo}>
                    {i.nombre} ({i.codigo})
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
          
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Indicador 2 (Opcional)
            </label>
            <select
              value={indicador2?.codigo || ""}
              onChange={(e) => {
                if (e.target.value === "") {
                  setIndicador2(null);
                } else {
                  const indicador = todosLosIndicadores.find(i => i.codigo === e.target.value);
                  setIndicador2(indicador || null);
                }
              }}
              className="w-full rounded-lg border border-gray-300 p-2 text-sm"
            >
              <option value="">Ninguno</option>
              <optgroup label="Indicadores Diarios">
                {INDICADORES_DIARIOS.map(i => (
                  <option key={i.codigo} value={i.codigo} disabled={i.codigo === indicador1?.codigo}>
                    {i.nombre} ({i.codigo})
                  </option>
                ))}
              </optgroup>
              <optgroup label="Indicadores Mensuales">
                {INDICADORES_MENSUALES.map(i => (
                  <option key={i.codigo} value={i.codigo} disabled={i.codigo === indicador1?.codigo}>
                    {i.nombre} ({i.codigo})
                  </option>
                ))}
              </optgroup>
              <optgroup label="Indicadores Anuales">
                {INDICADORES_ANUALES.map(i => (
                  <option key={i.codigo} value={i.codigo} disabled={i.codigo === indicador1?.codigo}>
                    {i.nombre} ({i.codigo})
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
          
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Tipo de Análisis
            </label>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <button
                className={`rounded-lg border px-4 py-2 text-sm ${
                  tipoAnalisis === "tendencia"
                    ? "border-[#002B5B] bg-blue-50 text-[#002B5B]"
                    : "border-gray-300 hover:bg-gray-50"
                }`}
                onClick={() => setTipoAnalisis("tendencia")}
              >
                Tendencia
              </button>
              <button
                className={`rounded-lg border px-4 py-2 text-sm ${
                  tipoAnalisis === "correlacion"
                    ? "border-[#002B5B] bg-blue-50 text-[#002B5B]"
                    : "border-gray-300 hover:bg-gray-50"
                }`}
                onClick={() => setTipoAnalisis("correlacion")}
                disabled={!indicador2}
              >
                Correlación
              </button>
              <button
                className={`rounded-lg border px-4 py-2 text-sm ${
                  tipoAnalisis === "pronostico"
                    ? "border-[#002B5B] bg-blue-50 text-[#002B5B]"
                    : "border-gray-300 hover:bg-gray-50"
                }`}
                onClick={() => setTipoAnalisis("pronostico")}
              >
                Pronóstico
              </button>
              <button
                className={`rounded-lg border px-4 py-2 text-sm ${
                  tipoAnalisis === "reporte"
                    ? "border-[#002B5B] bg-blue-50 text-[#002B5B]"
                    : "border-gray-300 hover:bg-gray-50"
                }`}
                onClick={() => setTipoAnalisis("reporte")}
              >
                Reporte
              </button>
            </div>
          </div>
          
          {/* Opciones adicionales para pronóstico */}
          {tipoAnalisis === "pronostico" && (
            <div className="space-y-4 rounded-lg border border-gray-200 p-4 bg-gray-50">
              <h4 className="font-medium text-sm text-gray-700 mb-2 flex items-center">
                Opciones de Pronóstico ARIMA
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 ml-1 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs text-xs">
                        El modelo ARIMA (AutoRegressive Integrated Moving Average) es utilizado para análisis de series temporales y pronósticos.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </h4>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-600">Períodos de pronóstico</label>
                  <span className="text-sm font-medium">{periodosForecast}</span>
                </div>
                <Slider
                  value={[periodosForecast]}
                  min={1}
                  max={24}
                  step={1}
                  onValueChange={(value) => setPeriodosForecast(value[0])}
                  className="py-1"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-600">Nivel de confianza (%)</label>
                  <span className="text-sm font-medium">{confianza}%</span>
                </div>
                <Slider
                  value={[confianza]}
                  min={75}
                  max={99}
                  step={1}
                  onValueChange={(value) => setConfianza(value[0])}
                  className="py-1"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="sin-estacionalidad"
                  checked={sinEstacionalidad}
                  onCheckedChange={setSinEstacionalidad}
                />
                <Label htmlFor="sin-estacionalidad" className="text-sm text-gray-600">
                  Eliminar estacionalidad
                </Label>
              </div>

              <div className="flex items-center space-x-2 mt-3">
                <Switch
                  id="remover-outliers"
                  checked={removerOutliers}
                  onCheckedChange={setRemoverOutliers}
                />
                <Label htmlFor="remover-outliers" className="text-sm text-gray-600 flex items-center">
                  Remover valores atípicos
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 ml-1 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs text-xs">
                          Detecta y elimina valores extremos que pueden distorsionar el pronóstico.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Fecha Inicio
              </label>
              <input
                type="month"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="w-full rounded-lg border border-gray-300 p-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Fecha Fin
              </label>
              <input
                type="month"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="w-full rounded-lg border border-gray-300 p-2 text-sm"
              />
            </div>
          </div>
          
          <div className="pt-2">
            <button
              onClick={cargarDatos}
              disabled={!indicador1 || cargando}
              className="w-full rounded-lg bg-[#002B5B] py-2 text-center text-white transition-colors hover:bg-[#003b7a] disabled:cursor-not-allowed disabled:bg-gray-300 disabled:hover:bg-gray-300"
            >
              {cargando ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cargando...
                </span>
              ) : (
                "Visualizar Datos"
              )}
            </button>
          </div>
          
          {/* Mostrar errores si los hay */}
          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          
          {datosGrafico.length > 0 && (
            <div className="pt-2">
              <button
                onClick={generarAnalisis}
                disabled={cargandoResultado}
                className="w-full rounded-lg border border-[#002B5B] bg-white py-2 text-center text-[#002B5B] transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:border-gray-300 disabled:bg-gray-100 disabled:text-gray-400"
              >
                {cargandoResultado ? (
                  <span className="flex items-center justify-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generando...
                  </span>
                ) : (
                  "Generar Análisis con IA"
                )}
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Panel derecho - Visualización */}
      <div className="lg:col-span-2">
        {error && !cargando && !datosGrafico.length ? (
          <div className="flex h-80 flex-col items-center justify-center rounded-lg border border-red-200 bg-red-50 p-8 text-center">
            <div className="mb-4 text-4xl text-red-400">⚠️</div>
            <h3 className="mb-2 text-lg font-medium text-red-700">
              Error
            </h3>
            <p className="text-sm text-red-600">
              {error}
            </p>
          </div>
        ) : cargando ? (
          <div className="flex h-80 items-center justify-center rounded-lg border bg-gray-50">
            <Loader2 className="mr-2 h-8 w-8 animate-spin text-[#002B5B]" />
            <span>Cargando datos...</span>
          </div>
        ) : datosGrafico.length > 0 ? (
          <div className="space-y-6">
            {/* Gráfico - Usando el mismo componente de Explorar */}
            <div className="h-96 overflow-hidden rounded-lg border bg-white p-4" ref={graficoRef}>
              <IndicadorChart 
                datos={datosGrafico} 
                indicadores={obtenerIndicadoresGrafico()} 
              />
            </div>
            
            {/* Análisis */}
            {resultado && (
              <div className="rounded-lg border bg-white overflow-hidden">
                <div className="flex justify-between items-center px-6 py-4 border-b">
                  <h3 className="text-lg font-semibold text-[#002B5B]">
                    Análisis
                  </h3>
                  <button 
                    onClick={generarPDF}
                    disabled={generandoPDF}
                    className="flex items-center text-sm text-[#002B5B] hover:text-blue-700 disabled:opacity-50"
                  >
                    {generandoPDF ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        Generando PDF...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-1" />
                        Descargar reporte
                      </>
                    )}
                  </button>
                </div>
                <div 
                  className="p-6 prose prose-sm max-w-none" 
                  ref={resultadoRef}
                  dangerouslySetInnerHTML={{ __html: safeMarkdownToHtml(resultado) }} 
                />
              </div>
            )}
          </div>
        ) : (
          <div className="flex h-80 flex-col items-center justify-center rounded-lg border bg-gray-50 p-8 text-center">
            <div className="mb-4 text-6xl text-gray-300">📊</div>
            <h3 className="mb-2 text-lg font-medium text-gray-700">
              Seleccione indicadores para visualizar
            </h3>
            <p className="text-sm text-gray-500">
              Configure los parámetros en el panel izquierdo y haga clic en "Visualizar Datos".
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Función auxiliar para convertir markdown a HTML de forma segura
function safeMarkdownToHtml(markdown: string): string {
  try {
    if (!markdown || typeof markdown !== 'string') {
      return '<p>No hay contenido disponible.</p>';
    }

    // Escapar caracteres HTML peligrosos
    let html = markdown
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');

    // Convertir encabezados
    html = html
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-medium mt-6 mb-3">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mt-8 mb-4">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-6 mb-5">$1</h1>');
    
    // Convertir énfasis
    html = html
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>');
    
    // Convertir enlaces (restaurando caracteres escapados para URLs)
    html = html.replace(/\[([^\]]+)]\(([^)]+)\)/gim, (match, text, url) => {
      const cleanUrl = url.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
      return `<a href="${cleanUrl}" class="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">${text}</a>`;
    });
    
    // Convertir listas numeradas de forma más segura
    const lines = html.split('\n');
    const result: string[] = [];
    let inOrderedList = false;
    let inUnorderedList = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const orderedMatch = line.match(/^\s*(\d+)\.\s+(.*)$/);
      const unorderedMatch = line.match(/^\s*[-*]\s+(.*)$/);
      
      if (orderedMatch) {
        if (inUnorderedList) {
          result.push('</ul>');
          inUnorderedList = false;
        }
        if (!inOrderedList) {
          result.push('<ol class="list-decimal list-inside my-4 space-y-1">');
          inOrderedList = true;
        }
        result.push(`<li>${orderedMatch[2]}</li>`);
      } else if (unorderedMatch) {
        if (inOrderedList) {
          result.push('</ol>');
          inOrderedList = false;
        }
        if (!inUnorderedList) {
          result.push('<ul class="list-disc list-inside my-4 space-y-1">');
          inUnorderedList = true;
        }
        result.push(`<li>${unorderedMatch[1]}</li>`);
      } else {
        if (inOrderedList) {
          result.push('</ol>');
          inOrderedList = false;
        }
        if (inUnorderedList) {
          result.push('</ul>');
          inUnorderedList = false;
        }
        result.push(line);
      }
    }
    
    // Cerrar listas abiertas
    if (inOrderedList) {
      result.push('</ol>');
    }
    if (inUnorderedList) {
      result.push('</ul>');
    }
    
    html = result.join('\n');
    
    // Convertir código en línea
    html = html.replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 rounded bg-gray-100 font-mono text-sm">$1</code>');
    
    // Convertir bloques de código
    html = html.replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-100 p-4 rounded-md overflow-x-auto my-4 font-mono text-sm whitespace-pre">$1</pre>');
    
    // Convertir saltos de línea en párrafos de forma más cuidadosa
    const paragraphs = html.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    html = paragraphs.map(p => {
      const trimmed = p.trim();
      // No envolver en <p> si ya es un elemento de bloque
      if (trimmed.startsWith('<h') || trimmed.startsWith('<ul') || 
          trimmed.startsWith('<ol') || trimmed.startsWith('<pre') ||
          trimmed.startsWith('<div') || trimmed.startsWith('<table')) {
        return trimmed;
      }
      return `<p class="mb-4">${trimmed}</p>`;
    }).join('\n');
    
    return html;
    
  } catch (error) {
    console.error('Error converting markdown to HTML:', error);
    return '<p class="text-red-600">Error al procesar el contenido.</p>';
  }
} 