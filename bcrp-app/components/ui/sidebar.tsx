"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/context/auth-context";

// Importamos iconos de Lucide
import {
  BarChart3,
  Search,
  MessageSquare,
  LayoutPanelLeft,
  Home
} from "lucide-react";

// Definimos los ítems de navegación
const navItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: Home
  },
  {
    name: "Explorar y Analizar",
    href: "/explorar",
    icon: Search
  },
  {
    name: "Chatbot IA",
    href: "/chatbot",
    icon: MessageSquare
  },
  {
    name: "Analítica Avanzada",
    href: "/playground",
    icon: LayoutPanelLeft
  }
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, isLoading } = useAuth();
  
  // No mostrar sidebar si no hay usuario autenticado o está cargando
  if (isLoading || !user) {
    return null;
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 shrink-0 border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 md:sticky md:flex md:flex-col">
      <div className="flex flex-col gap-4">
        <div className="flex h-16 items-center border-b border-zinc-200 px-6 dark:border-zinc-800">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <BarChart3 className="h-6 w-6 text-[#002B5B]" />
            <span className="text-xl font-bold text-[#002B5B]">BCRP Análisis</span>
          </Link>
        </div>
        <nav className="grid gap-1 px-4 text-sm font-medium">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 transition-colors",
                pathname === item.href
                  ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                  : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>
      </div>
      <div className="mt-auto p-4">
        <div className="rounded-lg bg-zinc-100 p-4 dark:bg-zinc-800">
          <div className="mb-2 text-sm font-medium">Datos Oficiales BCRP</div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Esta aplicación utiliza datos oficiales del Banco Central de Reserva del Perú.
          </p>
        </div>
      </div>
    </aside>
  );
} 