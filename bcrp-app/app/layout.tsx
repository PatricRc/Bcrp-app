import "./globals.css";
import { cn } from "@/lib/utils";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/lib/context/auth-context";
import { Navbar } from "@/components/ui/navbar";
import { Sidebar } from "@/components/ui/sidebar";

// Configuración de fuente
const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "App de Análisis Macroeconómico BCRP",
  description:
    "Aplicación de análisis macroeconómico basada en datos oficiales del Banco Central de Reserva del Perú (BCRP).",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="h-full">
      <body className={cn("relative h-full antialiased", inter.className)}>
        <AuthProvider>
          <div className="flex h-full min-h-screen flex-col">
            <Navbar />
            <div className="flex flex-1">
              <Sidebar />
              <main className="flex-1">
                {children}
              </main>
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
