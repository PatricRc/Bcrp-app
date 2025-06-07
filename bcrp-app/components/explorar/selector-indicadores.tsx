"use client";

import { IndicadorBCRP } from "@/lib/types";
import { Check } from "lucide-react";

interface SelectorIndicadoresProps {
  indicadores: IndicadorBCRP[];
  seleccionados: IndicadorBCRP[];
  onToggleIndicador: (indicador: IndicadorBCRP) => void;
}

export function SelectorIndicadores({
  indicadores,
  seleccionados,
  onToggleIndicador,
}: SelectorIndicadoresProps) {
  // Comprobar si un indicador está seleccionado
  const estaSeleccionado = (codigo: string) => {
    return seleccionados.some((ind) => ind.codigo === codigo);
  };

  return (
    <div className="max-h-80 overflow-y-auto pr-2">
      <ul className="space-y-2">
        {indicadores.map((indicador) => (
          <li key={indicador.codigo}>
            <button
              onClick={() => onToggleIndicador(indicador)}
              className={`flex w-full items-center justify-between rounded-lg p-3 text-left transition-colors ${
                estaSeleccionado(indicador.codigo)
                  ? "bg-blue-50 text-blue-900"
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100"
              }`}
            >
              <div className="flex flex-col">
                <span className="font-medium">{indicador.nombre}</span>
                <span className="text-xs text-gray-500">
                  {indicador.codigo} | {indicador.unidad}
                </span>
              </div>
              <div
                className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                  estaSeleccionado(indicador.codigo)
                    ? "border-blue-500 bg-blue-500 text-white"
                    : "border-gray-300"
                }`}
              >
                {estaSeleccionado(indicador.codigo) && <Check className="h-3 w-3" />}
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
} 