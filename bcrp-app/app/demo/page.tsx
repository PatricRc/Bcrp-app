"use client"

import { useState, useEffect } from "react"
import { AreaChartDemo } from "@/components/explorar/area-chart-demo"
import { IndicadorBCRP, DatoSerie } from "@/lib/types"
import { replaceZerosAndNullsWithAverage } from "@/lib/utils"

// Sample BCRP indicator data
const sampleIndicadores: IndicadorBCRP[] = [
  {
    codigo: "PD12301MD",
    nombre: "Tasa de Referencia de la Política Monetaria",
    descripcion: "Tasa de referencia que el BCRP fija para influenciar en el precio de las operaciones crediticias de muy corto plazo",
    unidad: "%",
    frecuencia: "diario"
  }
]

// Sample data (simulating historical data)
const sampleData = [
  { fecha: "2023-01", "PD12301MD": 7.75 },
  { fecha: "2023-02", "PD12301MD": 7.75 },
  { fecha: "2023-03", "PD12301MD": 7.75 },
  { fecha: "2023-04", "PD12301MD": 7.75 },
  { fecha: "2023-05", "PD12301MD": 7.75 },
  { fecha: "2023-06", "PD12301MD": 7.75 },
  { fecha: "2023-07", "PD12301MD": 7.50 },
  { fecha: "2023-08", "PD12301MD": 7.25 },
  { fecha: "2023-09", "PD12301MD": 7.00 },
  { fecha: "2023-10", "PD12301MD": 6.75 },
  { fecha: "2023-11", "PD12301MD": 6.50 },
  { fecha: "2023-12", "PD12301MD": 6.25 },
  { fecha: "2024-01", "PD12301MD": 6.00 },
  { fecha: "2024-02", "PD12301MD": 5.75 },
  { fecha: "2024-03", "PD12301MD": 5.50 },
  { fecha: "2024-04", "PD12301MD": 5.25 }
]

// Sample data with zeros and nulls for testing
const problematicData: DatoSerie[] = [
  { fecha: "2024-01", valor: 3.5 },
  { fecha: "2024-02", valor: 0 }, // Zero value - will be replaced
  { fecha: "2024-03", valor: 3.8 },
  { fecha: "2024-04", valor: null as any }, // Null value - will be replaced
  { fecha: "2024-05", valor: 4.1 },
  { fecha: "2024-06", valor: 0 }, // Another zero - will be replaced
  { fecha: "2024-07", valor: 3.9 },
]

export default function DemoPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any[]>([])
  const [cleanedData, setCleanedData] = useState<DatoSerie[]>([])
  const [showDataCleaning, setShowDataCleaning] = useState(false)
  
  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setData(sampleData)
      setLoading(false)
    }, 1000)
    
    return () => clearTimeout(timer)
  }, [])

  const testDataCleaning = () => {
    console.log("🔧 Testing data cleaning functionality")
    console.log("📊 Original data:", problematicData)
    
    const cleaned = replaceZerosAndNullsWithAverage(problematicData)
    console.log("✨ Cleaned data:", cleaned)
    
    setCleanedData(cleaned)
    setShowDataCleaning(true)
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Cargando datos...</p>
      </div>
    )
  }
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Demo de Gráfico de Área</h1>
      
      <div className="grid gap-8">
        <div className="border rounded-md p-6">
          <AreaChartDemo 
            datos={data}
            indicadores={sampleIndicadores}
          />
        </div>

        {/* Data Cleaning Demo Section */}
        <div className="border rounded-md p-6 bg-blue-50">
          <h2 className="text-xl font-semibold mb-4">🔧 Demostración de Limpieza de Datos</h2>
          <p className="text-gray-700 mb-4">
            Esta funcionalidad reemplaza automáticamente valores 0 y null en las series de datos 
            con el promedio de la serie, evitando caídas artificiales en los gráficos.
          </p>

          <button 
            onClick={testDataCleaning}
            className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            🧪 Probar Limpieza de Datos
          </button>

          {showDataCleaning && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded border">
                <h3 className="font-medium mb-2 text-red-600">📉 Datos Originales (con problemas):</h3>
                <div className="space-y-1 text-sm">
                  {problematicData.map((item, index) => (
                    <div key={index} className={`p-2 rounded ${item.valor === 0 || item.valor === null ? 'bg-red-100' : 'bg-gray-50'}`}>
                      <span className="font-mono">{item.fecha}: </span>
                      <span className={item.valor === 0 || item.valor === null ? 'text-red-600 font-bold' : 'text-gray-700'}>
                        {item.valor === null ? 'null' : item.valor}
                      </span>
                      {(item.valor === 0 || item.valor === null) && <span className="text-red-500 ml-2">⚠️ Problemático</span>}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-4 rounded border">
                <h3 className="font-medium mb-2 text-green-600">📈 Datos Limpiados:</h3>
                <div className="space-y-1 text-sm">
                  {cleanedData.map((item, index) => {
                    const wasProblematic = problematicData[index]?.valor === 0 || problematicData[index]?.valor === null
                    return (
                      <div key={index} className={`p-2 rounded ${wasProblematic ? 'bg-green-100' : 'bg-gray-50'}`}>
                        <span className="font-mono">{item.fecha}: </span>
                        <span className={wasProblematic ? 'text-green-600 font-bold' : 'text-gray-700'}>
                          {typeof item.valor === 'number' ? item.valor.toFixed(2) : item.valor}
                        </span>
                        {wasProblematic && <span className="text-green-500 ml-2">✅ Corregido</span>}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {cleanedData.length > 0 && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
              <p className="text-green-800 text-sm">
                ✅ <strong>Limpieza completada!</strong> Los valores 0 y null han sido reemplazados con el promedio de la serie 
                ({cleanedData.find(d => problematicData.find(p => p.fecha === d.fecha && (p.valor === 0 || p.valor === null)))?.valor.toFixed(2)}).
                Esto evita caídas artificiales en los gráficos que no tienen sentido económico.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 