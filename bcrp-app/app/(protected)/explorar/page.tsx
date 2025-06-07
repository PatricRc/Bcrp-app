"use client";

import { Suspense } from "react";
import { ExplorarIndicadores } from "@/components/explorar/explorar-indicadores";

export default function ExplorarPage() {
  return (
    <div className="flex flex-col gap-6 py-6 bg-slate-50 px-6">
      <section className="w-full">
        <h1 className="mb-8 text-3xl font-bold text-[#002B5B]">
          Explorar y Analizar Indicadores
        </h1>
        
        <Suspense fallback={<div>Cargando módulo...</div>}>
          <ExplorarIndicadores />
        </Suspense>
      </section>
    </div>
  );
} 