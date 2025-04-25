"use client"

import dynamic from "next/dynamic"
import { AccountCard } from "@v0/components/finance/account-card"
import { BudgetOverview } from "@v0/components/finance/budget-overview"
import { IncomeExpensesChart } from "@v0/components/finance/income-expenses-chart"
import { TransactionList } from "@v0/components/finance/transaction-list"
import { cn } from "@/lib/utils"

import { useState, useEffect, useMemo } from "react"
import { Search, PlusCircle, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getLocalStorage, setLocalStorage } from "@/lib/local-storage"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { format, isThisMonth, isThisWeek, isToday, subMonths, isWithinInterval } from "date-fns"
import { toast } from "sonner"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

// Dynamic import for the chart to prevent hydration errors
const Chart = dynamic(async () => (await import("@/components/ui/chart")).Chart, {
  ssr: false,
})

// Types
interface Transaction {
  id: string
  date: string
  description: string
  amount: number
  type: "income" | "expense"
  category: string
}

interface Budget {
  id: string
  category: string
  amount: number
}

// Default categories
const DEFAULT_CATEGORIES = [
  "Housing",
  "Transportation",
  "Food",
  "Utilities",
  "Insurance",
  "Medical",
  "Savings",
  "Personal",
  "Entertainment",
  "Debt",
  "Income",
  "Other",
]

export default function FinancePage() {
  // State
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [newTransaction, setNewTransaction] = useState<Omit<Transaction, "id">>({
    date: new Date().toISOString().split("T")[0],
    description: "",
    amount: 0,
    type: "expense",
    category: "Other",
  })
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false)
  const [isEditTransactionMode, setIsEditTransactionMode] = useState(false)
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null)
  const [newBudget, setNewBudget] = useState<Omit<Budget, "id">>({
    category: "Other",
    amount: 0,
  })
  const [activeTab, setActiveTab] = useState("overview")
  const [searchQuery, setSearchQuery] = useState("")
  const [dateFilter, setDateFilter] = useState<string>("all")
  const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null }>({
    from: subMonths(new Date(), 1),
    to: new Date(),
  })
  const [open, setOpen] = useState(false)

  // Load data from localStorage
  useEffect(() => {
    const savedTransactions = getLocalStorage<Transaction[]>("finance-transactions", [])
    const savedBudgets = getLocalStorage<Budget[]>("finance-budgets", [])

    setTransactions(savedTransactions)
    setBudgets(savedBudgets)
  }, [])

  // Save data to localStorage
  useEffect(() => {
    if (transactions.length > 0) {
      setLocalStorage("finance-transactions", transactions)
    }
    if (budgets.length > 0) {
      setLocalStorage("finance-budgets", budgets)
    }
  }, [transactions, budgets])

  // Calculate totals
  const totalIncome = transactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0)
  const totalExpenses = transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0)
  const balance = totalIncome - totalExpenses

  // Add transaction
  const addOrUpdateTransaction = () => {
    if (!newTransaction.description || newTransaction.amount <= 0) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    const transaction: Transaction = {
      ...newTransaction,
      id: editingTransactionId || crypto.randomUUID(),
      amount: Number(newTransaction.amount),
    }

    if (editingTransactionId) {
      // Update existing transaction
      setTransactions((prevTransactions) =>
        prevTransactions.map((t) => (t.id === editingTransactionId ? transaction : t)),
      )
      setIsEditTransactionMode(false)
      setEditingTransactionId(null)
      toast({
        title: "Transaction updated",
        description: "Your transaction has been updated.",
      })
    } else {
      // Add new transaction
      setTransactions([transaction, ...transactions])
      toast({
        title: "Transaction added",
        description: "Your transaction has been saved.",
      })
    }

    setNewTransaction({
      date: new Date().toISOString().split("T")[0],
      description: "",
      amount: 0,
      type: "expense",
      category: "Other",
    })
    setIsTransactionDialogOpen(false)
  }

  // Delete transaction
  const deleteTransaction = (id: string) => {
    setTransactions(transactions.filter((t) => t.id !== id))
  }

  // Edit transaction
  const editTransaction = (id: string) => {
    const transaction = transactions.find((t) => t.id === id)
    if (!transaction) return

    setNewTransaction({
      date: transaction.date,
      description: transaction.description,
      amount: transaction.amount,
      type: transaction.type,
      category: transaction.category,
    })
    setEditingTransactionId(id)
    setIsTransactionDialogOpen(true)
    setIsEditTransactionMode(true)
  }

  // Add budget
  const addBudget = () => {
    if (newBudget.amount <= 0) return

    // Check if budget for this category already exists
    const existingIndex = budgets.findIndex((b) => b.category === newBudget.category)

    if (existingIndex >= 0) {
      // Update existing budget
      const updatedBudgets = [...budgets]
      updatedBudgets[existingIndex] = {
        ...updatedBudgets[existingIndex],
        amount: Number(newBudget.amount),
      }
      setBudgets(updatedBudgets)
    } else {
      // Add new budget
      const budget: Budget = {
        ...newBudget,
        id: crypto.randomUUID(),
        amount: Number(newBudget.amount),
      }
      setBudgets([...budgets, budget])
    }

    setNewBudget({
      category: "Other",
      amount: 0,
    })
  }

  // Delete budget
  const deleteBudget = (id: string) => {
    setBudgets(budgets.filter((b) => b.id !== id))
  }

  // Calculate category spending
  const getCategorySpending = (category: string) => {
    return transactions
      .filter((t) => t.type === "expense" && t.category === category)
      .reduce((sum, t) => sum + t.amount, 0)
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions]

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (transaction) =>
          transaction.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          transaction.category.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Date filter
    if (dateFilter !== "all") {
      filtered = filtered.filter((transaction) => {
        const transactionDate = new Date(transaction.date)
        if (dateFilter === "today") {
          return isToday(transactionDate)
        } else if (dateFilter === "this-week") {
          return isThisWeek(transactionDate)
        } else if (dateFilter === "this-month") {
          return isThisMonth(transactionDate)
        }
        return true // Should not happen, but handle it
      })
    } else if (dateRange.from && dateRange.to) {
      filtered = filtered.filter((transaction) => {
        const transactionDate = new Date(transaction.date)
        return isWithinInterval(transactionDate, { start: dateRange.from!, end: dateRange.to! })
      })
    }

    return filtered
  }, [transactions, searchQuery, dateFilter, dateRange])

  // Group transactions by category
  const transactionsByCategory = useMemo(() => {
    const grouped: { [key: string]: Transaction[] } = {}
    filteredTransactions.forEach((transaction) => {
      if (!grouped[transaction.category]) {
        grouped[transaction.category] = []
      }
      grouped[transaction.category].push(transaction)
    })
    return grouped
  }, [filteredTransactions])

  // Prepare chart data
  const chartData = useMemo(() => {
    const incomeData: { name: string; value: number }[] = []
    const expenseData: { name: string; value: number }[] = []

    for (const category in transactionsByCategory) {
      const categoryTransactions = transactionsByCategory[category]
      const income = categoryTransactions.filter((tx) => tx.type === "income").reduce((sum, tx) => sum + tx.amount, 0)
      const expense = categoryTransactions.filter((tx) => tx.type === "expense").reduce((sum, tx) => sum + tx.amount, 0)

      if (income > 0) {
        incomeData.push({ name: category, value: income })
      }
      if (expense > 0) {
        expenseData.push({ name: category, value: expense })
      }
    }

    return {
      income: incomeData,
      expenses: expenseData,
    }
  }, [transactionsByCategory])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold">Overview</h2>
          <p className="text-muted-foreground">Track your finances with ease.</p>
        </div>
        <Button onClick={() => setIsTransactionDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Transaction
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <AccountCard accountName="Checking Account" balance={balance} accountType="Current" />
        <AccountCard accountName="Savings Account" balance={totalIncome} accountType="Long Term" />
        <AccountCard accountName="Credit Card" balance={totalExpenses} accountType="Liability" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <IncomeExpensesChart data={chartData.expenses} />
        <BudgetOverview
          budgets={[
            { category: "Food", amount: 500, spent: 600 },
            { category: "Transportation", amount: 300, spent: 200 },
            { category: "Entertainment", amount: 200, spent: 150 },
          ]}
        />
      </div>
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Transactions</h2>
          <div className="flex items-center space-x-2">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search transactions..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[300px] justify-start text-left font-normal",
                    !dateRange.from && "text-muted-foreground",
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {dateRange.from && dateRange.to ? (
                    format(dateRange.from, "MMM dd, yyyy") + " - " + format(dateRange.to, "MMM dd, yyyy")
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end" side="bottom">
                <CalendarComponent
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <TransactionList
          transactions={filteredTransactions}
          onEdit={(id) => {
            editTransaction(id)
            setIsTransactionDialogOpen(true)
          }}
          onDelete={deleteTransaction}
        />
      </div>

      {/* Add/Edit Transaction Dialog */}
      <Dialog open={isTransactionDialogOpen} onOpenChange={() => setIsTransactionDialogOpen(false)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{isEditTransactionMode ? "Edit Transaction" : "Add Transaction"}</DialogTitle>
            <DialogDescription>
              {isEditTransactionMode ? "Update your transaction details." : "Record a new income or expense."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={newTransaction.date}
                  onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={newTransaction.type}
                  onValueChange={(value) =>
                    setNewTransaction({ ...newTransaction, type: value as "income" | "expense" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={newTransaction.category}
                onValueChange={(value) => setNewTransaction({ ...newTransaction, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {DEFAULT_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                value={newTransaction.amount || ""}
                onChange={(e) =>
                  setNewTransaction({ ...newTransaction, amount: Number.parseFloat(e.target.value) || 0 })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newTransaction.description}
                onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                placeholder="Enter transaction description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTransactionDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={addOrUpdateTransaction}>{isEditTransactionMode ? "Update" : "Add Transaction"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
