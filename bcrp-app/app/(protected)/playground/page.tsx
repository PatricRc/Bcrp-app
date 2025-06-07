"use client";

import { PlaygroundUI } from "@/components/playground/playground-ui";

export default function PlaygroundPage() {
  return (
    <div className="flex flex-col gap-6 py-6 bg-slate-50 px-6">
      <section className="w-full">
        <h1 className="mb-8 text-3xl font-bold text-[#002B5B]">
          Analítica Avanzada
        </h1>
        
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <PlaygroundUI />
        </div>
      </section>
    </div>
  );
} 