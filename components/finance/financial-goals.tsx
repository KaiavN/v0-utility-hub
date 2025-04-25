"use client"

import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { formatCurrency } from "@/lib/utils"
import { Target, Plus, Edit2, Trash2 } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export interface FinancialGoal {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  targetDate?: string
  description?: string
  color?: string
}

interface FinancialGoalsProps {
  goals: FinancialGoal[]
  onAddGoal?: (goal: Omit<FinancialGoal, "id">) => void
  onUpdateGoal?: (id: string, goal: Omit<FinancialGoal, "id">) => void
  onDeleteGoal?: (id: string) => void
  className?: string
}

export function FinancialGoals({ goals, onAddGoal, onUpdateGoal, onDeleteGoal, className }: FinancialGoalsProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null)
  const [newGoal, setNewGoal] = useState<Omit<FinancialGoal, "id">>({
    name: "",
    targetAmount: 0,
    currentAmount: 0,
    targetDate: "",
    description: "",
    color: "#2563eb", // Default color
  })

  const handleOpenDialog = (goalId?: string) => {
    if (goalId) {
      const goal = goals.find((g) => g.id === goalId)
      if (goal) {
        setNewGoal({
          name: goal.name,
          targetAmount: goal.targetAmount,
          currentAmount: goal.currentAmount,
          targetDate: goal.targetDate || "",
          description: goal.description || "",
          color: goal.color || "#2563eb",
        })
        setEditingGoalId(goalId)
      }
    } else {
      setNewGoal({
        name: "",
        targetAmount: 0,
        currentAmount: 0,
        targetDate: "",
        description: "",
        color: "#2563eb",
      })
      setEditingGoalId(null)
    }
    setIsDialogOpen(true)
  }

  const handleSaveGoal = () => {
    if (!newGoal.name || newGoal.targetAmount <= 0) {
      return
    }

    if (editingGoalId && onUpdateGoal) {
      onUpdateGoal(editingGoalId, newGoal)
    } else if (onAddGoal) {
      onAddGoal(newGoal)
    }

    setIsDialogOpen(false)
  }

  const handleDeleteGoal = (id: string) => {
    if (onDeleteGoal) {
      onDeleteGoal(id)
    }
  }

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

  return (
    <>
      <Card className={cn("border-2 border-primary/20 shadow-lg", className)}>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <CardTitle>Financial Goals</CardTitle>
          </div>
          {onAddGoal && (
            <Button size="sm" onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-1" />
              Add Goal
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {goals.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No financial goals yet.</p>
              {onAddGoal && (
                <Button variant="outline" className="mt-4" onClick={() => handleOpenDialog()}>
                  <Plus className="h-4 w-4 mr-1" />
                  Create Your First Goal
                </Button>
              )}
            </div>
          ) : (
            <motion.div className="space-y-6" variants={container} initial="hidden" animate="show">
              {goals.map((goal) => {
                const percentage = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0

                const remaining = goal.targetAmount - goal.currentAmount

                return (
                  <motion.div
                    key={goal.id}
                    className="space-y-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    variants={item}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: goal.color || "var(--primary)" }}
                        />
                        <h3 className="font-medium">{goal.name}</h3>
                      </div>

                      {(onUpdateGoal || onDeleteGoal) && (
                        <div className="flex items-center gap-1">
                          {onUpdateGoal && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleOpenDialog(goal.id)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          )}
                          {onDeleteGoal && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleDeleteGoal(goal.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>

                    {goal.description && <p className="text-sm text-muted-foreground">{goal.description}</p>}

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>{formatCurrency(goal.currentAmount)}</span>
                        <span>{formatCurrency(goal.targetAmount)}</span>
                      </div>
                      <Progress
                        value={Math.min(percentage, 100)}
                        className="h-2"
                        indicatorClassName={goal.color ? undefined : undefined}
                        style={
                          {
                            "--progress-background": goal.color || "var(--primary)",
                          } as React.CSSProperties
                        }
                      />
                      <div className="flex justify-between text-xs">
                        <span>{percentage.toFixed(0)}% complete</span>
                        {remaining > 0 && (
                          <span className="text-muted-foreground">{formatCurrency(remaining)} to go</span>
                        )}
                      </div>
                    </div>

                    {goal.targetDate && (
                      <p className="text-xs text-muted-foreground">
                        Target date: {new Date(goal.targetDate).toLocaleDateString()}
                      </p>
                    )}
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingGoalId ? "Edit Goal" : "Add New Goal"}</DialogTitle>
            <DialogDescription>
              {editingGoalId
                ? "Update your financial goal details."
                : "Create a new financial goal to track your progress."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Goal Name</Label>
              <Input
                id="name"
                value={newGoal.name}
                onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
                placeholder="e.g., Emergency Fund, New Car"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="targetAmount">Target Amount</Label>
                <Input
                  id="targetAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newGoal.targetAmount || ""}
                  onChange={(e) => setNewGoal({ ...newGoal, targetAmount: Number(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentAmount">Current Amount</Label>
                <Input
                  id="currentAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newGoal.currentAmount || ""}
                  onChange={(e) => setNewGoal({ ...newGoal, currentAmount: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetDate">Target Date (Optional)</Label>
              <Input
                id="targetDate"
                type="date"
                value={newGoal.targetDate}
                onChange={(e) => setNewGoal({ ...newGoal, targetDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={newGoal.description}
                onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                placeholder="Add some details about your goal"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <div className="flex gap-2">
                {[
                  "#2563eb", // blue
                  "#16a34a", // green
                  "#dc2626", // red
                  "#9333ea", // purple
                  "#ea580c", // orange
                  "#0891b2", // cyan
                ].map((color) => (
                  <div
                    key={color}
                    className={cn(
                      "w-8 h-8 rounded-full cursor-pointer",
                      newGoal.color === color ? "ring-2 ring-primary ring-offset-2" : "",
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewGoal({ ...newGoal, color })}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveGoal}>{editingGoalId ? "Update Goal" : "Add Goal"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
