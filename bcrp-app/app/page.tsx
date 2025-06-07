"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/auth-context";

export default function Home() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    if (!isLoading && user) {
      router.push("/dashboard");
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex-1 w-full">
      {/* Contenido principal */}
      <main className="flex-grow">
        {/* Hero section */}
        <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white py-20 overflow-hidden relative">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-transparent"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="md:w-1/2 mb-10 md:mb-0">
                <div className="mb-6">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 mb-4">
                    ⚡ Powered by BCRP Official Data
                  </span>
                </div>
                <h1 className="text-5xl font-bold tracking-tight mb-6 leading-tight">
                  Análisis macroeconómico con datos 
                  <span className="text-yellow-300"> oficiales del BCRP</span>
                </h1>
                <p className="text-xl mb-8 leading-relaxed text-blue-100">
                  Accede a estadísticas oficiales del Banco Central de Reserva del Perú y 
                  obtén análisis detallados con la ayuda de inteligencia artificial.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/register">
                    <Button className="bg-yellow-400 text-blue-900 hover:bg-yellow-300 px-8 py-4 text-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
                      Comenzar ahora →
                    </Button>
                  </Link>
                  <Link href="#features">
                    <Button variant="outline" className="border-2 border-white text-blue-900 bg-white hover:bg-blue-50 px-8 py-4 text-lg font-semibold transition-all duration-300">
                      Explorar características
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="md:w-1/2 flex justify-center">
                <div className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-500 hover:scale-105">
                  <div className="bg-white rounded-xl p-6 mb-6 shadow-lg">
                    <div className="h-48 flex flex-col">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">PBI Real (Variación %)</h3>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <span className="text-xs text-gray-500">2023-2024</span>
                        </div>
                      </div>
                      
                      {/* Line Chart Visualization */}
                      <div className="flex-1 relative">
                        <svg className="w-full h-full" viewBox="0 0 300 120">
                          {/* Grid lines */}
                          <defs>
                            <pattern id="grid" width="30" height="20" patternUnits="userSpaceOnUse">
                              <path d="M 30 0 L 0 0 0 20" fill="none" stroke="#f1f5f9" strokeWidth="1"/>
                            </pattern>
                          </defs>
                          <rect width="100%" height="100%" fill="url(#grid)" />
                          
                          {/* Y-axis labels */}
                          <text x="10" y="15" className="text-xs fill-gray-400">8%</text>
                          <text x="10" y="35" className="text-xs fill-gray-400">4%</text>
                          <text x="10" y="55" className="text-xs fill-gray-400">0%</text>
                          <text x="10" y="75" className="text-xs fill-gray-400">-4%</text>
                          <text x="10" y="95" className="text-xs fill-gray-400">-8%</text>
                          
                          {/* Line chart path with realistic economic data pattern */}
                          <path
                            d="M 30 70 L 50 65 L 70 45 L 90 50 L 110 40 L 130 35 L 150 55 L 170 45 L 190 40 L 210 35 L 230 30 L 250 25 L 270 30"
                            fill="none"
                            stroke="#3b82f6"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          
                          {/* Data points */}
                          <circle cx="30" cy="70" r="3" fill="#3b82f6" />
                          <circle cx="70" cy="45" r="3" fill="#3b82f6" />
                          <circle cx="110" cy="40" r="3" fill="#3b82f6" />
                          <circle cx="150" cy="55" r="3" fill="#3b82f6" />
                          <circle cx="190" cy="40" r="3" fill="#3b82f6" />
                          <circle cx="230" cy="30" r="3" fill="#3b82f6" />
                          <circle cx="270" cy="30" r="3" fill="#10b981" />
                          
                          {/* Gradient fill under the line */}
                          <defs>
                            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2"/>
                              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0"/>
                            </linearGradient>
                          </defs>
                          <path
                            d="M 30 70 L 50 65 L 70 45 L 90 50 L 110 40 L 130 35 L 150 55 L 170 45 L 190 40 L 210 35 L 230 30 L 250 25 L 270 30 L 270 120 L 30 120 Z"
                            fill="url(#lineGradient)"
                          />
                        </svg>
                        
                        {/* Current value indicator */}
                        <div className="absolute top-2 right-2 bg-green-100 px-2 py-1 rounded-lg">
                          <div className="flex items-center gap-1">
                            <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                            <span className="text-xs font-semibold text-green-700">+2.1%</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* X-axis time labels */}
                      <div className="flex justify-between text-xs text-gray-400 mt-2 px-2">
                        <span>Ene</span>
                        <span>Mar</span>
                        <span>May</span>
                        <span>Jul</span>
                        <span>Sep</span>
                        <span>Nov</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center gap-2 text-sm">
                    <div className="flex items-center gap-1 text-blue-100">
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                      <span>Tiempo real</span>
                    </div>
                    <div className="text-blue-100">Análisis AI</div>
                    <div className="text-blue-100">Reportes</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof Section */}
        <section className="py-16 bg-gray-50 border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Quiénes confían en nosotros</h2>
              <p className="text-gray-600">Utilizado por profesionales de economía y finanzas</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center opacity-60">
              <div className="flex items-center justify-center h-16 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
                <span className="font-semibold text-gray-700">UNIVERSIDAD</span>
              </div>
              <div className="flex items-center justify-center h-16 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
                <span className="font-semibold text-gray-700">CONSULTORA</span>
              </div>
              <div className="flex items-center justify-center h-16 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
                <span className="font-semibold text-gray-700">BANCO</span>
              </div>
              <div className="flex items-center justify-center h-16 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
                <span className="font-semibold text-gray-700">GOBIERNO</span>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits section */}
        <section id="features" className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4 text-gray-900">
                ¿Por qué elegir nuestra plataforma?
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Obtén ventajas competitivas con análisis de datos económicos oficiales y tecnología de IA avanzada
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className={`bg-white p-8 rounded-2xl shadow-lg border-2 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 ${activeFeature === 0 ? 'border-blue-500 shadow-blue-100' : 'border-gray-100'}`}>
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl w-16 h-16 flex items-center justify-center mb-6 shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-white">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900">Datos 100% Oficiales</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Acceso directo y en tiempo real a todos los indicadores económicos oficiales del Banco Central de Reserva del Perú. Sin datos simulados, solo información verificada y actualizada.
                </p>
                <div className="flex items-center text-blue-600 font-semibold">
                  Ver indicadores
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
              
              <div className={`bg-white p-8 rounded-2xl shadow-lg border-2 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 ${activeFeature === 1 ? 'border-purple-500 shadow-purple-100' : 'border-gray-100'}`}>
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl w-16 h-16 flex items-center justify-center mb-6 shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-white">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900">Inteligencia Artificial Avanzada</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Interpretación automática y análisis profundo de tendencias económicas utilizando IA de última generación. Obtén insights que serían imposibles de detectar manualmente.
                </p>
                <div className="flex items-center text-purple-600 font-semibold">
                  Probar análisis IA
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
              
              <div className={`bg-white p-8 rounded-2xl shadow-lg border-2 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 ${activeFeature === 2 ? 'border-green-500 shadow-green-100' : 'border-gray-100'}`}>
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl w-16 h-16 flex items-center justify-center mb-6 shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-white">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5m.75-9 3-3 2.148 2.148A12.061 12.061 0 0 1 16.5 7.605" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900">Visualizaciones Interactivas</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Dashboards dinámicos y gráficos interactivos que se adaptan a tus necesidades. Exporta reportes profesionales y comparte insights con tu equipo fácilmente.
                </p>
                <div className="flex items-center text-green-600 font-semibold">
                  Ver dashboards
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Use Cases Section */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4 text-gray-900">¿Para quién es esta plataforma?</h2>
              <p className="text-xl text-gray-600">Casos de uso y perfiles profesionales que se benefician</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group">
                <div className="bg-blue-100 rounded-2xl w-16 h-16 flex items-center justify-center mb-6 group-hover:bg-blue-200 transition-colors duration-300">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-4 text-gray-900">Analistas Económicos</h3>
                <p className="text-gray-600 mb-6">Profesionales que necesitan datos precisos y análisis profundos para sus reportes e investigaciones económicas.</p>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-500">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                    Reportes automáticos
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                    Análisis de tendencias
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                    Correlaciones automatizadas
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group">
                <div className="bg-purple-100 rounded-2xl w-16 h-16 flex items-center justify-center mb-6 group-hover:bg-purple-200 transition-colors duration-300">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-4 text-gray-900">Instituciones Financieras</h3>
                <p className="text-gray-600 mb-6">Bancos, fondos de inversión y aseguradoras que requieren análisis macroeconómico para la toma de decisiones.</p>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-500">
                    <div className="w-2 h-2 bg-purple-400 rounded-full mr-2"></div>
                    Evaluación de riesgos
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <div className="w-2 h-2 bg-purple-400 rounded-full mr-2"></div>
                    Modelos predictivos
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <div className="w-2 h-2 bg-purple-400 rounded-full mr-2"></div>
                    Alertas automáticas
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group">
                <div className="bg-green-100 rounded-2xl w-16 h-16 flex items-center justify-center mb-6 group-hover:bg-green-200 transition-colors duration-300">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-4 text-gray-900">Académicos e Investigadores</h3>
                <p className="text-gray-600 mb-6">Profesores, estudiantes e investigadores que necesitan datos confiables para sus estudios y publicaciones.</p>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-500">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                    Datasets completos
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                    Exportación fácil
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                    Citas automáticas
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How it works Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4 text-gray-900">¿Cómo funciona?</h2>
              <p className="text-xl text-gray-600">Simple, rápido y efectivo en solo 3 pasos</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center group">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-110">
                  <span className="text-white text-2xl font-bold">1</span>
                </div>
                <h3 className="text-xl font-bold mb-4 text-gray-900">Conecta con BCRP</h3>
                <p className="text-gray-600 leading-relaxed">
                  Nuestra plataforma se conecta automáticamente con la API oficial del BCRP para obtener datos actualizados en tiempo real.
                </p>
              </div>
              
              <div className="text-center group">
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-110">
                  <span className="text-white text-2xl font-bold">2</span>
                </div>
                <h3 className="text-xl font-bold mb-4 text-gray-900">Analiza con IA</h3>
                <p className="text-gray-600 leading-relaxed">
                  Nuestros algoritmos de inteligencia artificial procesan y analizan los datos, identificando patrones y tendencias relevantes.
                </p>
              </div>
              
              <div className="text-center group">
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-110">
                  <span className="text-white text-2xl font-bold">3</span>
                </div>
                <h3 className="text-xl font-bold mb-4 text-gray-900">Obtén Insights</h3>
                <p className="text-gray-600 leading-relaxed">
                  Recibe visualizaciones interactivas, reportes detallados y recomendaciones basadas en el análisis de los datos económicos.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Final Call to action */}
        <section className="py-20 bg-gradient-to-r from-blue-900 to-indigo-900 text-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl font-bold mb-6">
              ¿Listo para revolucionar tu análisis económico?
            </h2>
            <p className="text-xl mb-10 text-blue-100 leading-relaxed max-w-3xl mx-auto">
              Únete a cientos de profesionales que ya utilizan nuestra plataforma para obtener insights valiosos de los datos macroeconómicos del BCRP.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link href="/register">
                <Button className="bg-yellow-400 text-blue-900 hover:bg-yellow-300 px-10 py-4 text-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
                  Crear cuenta gratuita
                </Button>
              </Link>
              <div className="flex items-center text-blue-100">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Sin tarjeta de crédito requerida</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="font-bold text-2xl mb-4">BCRP Analytics</div>
              <p className="text-gray-400 mb-4 leading-relaxed">
                La plataforma más avanzada para análisis macroeconómico con datos oficiales del BCRP y tecnología de inteligencia artificial.
              </p>
              <div className="flex space-x-4">
                <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors duration-300 cursor-pointer">
                  <span className="text-sm font-bold">T</span>
                </div>
                <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors duration-300 cursor-pointer">
                  <span className="text-sm font-bold">L</span>
                </div>
                <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors duration-300 cursor-pointer">
                  <span className="text-sm font-bold">G</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Producto</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors duration-300">Dashboard</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-300">Análisis</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-300">Reportes</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-300">API</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Soporte</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors duration-300">Documentación</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-300">Tutoriales</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-300">Contacto</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-300">FAQ</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400">© 2025 BCRP Analytics. Todos los derechos reservados.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">Privacidad</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">Términos</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
