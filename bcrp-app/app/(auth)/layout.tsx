"use client";

import { useAuth } from "@/lib/context/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.push("/dashboard");
    }
  }, [isLoading, user, router]);

  // Si ya está autenticado, no mostramos la página de login o registro
  if (!isLoading && user) {
    return null;
  }

  return (
    <div className="flex-1 min-h-screen bg-gray-50 flex items-center justify-center">
      {children}
    </div>
  );
} 