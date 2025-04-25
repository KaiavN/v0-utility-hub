"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Chart } from "@/components/ui/chart"
import { formatCurrency } from "@/lib/utils"
import { PieChart, BarChart3, ArrowUpRight, ArrowDownLeft } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface IncomeExpensesChartProps {
  data: { name: string; value: number }[]
  incomeData: { name: string; value: number }[]
  className?: string
}

export function IncomeExpensesChart({ data, incomeData, className }: IncomeExpensesChartProps) {
  const [chartType, setChartType] = useState<"pie" | "bar">("pie")

  // Calculate totals
  const totalExpenses = data.reduce((sum, item) => sum + item.value, 0)
  const totalIncome = incomeData.reduce((sum, item) => sum + item.value, 0)
  const netCashflow = totalIncome - totalExpenses

  // Format for currency
  const currencyFormatter = (value: number) => formatCurrency(value)

  return (
    <Card className={cn("border-2 border-primary/20 shadow-lg", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl">Income vs Expenses</CardTitle>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setChartType("pie")}
            className={cn(
              "p-1 rounded-md",
              chartType === "pie" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
            )}
          >
            <PieChart className="h-4 w-4" />
          </button>
          <button
            onClick={() => setChartType("bar")}
            className={cn(
              "p-1 rounded-md",
              chartType === "bar" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
            )}
          >
            <BarChart3 className="h-4 w-4" />
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Total Income</div>
                <div className="text-2xl font-bold flex items-center text-green-500">
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                  {formatCurrency(totalIncome)}
                </div>
              </div>
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                <ArrowUpRight className="h-5 w-5 text-green-500" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Total Expenses</div>
                <div className="text-2xl font-bold flex items-center text-red-500">
                  <ArrowDownLeft className="h-4 w-4 mr-1" />
                  {formatCurrency(totalExpenses)}
                </div>
              </div>
              <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                <ArrowDownLeft className="h-5 w-5 text-red-500" />
              </div>
            </div>
          </motion.div>
        </div>

        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg mb-6">
          <div>
            <div className="text-sm font-medium text-muted-foreground">Net Cashflow</div>
            <div className={cn("text-2xl font-bold", netCashflow >= 0 ? "text-green-500" : "text-red-500")}>
              {formatCurrency(netCashflow)}
            </div>
          </div>
          <div className={cn("text-sm font-medium", netCashflow >= 0 ? "text-green-500" : "text-red-500")}>
            {netCashflow >= 0 ? "Positive" : "Negative"} cashflow
          </div>
        </div>

        <Tabs defaultValue="expenses">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="income">Income</TabsTrigger>
          </TabsList>

          <TabsContent value="expenses" className="mt-0">
            <div className="h-[300px]">
              {chartType === "pie" ? (
                <Chart
                  data={data.slice(0, 8)}
                  type="pie"
                  dataKeys={["value"]}
                  valueFormatter={currencyFormatter}
                  showLegend={true}
                />
              ) : (
                <Chart
                  data={data.slice(0, 8)}
                  type="bar"
                  dataKeys={["value"]}
                  categoryKey="name"
                  valueFormatter={currencyFormatter}
                  showGrid={true}
                />
              )}
            </div>
          </TabsContent>

          <TabsContent value="income" className="mt-0">
            <div className="h-[300px]">
              {chartType === "pie" ? (
                <Chart
                  data={incomeData.slice(0, 8)}
                  type="pie"
                  dataKeys={["value"]}
                  valueFormatter={currencyFormatter}
                  showLegend={true}
                />
              ) : (
                <Chart
                  data={incomeData.slice(0, 8)}
                  type="bar"
                  dataKeys={["value"]}
                  categoryKey="name"
                  valueFormatter={currencyFormatter}
                  showGrid={true}
                />
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
