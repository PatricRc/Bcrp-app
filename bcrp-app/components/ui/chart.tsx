"use client"

import * as React from "react"
import { AreaChart, XAxis, CartesianGrid, Area, Legend, Tooltip, ResponsiveContainer, Line, LineChart } from "recharts"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

export type ChartConfig = Record<string, { label: string; color?: string; }>

interface ChartContext {
  config: ChartConfig
}

const ChartContext = React.createContext<ChartContext | undefined>(undefined)

function ChartContainer({
  config,
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  config: ChartConfig
}) {
  // Apply CSS variables for colors
  const style = React.useMemo(() => {
    const style: Record<string, string> = {}
    for (const [key, value] of Object.entries(config)) {
      if (value.color) {
        style[`--color-${key}`] = value.color
      }
    }
    return style
  }, [config])

  return (
    <ChartContext.Provider value={{ config }}>
      <div 
        className={cn("chart-container", className)} 
        style={style} 
        {...props}
      >
        {children}
      </div>
    </ChartContext.Provider>
  )
}

function ChartTooltip({ 
  cursor = true, 
  content,
  ...props 
}: React.ComponentProps<typeof Tooltip> & { 
  content?: React.ReactNode 
}) {
  return (
    <Tooltip 
      cursor={cursor} 
      content={content} 
      {...props} 
    />
  )
}

// Simplified tooltip content component
function ChartTooltipContent({
  labelFormatter, 
  contentClassName,
  indicator = "line",
  className,
  payload,
  label,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  labelFormatter?: (value: any) => React.ReactNode
  contentClassName?: string
  indicator?: "line" | "dot"
  payload?: any[]
  label?: any
}) {
  if (!payload || !payload.length) {
    return null
  }

  return (
    <div
      className={cn(
        "rounded-lg border bg-background p-2 shadow-md",
        className
      )}
      {...props}
    >
      <div className="space-y-0.5">
        <p className="text-sm font-medium">
          {labelFormatter?.(label) ?? label}
        </p>
        <div className={cn("space-y-0.5", contentClassName)}>
          {payload.map((item: any, i: number) => {
            return (
              <div
                key={i}
                className="flex items-center justify-between gap-2 text-xs"
              >
                <div className="flex items-center">
                  {indicator === "line" ? (
                    <div
                      className="mr-1 h-0.5 w-3"
                      style={{
                        backgroundColor: item.color,
                      }}
                    />
                  ) : (
                    <div
                      className="mr-1 h-2 w-2 rounded-full"
                      style={{
                        backgroundColor: item.color,
                      }}
                    />
                  )}
                  {item.name}
                </div>
                <div>{item.value}</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function ChartLegend({ ref, ...props }: Omit<React.ComponentProps<typeof Legend>, 'ref'> & { ref?: React.Ref<any> }) {
  return <Legend {...props} />
}

// Simplified legend content component
function ChartLegendContent({ 
  className, 
  payload, 
  ...props 
}: React.HTMLAttributes<HTMLDivElement> & {
  payload?: any[]
}) {
  const context = React.useContext(ChartContext)

  if (!context) {
    throw new Error("ChartLegendContent should be used within a ChartContainer")
  }

  if (!payload || !payload.length) {
    return null
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-end gap-4 text-xs",
        className
      )}
      {...props}
    >
      {payload.map((item: any, i: number) => {
        const { config } = context
        const key = Object.keys(config).find(
          (key) => key === item.value
        )

        if (!key) {
          return null
        }

        return (
          <div key={i} className="flex items-center gap-1.5">
            <div
              className="h-2 w-2 rounded-full"
              style={{
                backgroundColor: item.color,
              }}
            />
            <span>{config[key]?.label || key}</span>
          </div>
        )
      })}
    </div>
  )
}

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} 