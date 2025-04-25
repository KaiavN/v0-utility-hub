"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { formatCurrency } from "@/lib/utils"
import { motion } from "framer-motion"
import { AlertCircle, CheckCircle2, PieChart } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { Edit2, PlusCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface BudgetItem {
  category: string
  amount: number
  spent: number
  color?: string
}

interface BudgetOverviewProps {
  budgets: BudgetItem[]
  title?: string
  className?: string
  onBudgetClick?: (category: string) => void
  onAddBudget?: () => void
}

export function BudgetOverview({
  budgets,
  title = "Budget Overview",
  className,
  onBudgetClick,
  onAddBudget,
}: BudgetOverviewProps) {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }

  const getProgressColor = (percentage: number) => {
    if (percentage > 100) return "bg-destructive"
    if (percentage > 85) return "bg-amber-500"
    return "bg-primary"
  }

  return (
    <Card className={cn("border border-primary/20 shadow-sm", className)}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <PieChart className="h-5 w-5 text-primary" />
          <CardTitle>{title}</CardTitle>
        </div>
        {onAddBudget && (
          <Button size="sm" variant="outline" onClick={onAddBudget}>
            <PlusCircle className="h-4 w-4 mr-1" />
            Add Budget
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <motion.div className="space-y-4" variants={container} initial="hidden" animate="show">
          {budgets.map((budget) => {
            const percentage = budget.amount > 0 ? (budget.spent / budget.amount) * 100 : 0
            const isOverBudget = percentage > 100
            const isNearBudget = percentage > 85 && percentage <= 100
            const isHovered = hoveredCategory === budget.category

            return (
              <motion.div
                key={budget.category}
                className={cn("space-y-1 p-3 rounded-md transition-colors", isHovered && "bg-muted")}
                variants={item}
                onMouseEnter={() => setHoveredCategory(budget.category)}
                onMouseLeave={() => setHoveredCategory(null)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: budget.color || "var(--primary)" }}
                    />
                    <p className="font-medium">{budget.category}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isHovered && onBudgetClick && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 rounded-full"
                        onClick={() => onBudgetClick(budget.category)}
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                    )}
                    <div className="flex items-center gap-1">
                      {isOverBudget && <AlertCircle className="h-3 w-3 text-destructive" />}
                      {!isOverBudget && !isNearBudget && percentage > 0 && (
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                      )}
                      <p className="text-sm">
                        {formatCurrency(budget.spent)} / {formatCurrency(budget.amount)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="relative pt-1">
                  <Progress
                    value={Math.min(percentage, 100)}
                    className="h-2"
                    indicatorClassName={getProgressColor(percentage)}
                  />
                </div>
                <div className="flex justify-between text-xs">
                  <span
                    className={cn(
                      isOverBudget ? "text-destructive" : isNearBudget ? "text-amber-500" : "text-muted-foreground",
                    )}
                  >
                    {percentage.toFixed(0)}%
                  </span>
                  {isOverBudget && (
                    <span className="text-destructive font-medium">
                      Over by {formatCurrency(budget.spent - budget.amount)}
                    </span>
                  )}
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </CardContent>
    </Card>
  )
}
