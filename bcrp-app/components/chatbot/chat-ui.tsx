"use client";

import { useState, useRef, useEffect } from "react";
import { generarRespuestaChatbot } from "@/lib/services/gemini-service";
import { obtenerDatosIndicador } from "@/lib/services/bcrp-service";
import { ArrowUpIcon, Calendar, CalendarIcon, Loader2, Save, Search, Tag, TrashIcon } from "lucide-react";
import { MensajeChat, IndicadorBCRP, RespuestaBCRP } from "@/lib/types";
import { v4 as uuidv4 } from "uuid";
import { INDICADORES_DIARIOS, INDICADORES_MENSUALES, INDICADORES_ANUALES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { format, subMonths } from "date-fns";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function ChatUI() {
  const [mensajes, setMensajes] = useState<MensajeChat[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [cargando, setCargando] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [indicadoresSeleccionados, setIndicadoresSeleccionados] = useState<IndicadorBCRP[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subMonths(new Date(), 6),
    to: new Date()
  });
  const [indicadoresData, setIndicadoresData] = useState<Record<string, RespuestaBCRP>>({});
  const [cargandoIndicadores, setCargandoIndicadores] = useState(false);
  
  // Auto-scroll al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);
  
  // Mensaje de bienvenida
  useEffect(() => {
    if (mensajes.length === 0) {
      setMensajes([
        {
          id: uuidv4(),
          contenido: "¡Hola! Soy tu asistente económico especializado en datos del BCRP. Puedes seleccionar indicadores económicos y un rango de fechas para obtener análisis más precisos sobre la economía peruana. ¿En qué puedo ayudarte hoy?",
          esUsuario: false,
          timestamp: new Date().toISOString()
        }
      ]);
    }
  }, []);
  
  // Cargar datos de indicadores cuando se seleccionan
  useEffect(() => {
    const cargarDatosIndicadores = async () => {
      if (indicadoresSeleccionados.length === 0 || !dateRange.from) return;
      
      setCargandoIndicadores(true);
      
      try {
        const nuevosIndicadoresData: Record<string, RespuestaBCRP> = {};
        
        for (const indicador of indicadoresSeleccionados) {
          // Formatear fechas para la API
          const fechaInicio = format(dateRange.from, 'yyyy-MM');
          const fechaFin = dateRange.to ? format(dateRange.to, 'yyyy-MM') : format(new Date(), 'yyyy-MM');
          
          try {
            const datos = await obtenerDatosIndicador(indicador.codigo, fechaInicio, fechaFin);
            if (datos && datos.datos && datos.datos.length > 0) {
              nuevosIndicadoresData[indicador.codigo] = datos;
            }
          } catch (error) {
            console.error(`Error al obtener datos para ${indicador.codigo}:`, error);
          }
        }
        
        setIndicadoresData(nuevosIndicadoresData);
      } catch (error) {
        console.error("Error al cargar datos de indicadores:", error);
      } finally {
        setCargandoIndicadores(false);
      }
    };
    
    cargarDatosIndicadores();
  }, [indicadoresSeleccionados, dateRange]);
  
  // Manejar selección de indicador
  const toggleIndicador = (indicador: IndicadorBCRP) => {
    if (indicadoresSeleccionados.some(i => i.codigo === indicador.codigo)) {
      setIndicadoresSeleccionados(prev => prev.filter(i => i.codigo !== indicador.codigo));
    } else {
      if (indicadoresSeleccionados.length < 3) {
        setIndicadoresSeleccionados(prev => [...prev, indicador]);
      }
    }
  };
  
  // Manejar envío de mensaje
  const enviarMensaje = async () => {
    if (!inputValue.trim() || cargando) return;
    
    // Agregar mensaje del usuario
    const mensajeUsuario: MensajeChat = {
      id: uuidv4(),
      contenido: inputValue,
      esUsuario: true,
      timestamp: new Date().toISOString()
    };
    
    setMensajes(prev => [...prev, mensajeUsuario]);
    setInputValue("");
    setCargando(true);
    
    try {
      // Preparar contexto con los datos de indicadores seleccionados
      let contextoIndicadores = "";
      
      if (indicadoresSeleccionados.length > 0) {
        contextoIndicadores += `\n\n# Datos económicos contextuales (${dateRange.from ? format(dateRange.from, 'dd/MM/yyyy') : ''} - ${dateRange.to ? format(dateRange.to, 'dd/MM/yyyy') : format(new Date(), 'dd/MM/yyyy')}):\n\n`;
        
        for (const indicador of indicadoresSeleccionados) {
          const datos = indicadoresData[indicador.codigo];
          if (datos && datos.datos && datos.datos.length > 0) {
            contextoIndicadores += `## ${datos.nombre} (${indicador.codigo})\n`;
            contextoIndicadores += `Unidad: ${indicador.unidad}\n`;
            contextoIndicadores += `Datos: \n`;
            
            // Limitar a máximo 20 registros para no sobrecargar el contexto
            const datosAMostrar = datos.datos.slice(-20);
            for (const dato of datosAMostrar) {
              contextoIndicadores += `- ${dato.fecha}: ${dato.valor}\n`;
            }
            
            contextoIndicadores += '\n';
          }
        }
      }
      
      // Obtener últimos 3 mensajes para contexto conversacional
      const ultimosMensajes = mensajes.slice(-3).map(m => 
        `${m.esUsuario ? 'Usuario' : 'Asistente'}: ${m.contenido}`
      ).join('\n');
      
      const contextoCompleto = `${ultimosMensajes}\n${contextoIndicadores}`;
      
      // Generar respuesta con RAG y web search
      const respuesta = await generarRespuestaChatbot(inputValue, contextoCompleto, true);
      
      // Agregar respuesta del bot
      const mensajeBot: MensajeChat = {
        id: uuidv4(),
        contenido: respuesta.texto,
        esUsuario: false,
        timestamp: new Date().toISOString(),
        fuentes: respuesta.fuentes || []
      };
      
      setMensajes(prev => [...prev, mensajeBot]);
    } catch (error) {
      console.error("Error al generar respuesta:", error);
      
      // Mensaje de error
      const mensajeError: MensajeChat = {
        id: uuidv4(),
        contenido: "Lo siento, ha ocurrido un error al procesar tu consulta. Por favor, intenta nuevamente.",
        esUsuario: false,
        timestamp: new Date().toISOString()
      };
      
      setMensajes(prev => [...prev, mensajeError]);
    } finally {
      setCargando(false);
    }
  };
  
  // Limpiar chat
  const limpiarChat = () => {
    setMensajes([
      {
        id: uuidv4(),
        contenido: "¡Hola! Soy tu asistente económico especializado en datos del BCRP. Puedes seleccionar indicadores económicos y un rango de fechas para obtener análisis más precisos sobre la economía peruana. ¿En qué puedo ayudarte hoy?",
        esUsuario: false,
        timestamp: new Date().toISOString()
      }
    ]);
    setIndicadoresSeleccionados([]);
    setDateRange({
      from: subMonths(new Date(), 6),
      to: new Date()
    });
    setIndicadoresData({});
  };
  
  // Guardar conversación
  const guardarConversacion = () => {
    // Crear texto con la conversación
    const textoConversacion = mensajes
      .map(m => `${m.esUsuario ? 'Usuario' : 'Asistente'}: ${m.contenido}`)
      .join('\n\n');
    
    // Crear un blob y enlace de descarga
    const blob = new Blob([textoConversacion], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversacion-bcrp-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Agrupar todos los indicadores
  const todosLosIndicadores = [
    ...INDICADORES_DIARIOS.map(i => ({ ...i, categoria: 'diario' })),
    ...INDICADORES_MENSUALES.map(i => ({ ...i, categoria: 'mensual' })),
    ...INDICADORES_ANUALES.map(i => ({ ...i, categoria: 'anual' }))
  ];
  
  return (
    <div className="flex h-[80vh] flex-col">
      {/* Barra superior con acciones */}
      <div className="flex items-center justify-between border-b p-4">
        <h2 className="text-lg font-medium text-[#002B5B]">Asistente Económico BCRP</h2>
        
        <div className="flex gap-2">
          {/* Selector de indicadores */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-1">
                <Tag className="h-4 w-4" />
                <span>Indicadores</span>
                {indicadoresSeleccionados.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                    {indicadoresSeleccionados.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[350px] p-3">
              <div className="space-y-2">
                <h4 className="font-medium text-sm mb-2">Seleccionar indicadores</h4>
                <Tabs defaultValue="diario">
                  <TabsList className="grid grid-cols-3 mb-2">
                    <TabsTrigger value="diario">Diarios</TabsTrigger>
                    <TabsTrigger value="mensual">Mensuales</TabsTrigger>
                    <TabsTrigger value="anual">Anuales</TabsTrigger>
                  </TabsList>
                  <TabsContent value="diario" className="mt-2 max-h-[200px] overflow-y-auto">
                    <div className="grid grid-cols-1 gap-1">
                      {INDICADORES_DIARIOS.map(indicador => (
                        <Button
                          key={indicador.codigo}
                          variant={indicadoresSeleccionados.some(i => i.codigo === indicador.codigo) ? "default" : "outline"}
                          size="sm"
                          className="justify-start h-auto py-1 px-2 text-xs"
                          onClick={() => toggleIndicador(indicador)}
                        >
                          {indicador.nombre}
                        </Button>
                      ))}
                    </div>
                  </TabsContent>
                  <TabsContent value="mensual" className="mt-2 max-h-[200px] overflow-y-auto">
                    <div className="grid grid-cols-1 gap-1">
                      {INDICADORES_MENSUALES.map(indicador => (
                        <Button
                          key={indicador.codigo}
                          variant={indicadoresSeleccionados.some(i => i.codigo === indicador.codigo) ? "default" : "outline"}
                          size="sm"
                          className="justify-start h-auto py-1 px-2 text-xs"
                          onClick={() => toggleIndicador(indicador)}
                        >
                          {indicador.nombre}
                        </Button>
                      ))}
                    </div>
                  </TabsContent>
                  <TabsContent value="anual" className="mt-2 max-h-[200px] overflow-y-auto">
                    <div className="grid grid-cols-1 gap-1">
                      {INDICADORES_ANUALES.map(indicador => (
                        <Button
                          key={indicador.codigo}
                          variant={indicadoresSeleccionados.some(i => i.codigo === indicador.codigo) ? "default" : "outline"}
                          size="sm"
                          className="justify-start h-auto py-1 px-2 text-xs"
                          onClick={() => toggleIndicador(indicador)}
                        >
                          {indicador.nombre}
                        </Button>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
                {indicadoresSeleccionados.length > 0 && (
                  <div className="pt-2 border-t mt-3">
                    <h4 className="font-medium text-sm mb-2">Indicadores seleccionados:</h4>
                    <div className="flex flex-wrap gap-1">
                      {indicadoresSeleccionados.map(indicador => (
                        <Badge 
                          key={indicador.codigo}
                          variant="secondary"
                          className="cursor-pointer"
                          onClick={() => toggleIndicador(indicador)}
                        >
                          {indicador.nombre}
                          <span className="ml-1 opacity-70">&times;</span>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {cargandoIndicadores && (
                  <div className="flex justify-center py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* Selector de rango de fechas */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-1">
                <CalendarIcon className="h-4 w-4" />
                <span className="hidden sm:inline-block">Fechas</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3" align="end">
              <DatePickerWithRange
                dateRange={dateRange}
                setDateRange={setDateRange}
              />
            </PopoverContent>
          </Popover>

          <button
            onClick={guardarConversacion}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
            title="Guardar conversación"
          >
            <Save className="h-5 w-5" />
          </button>
          
          <button
            onClick={limpiarChat}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
            title="Limpiar conversación"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      {/* Área de mensajes */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {mensajes.map((mensaje) => (
            <div
              key={mensaje.id}
              className={`flex ${
                mensaje.esUsuario ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  mensaje.esUsuario
                    ? 'bg-[#002B5B] text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {mensaje.esUsuario ? (
                  mensaje.contenido
                ) : (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({node, ...props}) => <p className="my-2" {...props} />,
                      h1: ({node, ...props}) => <h1 className="text-xl font-bold mt-4 mb-2" {...props} />,
                      h2: ({node, ...props}) => <h2 className="text-lg font-bold mt-3 mb-2" {...props} />,
                      h3: ({node, ...props}) => <h3 className="text-md font-bold mt-3 mb-1" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc pl-6 my-2" {...props} />,
                      ol: ({node, ...props}) => <ol className="list-decimal pl-6 my-2" {...props} />,
                      li: ({node, ...props}) => <li className="my-1" {...props} />,
                      a: ({node, ...props}) => <a className="text-blue-600 underline" {...props} />,
                      blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-gray-300 pl-4 italic my-2" {...props} />,
                      code: ({node, inline, className, ...props}: any) => 
                        inline 
                          ? <code className="bg-gray-800/10 px-1 py-0.5 rounded text-red-600" {...props} />
                          : <code className="block bg-gray-800/10 p-2 rounded my-2 overflow-x-auto font-mono text-sm" {...props} />,
                      table: ({node, ...props}) => <table className="border-collapse border border-gray-300 my-4 w-full" {...props} />,
                      th: ({node, ...props}) => <th className="border border-gray-300 px-4 py-2 bg-gray-100" {...props} />,
                      td: ({node, ...props}) => <td className="border border-gray-300 px-4 py-2" {...props} />
                    }}
                  >
                    {mensaje.contenido}
                  </ReactMarkdown>
                )}
                
                {/* Mostrar fuentes si existen */}
                {mensaje.fuentes && mensaje.fuentes.length > 0 && (
                  <div className="mt-4 border-t border-gray-300 pt-2">
                    <p className="font-medium text-sm mb-2 text-blue-800">Fuentes:</p>
                    <ul className="list-disc pl-5 space-y-1.5 text-xs">
                      {mensaje.fuentes.map((fuente, idx) => (
                        <li key={idx} className="break-all">
                          <a 
                            href={fuente}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline hover:text-blue-800 transition-colors flex items-start"
                          >
                            <span className="inline-block mr-1">📎</span>
                            <span className="line-clamp-1">{fuente}</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {cargando && (
            <div className="flex justify-start">
              <div className="flex items-center space-x-2 rounded-lg bg-gray-100 px-4 py-2 text-gray-800">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Pensando...</span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {/* Mostrar indicadores seleccionados como chips/burbuja */}
      {indicadoresSeleccionados.length > 0 && (
        <div className="border-t border-gray-100 px-4 py-2 bg-gray-50">
          <div className="flex flex-wrap gap-1 items-center">
            <span className="text-xs text-gray-500 mr-1">Contexto:</span>
            {indicadoresSeleccionados.map(indicador => (
              <Badge 
                key={indicador.codigo}
                variant="outline"
                className="text-xs font-normal"
              >
                {indicador.nombre}
              </Badge>
            ))}
            <Badge 
              variant="outline" 
              className="text-xs font-normal"
            >
              {dateRange.from ? format(dateRange.from, 'dd/MM/yyyy') : ''} - {dateRange.to ? format(dateRange.to, 'dd/MM/yyyy') : format(new Date(), 'dd/MM/yyyy')}
            </Badge>
          </div>
        </div>
      )}
      
      {/* Área de entrada */}
      <div className="border-t p-4">
        <div className="flex items-center rounded-lg border bg-white px-4 py-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                enviarMensaje();
              }
            }}
            placeholder="Pregúntame sobre indicadores económicos del Perú..."
            className="flex-1 border-none bg-transparent outline-none"
            disabled={cargando}
          />
          
          <button
            onClick={enviarMensaje}
            disabled={!inputValue.trim() || cargando}
            className={`ml-2 rounded-full p-2 ${
              !inputValue.trim() || cargando
                ? 'cursor-not-allowed text-gray-300'
                : 'bg-[#002B5B] text-white hover:bg-[#003b7a]'
            }`}
          >
            <ArrowUpIcon className="h-5 w-5" />
          </button>
        </div>
        
        <div className="mt-2 text-center text-xs text-gray-500">
          Basado en datos oficiales del BCRP y análisis económicos.
        </div>
      </div>
    </div>
  );
} 