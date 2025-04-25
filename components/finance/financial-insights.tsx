"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { TrendingUp, TrendingDown, AlertCircle, Info, Lightbulb } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface Transaction {
  id: string
  date: string
  description: string
  amount: number
  type: string
  category: string
}

interface FinancialInsightsProps {
  transactions: Transaction[]
  className?: string
}

export function FinancialInsights({ transactions, className }: FinancialInsightsProps) {
  // Calculate insights
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()

  const thisMonthTransactions = transactions.filter((t) => {
    const date = new Date(t.date)
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear
  })

  const lastMonthTransactions = transactions.filter((t) => {
    const date = new Date(t.date)
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear
    return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear
  })

  const thisMonthIncome = thisMonthTransactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0)

  const thisMonthExpenses = thisMonthTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0)

  const lastMonthIncome = lastMonthTransactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0)

  const lastMonthExpenses = lastMonthTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0)

  // Calculate changes
  const incomeChange = lastMonthIncome > 0 ? ((thisMonthIncome - lastMonthIncome) / lastMonthIncome) * 100 : 0

  const expenseChange = lastMonthExpenses > 0 ? ((thisMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100 : 0

  // Get top spending categories
  const categoryExpenses = {}
  thisMonthTransactions
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      if (!categoryExpenses[t.category]) {
        categoryExpenses[t.category] = 0
      }
      categoryExpenses[t.category] += t.amount
    })

  const topCategories = Object.entries(categoryExpenses)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([category, amount]) => ({ category, amount }))

  // Generate insights
  const insights = []

  if (thisMonthExpenses > thisMonthIncome) {
    insights.push({
      type: "warning",
      title: "Spending Alert",
      description: "Your expenses exceed your income this month. Consider reducing non-essential spending.",
      icon: <AlertCircle className="h-4 w-4" />,
    })
  }

  if (expenseChange > 20) {
    insights.push({
      type: "warning",
      title: "Expense Increase",
      description: `Your expenses have increased by ${Math.abs(expenseChange).toFixed(1)}% compared to last month.`,
      icon: <TrendingUp className="h-4 w-4" />,
    })
  }

  if (expenseChange < -10) {
    insights.push({
      type: "success",
      title: "Expense Reduction",
      description: `Great job! You've reduced expenses by ${Math.abs(expenseChange).toFixed(1)}% compared to last month.`,
      icon: <TrendingDown className="h-4 w-4" />,
    })
  }

  if (incomeChange > 10) {
    insights.push({
      type: "success",
      title: "Income Growth",
      description: `Your income has increased by ${incomeChange.toFixed(1)}% compared to last month.`,
      icon: <TrendingUp className="h-4 w-4" />,
    })
  }

  // Add a tip if we have few insights
  if (insights.length < 2) {
    insights.push({
      type: "info",
      title: "Financial Tip",
      description:
        "Consider setting up automatic transfers to your savings account on payday to build your emergency fund.",
      icon: <Lightbulb className="h-4 w-4" />,
    })
  }

  return (
    <Card className={cn("border border-primary/20 shadow-sm", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5 text-primary" />
          Financial Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">This Month's Income</p>
            <div className="flex items-center justify-between">
              <p className="text-lg font-bold">{formatCurrency(thisMonthIncome)}</p>
              {incomeChange !== 0 && (
                <div
                  className={cn(
                    "flex items-center text-xs font-medium",
                    incomeChange > 0 ? "text-green-500" : "text-red-500",
                  )}
                >
                  {incomeChange > 0 ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  {Math.abs(incomeChange).toFixed(1)}%
                </div>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">This Month's Expenses</p>
            <div className="flex items-center justify-between">
              <p className="text-lg font-bold">{formatCurrency(thisMonthExpenses)}</p>
              {expenseChange !== 0 && (
                <div
                  className={cn(
                    "flex items-center text-xs font-medium",
                    expenseChange < 0 ? "text-green-500" : "text-red-500",
                  )}
                >
                  {expenseChange < 0 ? (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  )}
                  {Math.abs(expenseChange).toFixed(1)}%
                </div>
              )}
            </div>
          </div>
        </div>

        {topCategories.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Top Spending Categories</p>
            <div className="space-y-1">
              {topCategories.map((item, index) => (
                <div key={item.category} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-4 bg-primary rounded-full opacity-80" />
                    <p className="text-sm">{item.category}</p>
                  </div>
                  <p className="text-sm font-medium">{formatCurrency(item.amount)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3 mt-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ staggerChildren: 0.1 }}
            className="space-y-3"
          >
            {insights.map((insight, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Alert
                  variant={
                    insight.type === "warning" ? "destructive" : insight.type === "success" ? "default" : "outline"
                  }
                  className={cn(
                    "mb-2",
                    insight.type === "success" && "border-green-500/50 text-green-500",
                    insight.type === "info" && "border-blue-500/50 text-blue-500",
                  )}
                >
                  <div className="flex items-center gap-2">
                    {insight.icon}
                    <AlertTitle>{insight.title}</AlertTitle>
                  </div>
                  <AlertDescription>{insight.description}</AlertDescription>
                </Alert>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </CardContent>
    </Card>
  )
}
