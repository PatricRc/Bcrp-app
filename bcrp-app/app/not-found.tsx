"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/context/auth-context";

export default function NotFound() {
  const { user } = useAuth();
  
  return (
    <div className="flex-1 flex items-center justify-center flex-col gap-6 py-20 px-4 text-center">
      <h1 className="text-4xl font-bold text-gray-900">404 - Página no encontrada</h1>
      <p className="text-xl text-gray-600 max-w-md mx-auto">
        Lo sentimos, la página que estás buscando no existe o ha sido movida.
      </p>
      <div className="mt-6">
        <Link href={user ? "/dashboard" : "/"}>
          <Button className="bg-blue-600 hover:bg-blue-700 px-8 py-3">
            Ir a {user ? "Dashboard" : "Inicio"}
          </Button>
        </Link>
      </div>
    </div>
  );
} 