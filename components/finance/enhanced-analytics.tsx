"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Chart } from "@/components/ui/chart"
import { formatCurrency } from "@/lib/utils"
import { cn } from "@/lib/utils"
import {
  BarChart3,
  LineChart,
  PieChart,
  TrendingUp,
  TrendingDown,
  Calendar,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react"
import { motion } from "framer-motion"

interface Transaction {
  id: string
  date: string
  description: string
  amount: number
  type: "income" | "expense"
  category: string
}

interface EnhancedAnalyticsProps {
  transactions: Transaction[]
  className?: string
  chartAnimations?: boolean
  chartStyle?: string
}

export function EnhancedAnalytics({
  transactions,
  className,
  chartAnimations = true,
  chartStyle = "default",
}: EnhancedAnalyticsProps) {
  const [timeRange, setTimeRange] = useState<"7days" | "30days" | "90days" | "12months" | "all">("30days")
  const [chartType, setChartType] = useState<"bar" | "line" | "pie" | "area" | "composed">("bar")

  // Get chart colors based on style
  const getChartColors = () => {
    switch (chartStyle) {
      case "monochrome":
        return ["#2563eb", "#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe"]
      case "vibrant":
        return ["#f43f5e", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b"]
      case "pastel":
        return ["#93c5fd", "#c4b5fd", "#a5f3fc", "#86efac", "#fde68a"]
      case "gradient":
        return ["#2563eb", "#4f46e5", "#7c3aed", "#9333ea", "#c026d3"]
      default:
        return ["#2563eb", "#16a34a", "#dc2626", "#9333ea", "#ea580c"]
    }
  }

  // Filter transactions based on time range
  const filteredTransactions = (() => {
    const now = new Date()
    const filtered = transactions.filter((transaction) => {
      const transactionDate = new Date(transaction.date)

      switch (timeRange) {
        case "7days":
          return (now.getTime() - transactionDate.getTime()) / (1000 * 60 * 60 * 24) <= 7
        case "30days":
          return (now.getTime() - transactionDate.getTime()) / (1000 * 60 * 60 * 24) <= 30
        case "90days":
          return (now.getTime() - transactionDate.getTime()) / (1000 * 60 * 60 * 24) <= 90
        case "12months":
          return (now.getTime() - transactionDate.getTime()) / (1000 * 60 * 60 * 24) <= 365
        case "all":
        default:
          return true
      }
    })
    return filtered
  })()

  // Calculate totals
  const totalIncome = filteredTransactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0)

  const totalExpenses = filteredTransactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0)

  const netCashflow = totalIncome - totalExpenses
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0

  // Prepare data for category breakdown
  const expensesByCategory = filteredTransactions
    .filter((t) => t.type === "expense")
    .reduce(
      (acc, transaction) => {
        const { category, amount } = transaction
        if (!acc[category]) {
          acc[category] = 0
        }
        acc[category] += amount
        return acc
      },
      {} as Record<string, number>,
    )

  const incomeByCategory = filteredTransactions
    .filter((t) => t.type === "income")
    .reduce(
      (acc, transaction) => {
        const { category, amount } = transaction
        if (!acc[category]) {
          acc[category] = 0
        }
        acc[category] += amount
        return acc
      },
      {} as Record<string, number>,
    )

  // Convert to array and sort by amount
  const expenseCategoryData = Object.entries(expensesByCategory)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  const incomeCategoryData = Object.entries(incomeByCategory)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  // Prepare data for time series
  const timeSeriesData = (() => {
    // Group transactions by month or day depending on time range
    const groupedData: Record<string, { income: number; expenses: number; date: string }> = {}

    filteredTransactions.forEach((transaction) => {
      const date = new Date(transaction.date)
      let key: string

      if (timeRange === "7days" || timeRange === "30days") {
        // Group by day for shorter time ranges
        key = date.toISOString().split("T")[0]
      } else {
        // Group by month for longer time ranges
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      }

      if (!groupedData[key]) {
        groupedData[key] = { income: 0, expenses: 0, date: key }
      }

      if (transaction.type === "income") {
        groupedData[key].income += transaction.amount
      } else {
        groupedData[key].expenses += transaction.amount
      }
    })

    // Convert to array and sort by date
    return Object.values(groupedData).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  })()

  // Format time series labels
  const formatTimeLabel = (date: string) => {
    if (timeRange === "7days" || timeRange === "30days") {
      // For daily data, show day of month
      return new Date(date).getDate().toString()
    } else {
      // For monthly data, show month abbreviation
      const d = new Date(date)
      return new Intl.DateTimeFormat("en", { month: "short" }).format(d)
    }
  }

  // Prepare time series data for chart
  const timeChartData = timeSeriesData.map((item) => ({
    name: formatTimeLabel(item.date),
    income: item.income,
    expenses: item.expenses,
    net: item.income - item.expenses,
    fullDate: item.date, // Keep the full date for tooltip
  }))

  // Calculate trends
  const calculateTrend = (data: typeof timeChartData, key: "income" | "expenses" | "net") => {
    if (data.length < 2) return 0

    // Use more data points for a more accurate trend
    const firstHalf = data.slice(0, Math.ceil(data.length / 2))
    const secondHalf = data.slice(Math.ceil(data.length / 2))

    const firstHalfAvg = firstHalf.reduce((sum, item) => sum + item[key], 0) / firstHalf.length || 0
    const secondHalfAvg = secondHalf.reduce((sum, item) => sum + item[key], 0) / secondHalf.length || 0

    // Avoid division by zero
    if (Math.abs(firstHalfAvg) < 0.001) {
      return secondHalfAvg > 0 ? 100 : secondHalfAvg < 0 ? -100 : 0
    }

    return ((secondHalfAvg - firstHalfAvg) / Math.abs(firstHalfAvg)) * 100
  }

  // Forecast next month based on trends
  const forecastNextMonth = () => {
    if (timeChartData.length < 2) return { income: 0, expenses: 0, net: 0 }

    // Use linear regression for more accurate forecasting
    const xValues = timeChartData.map((_, i) => i)
    const yIncomeValues = timeChartData.map((item) => item.income)
    const yExpenseValues = timeChartData.map((item) => item.expenses)

    // Simple linear regression
    const incomeSlope = getSlope(xValues, yIncomeValues)
    const expenseSlope = getSlope(xValues, yExpenseValues)

    const lastIncome = yIncomeValues[yIncomeValues.length - 1]
    const lastExpense = yExpenseValues[yExpenseValues.length - 1]

    // Forecast next period
    const forecastedIncome = Math.max(0, lastIncome + incomeSlope)
    const forecastedExpenses = Math.max(0, lastExpense + expenseSlope)

    return {
      income: forecastedIncome,
      expenses: forecastedExpenses,
      net: forecastedIncome - forecastedExpenses,
    }
  }

  // Add helper function for linear regression
  const getSlope = (xValues: number[], yValues: number[]) => {
    const n = xValues.length
    if (n <= 1) return 0

    const sumX = xValues.reduce((a, b) => a + b, 0)
    const sumY = yValues.reduce((a, b) => a + b, 0)
    const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0)
    const sumXX = xValues.reduce((sum, x) => sum + x * x, 0)

    // Calculate slope (m) in y = mx + b
    return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX) || 0
  }

  const forecast = forecastNextMonth()

  // Calculate trends
  const incomeTrend = calculateTrend(timeChartData, "income")
  const expenseTrend = calculateTrend(timeChartData, "expenses")
  const netTrend = calculateTrend(timeChartData, "net")

  // Custom tooltip formatter for currency values
  const currencyFormatter = (value: number) => formatCurrency(value)

  return (
    <Card className={cn("border border-primary/20 shadow-sm", className)}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Financial Analytics
          </CardTitle>
          <CardDescription className="mt-1">Visualize your financial data and identify trends</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
            <SelectTrigger className="w-[130px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="90days">Last 90 Days</SelectItem>
              <SelectItem value="12months">Last 12 Months</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>

          <Select value={chartType} onValueChange={(value: any) => setChartType(value)}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Chart Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bar">
                <div className="flex items-center">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Bar Chart
                </div>
              </SelectItem>
              <SelectItem value="line">
                <div className="flex items-center">
                  <LineChart className="h-4 w-4 mr-2" />
                  Line Chart
                </div>
              </SelectItem>
              <SelectItem value="area">
                <div className="flex items-center">
                  <LineChart className="h-4 w-4 mr-2" />
                  Area Chart
                </div>
              </SelectItem>
              <SelectItem value="pie">
                <div className="flex items-center">
                  <PieChart className="h-4 w-4 mr-2" />
                  Pie Chart
                </div>
              </SelectItem>
              <SelectItem value="composed">
                <div className="flex items-center">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Combined Chart
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div className="text-sm font-medium text-muted-foreground">Income</div>
                  <div
                    className={cn("flex items-center text-xs", incomeTrend >= 0 ? "text-green-500" : "text-red-500")}
                  >
                    {incomeTrend >= 0 ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    {Math.abs(incomeTrend).toFixed(1)}%
                  </div>
                </div>
                <div className="text-2xl font-bold mt-1">{formatCurrency(totalIncome)}</div>
                <div className="text-xs text-muted-foreground mt-1">Forecast: {formatCurrency(forecast.income)}</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div className="text-sm font-medium text-muted-foreground">Expenses</div>
                  <div
                    className={cn("flex items-center text-xs", expenseTrend <= 0 ? "text-green-500" : "text-red-500")}
                  >
                    {expenseTrend <= 0 ? (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    )}
                    {Math.abs(expenseTrend).toFixed(1)}%
                  </div>
                </div>
                <div className="text-2xl font-bold mt-1">{formatCurrency(totalExpenses)}</div>
                <div className="text-xs text-muted-foreground mt-1">Forecast: {formatCurrency(forecast.expenses)}</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div className="text-sm font-medium text-muted-foreground">Net Cashflow</div>
                  <div className={cn("flex items-center text-xs", netTrend >= 0 ? "text-green-500" : "text-red-500")}>
                    {netTrend >= 0 ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    {Math.abs(netTrend).toFixed(1)}%
                  </div>
                </div>
                <div className={cn("text-2xl font-bold mt-1", netCashflow < 0 ? "text-destructive" : "")}>
                  {formatCurrency(netCashflow)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">Forecast: {formatCurrency(forecast.net)}</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
              <CardContent className="p-4">
                <div className="text-sm font-medium text-muted-foreground">Savings Rate</div>
                <div className="text-2xl font-bold mt-1">{savingsRate.toFixed(1)}%</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {savingsRate >= 20 ? "Excellent" : savingsRate >= 10 ? "Good" : "Needs improvement"}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Charts */}
        <Tabs defaultValue="cashflow" className="w-full mt-6">
          <TabsList className="w-full max-w-md mx-auto grid grid-cols-3 h-10 mb-6">
            <TabsTrigger value="cashflow" className="rounded-md">
              Income & Expenses
            </TabsTrigger>
            <TabsTrigger value="categories" className="rounded-md">
              Category Breakdown
            </TabsTrigger>
            <TabsTrigger value="trends" className="rounded-md">
              Trends & Forecasts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cashflow" className="space-y-4">
            <div className="h-[400px] mt-4">
              {chartType === "pie" ? (
                <Chart
                  data={[
                    { name: "Income", value: totalIncome },
                    { name: "Expenses", value: totalExpenses },
                  ]}
                  type="pie"
                  dataKeys={["value"]}
                  colors={getChartColors()}
                  valueFormatter={currencyFormatter}
                  showLegend={true}
                  animate={chartAnimations}
                />
              ) : (
                <Chart
                  data={timeChartData}
                  type={chartType}
                  dataKeys={["income", "expenses"]}
                  colors={getChartColors()}
                  categoryKey="name"
                  valueFormatter={currencyFormatter}
                  showGrid={true}
                  showLegend={true}
                  height={400}
                  animate={chartAnimations}
                />
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Top Income Sources</h3>
                <div className="space-y-2">
                  {incomeCategoryData.slice(0, 5).map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                        <span>{item.name}</span>
                      </div>
                      <div className="flex items-center text-green-500">
                        <ArrowUpRight className="h-3 w-3 mr-1" />
                        {formatCurrency(item.value)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Top Expense Categories</h3>
                <div className="space-y-2">
                  {expenseCategoryData.slice(0, 5).map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-red-500 mr-2" />
                        <span>{item.name}</span>
                      </div>
                      <div className="flex items-center text-red-500">
                        <ArrowDownLeft className="h-3 w-3 mr-1" />
                        {formatCurrency(item.value)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="categories">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Expense Breakdown</h3>
                <div className="h-[300px]">
                  <Chart
                    data={expenseCategoryData}
                    type="pie"
                    dataKeys={["value"]}
                    valueFormatter={currencyFormatter}
                    showLegend={true}
                    colors={getChartColors()}
                    animate={chartAnimations}
                  />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Income Breakdown</h3>
                <div className="h-[300px]">
                  <Chart
                    data={incomeCategoryData}
                    type="pie"
                    dataKeys={["value"]}
                    valueFormatter={currencyFormatter}
                    showLegend={true}
                    colors={getChartColors()}
                    animate={chartAnimations}
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <h3 className="text-lg font-semibold mb-2">Category Comparison</h3>
                <div className="h-[300px]">
                  <Chart
                    data={[...expenseCategoryData.slice(0, 6)]}
                    type="bar"
                    dataKeys={["value"]}
                    categoryKey="name"
                    valueFormatter={currencyFormatter}
                    showGrid={true}
                    colors={getChartColors()}
                    animate={chartAnimations}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="trends">
            <div className="space-y-6 mt-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Cashflow Trends</h3>
                <div className="h-[300px]">
                  <Chart
                    data={timeChartData}
                    type="line"
                    dataKeys={["income", "expenses", "net"]}
                    colors={getChartColors()}
                    categoryKey="name"
                    valueFormatter={currencyFormatter}
                    showGrid={true}
                    showLegend={true}
                    animate={chartAnimations}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <h4 className="text-sm font-medium">Income Trend</h4>
                    <div
                      className={cn(
                        "text-xl font-bold mt-1 flex items-center",
                        incomeTrend >= 0 ? "text-green-500" : "text-red-500",
                      )}
                    >
                      {incomeTrend >= 0 ? (
                        <TrendingUp className="h-4 w-4 mr-1" />
                      ) : (
                        <TrendingDown className="h-4 w-4 mr-1" />
                      )}
                      {Math.abs(incomeTrend).toFixed(1)}%
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {incomeTrend >= 0 ? "Increasing" : "Decreasing"} over time
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <h4 className="text-sm font-medium">Expense Trend</h4>
                    <div
                      className={cn(
                        "text-xl font-bold mt-1 flex items-center",
                        expenseTrend <= 0 ? "text-green-500" : "text-red-500",
                      )}
                    >
                      {expenseTrend <= 0 ? (
                        <TrendingDown className="h-4 w-4 mr-1" />
                      ) : (
                        <TrendingUp className="h-4 w-4 mr-1" />
                      )}
                      {Math.abs(expenseTrend).toFixed(1)}%
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {expenseTrend <= 0 ? "Decreasing" : "Increasing"} over time
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <h4 className="text-sm font-medium">Forecast Next Period</h4>
                    <div
                      className={cn("text-xl font-bold mt-1", forecast.net < 0 ? "text-destructive" : "text-primary")}
                    >
                      {formatCurrency(forecast.net)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Projected net cashflow</div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
