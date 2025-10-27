"use client"

import * as React from "react"
import * as RechartsPrimitive from "recharts"

import { cn } from "@/lib/cn"

// ChartContext for managing chart configuration
const ChartContext = React.createContext<{
  config: Record<string, any>
} | null>(null)

function useChart() {
  const context = React.useContext(ChartContext)
  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />")
  }
  return context
}

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: Record<string, any>
    children: React.ReactNode
  }
>(({ config, children, className, ...props }, ref) => {
  return (
    <ChartContext.Provider value={{ config }}>
      <div
        ref={ref}
        className={cn("w-full h-full", className)}
        {...props}
      >
        {children}
      </div>
    </ChartContext.Provider>
  )
})
ChartContainer.displayName = "ChartContainer"

const ChartTooltip = RechartsPrimitive.Tooltip

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof RechartsPrimitive.Tooltip> & {
    className?: string
    hideLabel?: boolean
    hideIndicator?: boolean
    indicator?: "line" | "dot" | "dashed"
    nameKey?: string
    labelKey?: string
  }
>(
  (
    {
      active,
      payload,
      className,
      hideLabel = false,
      hideIndicator = false,
      indicator = "dot",
      label,
      labelFormatter,
      labelClassName,
      formatter,
      ...props
    },
    ref
  ) => {
    const { config } = useChart()

    if (!active || !payload?.length) {
      return null
    }

    return (
      <div
        ref={ref as any}
        className={cn(
          "rounded-lg border bg-background p-2 shadow-sm",
          className
        )}
      >
        {!hideLabel && label && (
          <div className={cn("mb-2 font-medium", labelClassName)}>
            {labelFormatter ? labelFormatter(label, payload) : label}
          </div>
        )}
        <div className="grid gap-1.5">
          {payload.map((item: any, index: number) => {
            const key = `${item.dataKey || item.name || "value"}-${index}`
            const itemConfig = config[item.dataKey as string] || {}
            const value = item.value

            return (
              <div
                key={key}
                className="flex items-center gap-2 text-sm"
              >
                {!hideIndicator && (
                  <div
                    className={cn(
                      "h-2.5 w-2.5 shrink-0 rounded-[2px]",
                      indicator === "line" && "h-[2px] w-3",
                      indicator === "dashed" && "h-[2px] w-3 border-t-2 border-dashed"
                    )}
                    style={{
                      backgroundColor: indicator === "dot" ? item.color : undefined,
                      borderColor: indicator !== "dot" ? item.color : undefined,
                    }}
                  />
                )}
                <div className="flex flex-1 justify-between gap-2">
                  <span className="text-muted-foreground">
                    {itemConfig.label || item.name}
                  </span>
                  <span className="font-mono font-medium tabular-nums">
                    {formatter ? formatter(value, item.name, item, index, payload) : value}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }
)
ChartTooltipContent.displayName = "ChartTooltipContent"

const ChartLegend = RechartsPrimitive.Legend

const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    payload?: Array<any>
    nameKey?: string
    hideIcon?: boolean
  }
>(({ className, hideIcon = false, payload, ...props }, ref) => {
  const { config } = useChart()

  if (!payload?.length) {
    return null
  }

  return (
    <div
      ref={ref}
      className={cn("flex items-center justify-center gap-4", className)}
      {...props}
    >
      {payload.map((item) => {
        const key = item.dataKey || item.value
        const itemConfig = config[key as string] || {}

        return (
          <div
            key={item.value}
            className="flex items-center gap-1.5 text-sm"
          >
            {!hideIcon && (
              <div
                className="h-2 w-2 shrink-0 rounded-[2px]"
                style={{
                  backgroundColor: item.color,
                }}
              />
            )}
            <span className="text-muted-foreground">
              {itemConfig.label || item.value}
            </span>
          </div>
        )
      })}
    </div>
  )
})
ChartLegendContent.displayName = "ChartLegendContent"

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
}
