"use client";

import { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Loader2, 
  ExternalLink, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  RefreshCw 
} from "lucide-react";
import { buscarNoticiasEconomicas } from "@/lib/services/gemini-service";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface Noticia {
  titulo: string;
  descripcion: string;
  insight: string;
  url: string;
  importancia: "baja" | "media" | "alta";
  indicador: string;
  sentimiento: "positivo" | "neutro" | "negativo";
}

export function EconomicNews() {
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ultimaActualizacion, setUltimaActualizacion] = useState<string>("");

  // Función para obtener el color de la insignia según la importancia
  const getImportanciaColor = (importancia: string) => {
    switch (importancia) {
      case "alta":
        return "bg-red-100 text-red-800 hover:bg-red-200";
      case "media":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
      case "baja":
        return "bg-green-100 text-green-800 hover:bg-green-200";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
  };

  // Función para obtener el color y el icono según el sentimiento
  const getSentimientoInfo = (sentimiento: string) => {
    switch (sentimiento) {
      case "positivo":
        return {
          color: "text-green-600",
          bgColor: "bg-green-50",
          icon: <TrendingUp className="h-4 w-4" />,
          label: "Positivo"
        };
      case "negativo":
        return {
          color: "text-red-600",
          bgColor: "bg-red-50",
          icon: <TrendingDown className="h-4 w-4" />,
          label: "Negativo"
        };
      case "neutro":
      default:
        return {
          color: "text-gray-500",
          bgColor: "bg-gray-50",
          icon: <Minus className="h-4 w-4" />,
          label: "Neutro"
        };
    }
  };

  const cargarNoticias = async (forzarActualizacion = false) => {
    try {
      setCargando(true);
      setError(null);
      
      // Obtener noticias económicas utilizando la API de Gemini
      const resultado = await buscarNoticiasEconomicas();
      
      if (resultado && resultado.noticias && resultado.noticias.length > 0) {
        setNoticias(resultado.noticias);
        
        // Actualizar la fecha de última actualización
        const ahora = new Date();
        const formatoFecha = new Intl.DateTimeFormat('es-PE', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }).format(ahora);
        
        setUltimaActualizacion(formatoFecha);
      } else {
        throw new Error("No se pudieron obtener noticias");
      }
    } catch (err) {
      console.error("Error al cargar noticias:", err);
      setError("No se pudieron cargar las noticias económicas");
      
      // Establecer datos de fallback en caso de error
      setNoticias([
        {
          titulo: "Banco Central de Perú mantiene tasa de interés en 4.8%",
          descripcion: "El BCRP decidió mantener su tasa de referencia en 4.8% por sexta reunión consecutiva",
          insight: "La decisión refleja cautela ante la inflación global y busca mantener estabilidad monetaria",
          url: "https://www.bcrp.gob.pe/",
          importancia: "alta",
          indicador: "Tasa de Referencia",
          sentimiento: "neutro"
        },
        {
          titulo: "Tipo de cambio se estabiliza tras intervención del BCRP",
          descripcion: "El sol peruano se fortaleció frente al dólar después de operaciones del Banco Central",
          insight: "La intervención busca reducir la volatilidad en el mercado cambiario nacional",
          url: "https://www.bcrp.gob.pe/",
          importancia: "media",
          indicador: "Tipo de Cambio",
          sentimiento: "positivo"
        }
      ]);
    } finally {
      setCargando(false);
    }
  };

  // Función para manejar el clic en el botón de actualización
  const handleRefresh = () => {
    cargarNoticias(true);
  };

  useEffect(() => {
    cargarNoticias();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Noticias Económicas</span>
          <div className="flex items-center gap-2">
            {cargando ? (
              <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
            ) : (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleRefresh} 
                      disabled={cargando}
                      className="h-8 w-8 p-0"
                    >
                      <RefreshCw className="h-4 w-4" />
                      <span className="sr-only">Actualizar noticias</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Actualizar noticias</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </CardTitle>
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-500">Últimas noticias relacionadas con indicadores económicos</p>
          {ultimaActualizacion && (
            <p className="text-xs text-gray-400">
              Actualizado: {ultimaActualizacion}
            </p>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {cargando ? (
          <div className="flex flex-col items-center justify-center py-10">
            <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
            <p className="text-gray-500">Buscando noticias económicas recientes...</p>
          </div>
        ) : error ? (
          <div className="rounded-md bg-red-50 p-4 text-red-800">
            <p>{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh} 
              disabled={cargando} 
              className="mt-2"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reintentar
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {noticias.map((noticia, index) => {
              const sentimientoInfo = getSentimientoInfo(noticia.sentimiento);
              
              return (
                <div key={index} className="border-b pb-4 last:border-b-0 last:pb-0">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-gray-900 flex-1">{noticia.titulo}</h3>
                    <Badge 
                      variant="outline" 
                      className={`ml-2 ${getImportanciaColor(noticia.importancia)}`}
                    >
                      {noticia.importancia === "alta" 
                        ? "Importante" 
                        : noticia.importancia === "media" 
                          ? "Relevante" 
                          : "Informativo"}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{noticia.descripcion}</p>
                  <p className="text-sm italic text-gray-700 mb-2">
                    <span className="font-medium text-blue-700">Análisis: </span>
                    {noticia.insight}
                  </p>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary" className="font-normal">
                      {noticia.indicador}
                    </Badge>
                    
                    <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${sentimientoInfo.bgColor} ${sentimientoInfo.color}`}>
                      {sentimientoInfo.icon}
                      <span>Impacto {sentimientoInfo.label}</span>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <a 
                      href={noticia.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center"
                    >
                      <span>Leer más</span>
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 