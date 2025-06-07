"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PERIODOS_PREDEFINIDOS } from "@/lib/constants";
import { IndicadorChart } from "./indicador-chart";
import { IndicadorBCRP } from "@/lib/types";
import { Download, RefreshCw } from "lucide-react";

interface ChartContainerProps {
  datos: any[];
  indicadores: IndicadorBCRP[];
  titulo?: string;
  onExport?: () => void;
  onRefresh?: () => void;
  estaActualizando?: boolean;
}

export function ChartContainer({
  datos,
  indicadores,
  titulo = "Evolución histórica",
  onExport,
  onRefresh,
  estaActualizando = false,
}: ChartContainerProps) {
  const [periodoActivo, setPeriodoActivo] = useState("MAX");

  // Filtrar datos según el período seleccionado
  const filtrarPorPeriodo = (datos: any[], periodo: string) => {
    if (periodo === "MAX" || !datos || datos.length === 0) {
      return datos;
    }

    const hoy = new Date();
    let fechaInicio = new Date();

    // Calcular fecha de inicio según período
    if (periodo === "1M") {
      fechaInicio.setMonth(hoy.getMonth() - 1);
    } else if (periodo === "3M") {
      fechaInicio.setMonth(hoy.getMonth() - 3);
    } else if (periodo === "6M") {
      fechaInicio.setMonth(hoy.getMonth() - 6);
    } else if (periodo === "1Y") {
      fechaInicio.setFullYear(hoy.getFullYear() - 1);
    } else if (periodo === "2Y") {
      fechaInicio.setFullYear(hoy.getFullYear() - 2);
    } else if (periodo === "5Y") {
      fechaInicio.setFullYear(hoy.getFullYear() - 5);
    }

    // Convertir fecha a formato YYYY-MM para comparar con los datos
    const fechaInicioStr = `${fechaInicio.getFullYear()}-${String(
      fechaInicio.getMonth() + 1
    ).padStart(2, "0")}`;

    return datos.filter((item) => item.fecha >= fechaInicioStr);
  };

  const datosFiltrados = filtrarPorPeriodo(datos, periodoActivo);

  return (
    <Card className="w-full h-full flex flex-col mb-10">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl font-medium">{titulo}</CardTitle>
        <div className="flex items-center gap-2">
          {/* Botones de período */}
          <div className="flex items-center gap-1">
            {PERIODOS_PREDEFINIDOS.map((periodo) => (
              <Button
                key={periodo.valor}
                variant={periodoActivo === periodo.valor ? "default" : "outline"}
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setPeriodoActivo(periodo.valor)}
              >
                {periodo.etiqueta}
              </Button>
            ))}
          </div>

          {/* Botones de acción */}
          <div className="flex items-center gap-1">
            {onRefresh && (
              <Button
                size="icon"
                variant="ghost"
                onClick={onRefresh}
                disabled={estaActualizando}
                className="h-8 w-8"
              >
                <RefreshCw
                  size={16}
                  className={estaActualizando ? "animate-spin" : ""}
                />
              </Button>
            )}
            {onExport && (
              <Button
                size="icon"
                variant="ghost"
                onClick={onExport}
                className="h-8 w-8"
              >
                <Download size={16} />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 pb-8">
        <div className="w-full h-full min-h-[300px]">
          <IndicadorChart datos={datosFiltrados} indicadores={indicadores} />
        </div>
      </CardContent>
    </Card>
  );
} 