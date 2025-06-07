"use client";

import { ChatUI } from "@/components/chatbot/chat-ui";

export default function ChatbotPage() {
  return (
    <div className="flex flex-col gap-6 py-6 bg-slate-50 px-6">
      <section className="w-full">
        <h1 className="mb-8 text-3xl font-bold text-[#002B5B]">
          Chatbot de Análisis Económico
        </h1>
        
        <div className="rounded-xl border bg-white shadow-sm">
          <ChatUI />
        </div>
      </section>
    </div>
  );
} 