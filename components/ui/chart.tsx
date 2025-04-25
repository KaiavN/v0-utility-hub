"use client"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Area,
  AreaChart,
  ComposedChart,
} from "recharts"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface ChartProps {
  data: any[]
  type?: "bar" | "line" | "pie" | "area" | "composed"
  dataKeys: string[]
  colors?: string[]
  height?: number
  showGrid?: boolean
  showLegend?: boolean
  showTooltip?: boolean
  className?: string
  valueFormatter?: (value: number) => string
  categoryKey?: string
  stacked?: boolean
  animate?: boolean
}

const defaultColors = [
  "#2563eb", // blue-600
  "#16a34a", // green-600
  "#dc2626", // red-600
  "#9333ea", // purple-600
  "#ea580c", // orange-600
  "#0891b2", // cyan-600
  "#4f46e5", // indigo-600
  "#db2777", // pink-600
]

export function Chart({
  data,
  type = "bar",
  dataKeys,
  colors = defaultColors,
  height = 300,
  showGrid = true,
  showLegend = true,
  showTooltip = true,
  className,
  valueFormatter = (value) => `${value}`,
  categoryKey = "name",
  stacked = false,
  animate = true,
}: ChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const handleMouseEnter = (_, index) => {
    setActiveIndex(index)
  }

  const handleMouseLeave = () => {
    setActiveIndex(null)
  }

  const renderChart = () => {
    switch (type) {
      case "bar":
        return (
          <BarChart data={data}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" vertical={false} />}
            <XAxis 
              dataKey={categoryKey} 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'var(--muted-foreground)' }}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'var(--muted-foreground)' }}
              dx={-10}
              tickFormatter={valueFormatter}
            />
            {showTooltip && (
              <Tooltip
                formatter={valueFormatter}
                contentStyle={{ 
                  backgroundColor: 'var(--background)',
                  borderColor: 'var(--border)',
                  borderRadius: '0.5rem',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                }}
                itemStyle={{ color: 'var(--foreground)' }}
              />
            )}
            {showLegend && <Legend wrapperStyle={{ paddingTop: '1rem' }} />}
            {dataKeys.map((key, index) => (
              <Bar
                key={key}
                dataKey={key}
                fill={colors[index % colors.length]}
                radius={[4, 4, 0, 0]}
                barSize={30}
                stackId={stacked ? "stack" : undefined}
                animationDuration={animate ? 1000 : 0}
                animationEasing="ease-out"
              />
            ))}
          </BarChart>
        )
      case "line":
        return (
          <LineChart data={data}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" vertical={false} />}
            <XAxis 
              dataKey={categoryKey} 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'var(--muted-foreground)' }}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'var(--muted-foreground)' }}
              dx={-10}
              tickFormatter={valueFormatter}
            />
            {showTooltip && (
              <Tooltip
                formatter={valueFormatter}
                contentStyle={{ 
                  backgroundColor: 'var(--background)',
                  borderColor: 'var(--border)',
                  borderRadius: '0.5rem',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                }}
                itemStyle={{ color: 'var(--foreground)' }}
              />
            )}
            {showLegend && <Legend wrapperStyle={{ paddingTop: '1rem' }} />}
            {dataKeys.map((key, index) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colors[index % colors.length]}
                strokeWidth={3}
                dot={{ r: 4, strokeWidth: 2 }}
                activeDot={{ r: 6, strokeWidth: 2 }}
                animationDuration={animate ? 1500 : 0}
                animationEasing="ease-out"
              />
            ))}
          </LineChart>
        )
      case "pie":
        return (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={2}
              dataKey={dataKeys[0]}
              nameKey={categoryKey}
              animationDuration={animate ? 1000 : 0}
              animationEasing="ease-out"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={colors[index % colors.length]}
                  stroke="var(--background)"
                  strokeWidth={activeIndex === index ? 2 : 1}
                  opacity={activeIndex === null || activeIndex === index ? 1 : 0.6}
                />
              ))}
            </Pie>
            {showTooltip && (
              <Tooltip
                formatter={valueFormatter}
                contentStyle={{ 
                  backgroundColor: 'var(--background)',
                  borderColor: 'var(--border)',
                  borderRadius: '0.5rem',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                }}
                itemStyle={{ color: 'var(--foreground)' }}
              />
            )}
            {showLegend && <Legend wrapperStyle={{ paddingTop: '1rem' }} />}
          </PieChart>
        )
      case "area":
        return (
          <AreaChart data={data}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" vertical={false} />}
            <XAxis 
              dataKey={categoryKey} 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'var(--muted-foreground)' }}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'var(--muted-foreground)' }}
              dx={-10}
              tickFormatter={valueFormatter}
            />
            {showTooltip && (
              <Tooltip
                formatter={valueFormatter}
                contentStyle={{ 
                  backgroundColor: 'var(--background)',
                  borderColor: 'var(--border)',
                  borderRadius: '0.5rem',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                }}
                itemStyle={{ color: 'var(--foreground)' }}
              />
            )}
            {showLegend && <Legend wrapperStyle={{ paddingTop: '1rem' }} />}
            {dataKeys.map((key, index) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                fill={colors[index % colors.length]}
                stroke={colors[index % colors.length]}
                fillOpacity={0.3}
                stackId={stacked ? "stack" : undefined}
                animationDuration={animate ? 1500 : 0}
                animationEasing="ease-out"
              />
            ))}
          </AreaChart>
        )
      case "composed":
        return (
          <ComposedChart data={data}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" vertical={false} />}
            <XAxis 
              dataKey={categoryKey} 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'var(--muted-foreground)' }}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'var(--muted-foreground)' }}
              dx={-10}
              tickFormatter={valueFormatter}
            />
            {showTooltip && (
              <Tooltip
                formatter={valueFormatter}
                contentStyle={{ 
                  backgroundColor: 'var(--background)',
                  borderColor: 'var(--border)',
                  borderRadius: '0.5rem',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                }}
                itemStyle={{ color: 'var(--foreground)' }}
              />
            )}
            {showLegend && <Legend wrapperStyle={{ paddingTop: '1rem' }} />}
            <Bar
              dataKey={dataKeys[0]}
              fill={colors[0]}
              radius={[4, 4, 0, 0]}
              barSize={30}
              animationDuration={animate ? 1000 : 0}
              animationEasing="ease-out"
            />
            <Line
              type="monotone"
              dataKey={dataKeys[1]}
              stroke={colors[1]}
              strokeWidth={3}
              dot={{ r: 4, strokeWidth: 2 }}
              activeDot={{ r: 6, strokeWidth: 2 }}
              animationDuration={animate ? 1500 : 0}
              animationEasing="ease-out"
            />
          </ComposedChart>
        )
      default:
        return null
    }
  }

  return (
    <ResponsiveContainer width="100%" height={height} className={cn("", className)}>
      {renderChart()}
    </ResponsiveContainer>
  )
}

export const ChartContainer = ({ children }: { children: React.ReactNode }) => (
  <div className="chart-container">{children}</div>
)

export const ChartTooltip = ({ children }: { children: React.ReactNode }) => (
  <Tooltip>{children}</Tooltip>
)

export const ChartTooltipContent = ({ children }: { children: React.ReactNode }) => (
  <Tooltip.Content>{children}</Tooltip.Content>
)

export const ChartLegend = ({ children }: { children: React.ReactNode }) => (
  <Legend>{children}</Legend>
)

export const ChartLegendContent = ({ children }: { children: React.ReactNode }) => (
  <Legend.Content>{children}</Legend.Content>
)

export const ChartStyle = ({ children }: { children: React.ReactNode }) => (
  <div className="chart-style">{children}</div>
)
