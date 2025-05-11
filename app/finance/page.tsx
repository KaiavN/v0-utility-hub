"use client"

import { useState, useEffect, useMemo } from "react"
import {
  Search,
  PlusCircle,
  Settings,
  LayoutDashboard,
  Wallet,
  PieChartIcon as ChartPieIcon,
  BarChart3,
  Target,
  Calculator,
  TrendingUp,
  TrendingDown,
} from "lucide-react"
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
import { isThisMonth, isThisWeek, isToday, subMonths, isWithinInterval } from "date-fns"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BudgetOverview } from "@/components/finance/budget-overview"
import { TransactionList } from "@/components/finance/transaction-list"
import { IncomeExpensesChart } from "@/components/finance/income-expenses-chart"
import { FinancialInsights } from "@/components/finance/financial-insights"
import { FinancialGoals, type FinancialGoal } from "@/components/finance/financial-goals"
import { AccountManagement, type Account } from "@/components/finance/account-management"
import { EnhancedAnalytics } from "@/components/finance/enhanced-analytics"
import { CategorySelect, type Category } from "@/components/finance/category-select"
import { SettingsDialog } from "@/components/finance/settings-dialog"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { LinkedItemsList } from "@/components/linked-items/linked-items-list"
import { LinkItemDialog } from "@/components/linked-items/link-item-dialog"

// Types
interface Transaction {
  id: string
  date: string
  description: string
  amount: number
  type: "income" | "expense"
  category: string
  accountId?: string
}

interface Budget {
  id: string
  category: string
  amount: number
}

interface DashboardLayout {
  id: string
  name: string
  layout: {
    [key: string]: {
      x: number
      y: number
      w: number
      h: number
    }
  }
}

// Default categories
const DEFAULT_CATEGORIES: Category[] = [
  { id: crypto.randomUUID(), name: "Housing", color: "#2563eb" },
  { id: crypto.randomUUID(), name: "Transportation", color: "#16a34a" },
  { id: crypto.randomUUID(), name: "Food", color: "#dc2626" },
  { id: crypto.randomUUID(), name: "Utilities", color: "#9333ea" },
  { id: crypto.randomUUID(), name: "Insurance", color: "#ea580c" },
  { id: crypto.randomUUID(), name: "Medical", color: "#0891b2" },
  { id: crypto.randomUUID(), name: "Savings", color: "#4f46e5" },
  { id: crypto.randomUUID(), name: "Personal", color: "#db2777" },
  { id: crypto.randomUUID(), name: "Entertainment", color: "#f59e0b" },
  { id: crypto.randomUUID(), name: "Debt", color: "#64748b" },
  { id: crypto.randomUUID(), name: "Income", color: "#10b981" },
  { id: crypto.randomUUID(), name: "Other", color: "#6b7280" },
]

// Default accounts
const DEFAULT_ACCOUNTS: Account[] = [
  {
    id: crypto.randomUUID(),
    name: "Checking Account",
    type: "Checking",
    balance: 2500,
    currency: "USD",
    icon: "wallet",
    includeInTotal: true,
    isAsset: true,
  },
  {
    id: crypto.randomUUID(),
    name: "Savings Account",
    type: "Savings",
    balance: 10000,
    currency: "USD",
    icon: "piggy-bank",
    includeInTotal: true,
    isAsset: true,
  },
  {
    id: crypto.randomUUID(),
    name: "Credit Card",
    type: "Credit Card",
    balance: 1500,
    currency: "USD",
    icon: "credit-card",
    includeInTotal: true,
    isAsset: false,
  },
]

// Default dashboard layouts
const DEFAULT_LAYOUTS: DashboardLayout[] = [
  {
    id: "default",
    name: "Default",
    layout: {
      accounts: { x: 0, y: 0, w: 12, h: 2 },
      analytics: { x: 0, y: 2, w: 12, h: 3 },
      incomeExpenses: { x: 0, y: 5, w: 6, h: 2 },
      budgets: { x: 6, y: 5, w: 6, h: 2 },
      insights: { x: 0, y: 7, w: 6, h: 2 },
      goals: { x: 6, y: 7, w: 6, h: 2 },
      transactions: { x: 0, y: 9, w: 12, h: 3 },
    },
  },
  {
    id: "analytics",
    name: "Analytics Focus",
    layout: {
      accounts: { x: 0, y: 0, w: 12, h: 2 },
      analytics: { x: 0, y: 2, w: 12, h: 4 },
      incomeExpenses: { x: 0, y: 6, w: 12, h: 0 },
      budgets: { x: 0, y: 6, w: 6, h: 2 },
      insights: { x: 6, y: 6, w: 6, h: 2 },
      goals: { x: 0, y: 8, w: 12, h: 0 },
      transactions: { x: 0, y: 8, w: 12, h: 3 },
    },
  },
  {
    id: "budget",
    name: "Budget Focus",
    layout: {
      accounts: { x: 0, y: 0, w: 12, h: 2 },
      analytics: { x: 0, y: 2, w: 6, h: 3 },
      incomeExpenses: { x: 6, y: 2, w: 6, h: 3 },
      budgets: { x: 0, y: 5, w: 12, h: 3 },
      insights: { x: 0, y: 8, w: 12, h: 0 },
      goals: { x: 0, y: 8, w: 12, h: 2 },
      transactions: { x: 0, y: 10, w: 12, h: 3 },
    },
  },
]

export default function FinancePage() {
  // State
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES)
  const [accounts, setAccounts] = useState<Account[]>(DEFAULT_ACCOUNTS)
  const [goals, setGoals] = useState<FinancialGoal[]>([])
  const [layouts, setLayouts] = useState<DashboardLayout[]>(DEFAULT_LAYOUTS)
  const [activeLayout, setActiveLayout] = useState<string>("default")
  const [newTransaction, setNewTransaction] = useState<Omit<Transaction, "id">>({
    date: new Date().toISOString().split("T")[0],
    description: "",
    amount: 0,
    type: "expense",
    category: "Other",
    accountId: "",
  })
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false)
  const [isEditTransactionMode, setIsEditTransactionMode] = useState(false)
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null)
  const [newBudget, setNewBudget] = useState<Omit<Budget, "id">>({
    category: "Other",
    amount: 0,
  })
  const [activeTab, setActiveTab] = useState("dashboard")
  const [searchQuery, setSearchQuery] = useState("")
  const [dateFilter, setDateFilter] = useState<string>("all")
  const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null }>({
    from: subMonths(new Date(), 1),
    to: new Date(),
  })
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [newCategoryColor, setNewCategoryColor] = useState("#2563eb")
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isCompactMode, setIsCompactMode] = useState(false)
  const [currentLayout, setCurrentLayout] = useState<DashboardLayout>(DEFAULT_LAYOUTS[0])
  const [isBudgetDialogOpen, setIsBudgetDialogOpen] = useState(false)
  const [currency, setCurrency] = useState<string>("USD")
  const [dateFormat, setDateFormat] = useState<string>("MM/DD/YYYY")
  const [chartStyle, setChartStyle] = useState<string>("default")
  const [chartAnimations, setChartAnimations] = useState<boolean>(true)

  // Helper function to get transaction ID for linking
  const getTransactionLinkId = (transaction: any) => {
    return transaction?.id || ""
  }

  // Load data from localStorage
  useEffect(() => {
    const savedTransactions = getLocalStorage<Transaction[]>("finance-transactions", [])
    const savedBudgets = getLocalStorage<Budget[]>("finance-budgets", [])
    const savedCategories = getLocalStorage<Category[]>("finance-categories", DEFAULT_CATEGORIES)
    const savedAccounts = getLocalStorage<Account[]>("finance-accounts", DEFAULT_ACCOUNTS)
    const savedGoals = getLocalStorage<FinancialGoal[]>("finance-goals", [])
    const savedLayouts = getLocalStorage<DashboardLayout[]>("finance-layouts", DEFAULT_LAYOUTS)
    const savedActiveLayout = getLocalStorage<string>("finance-active-layout", "default")
    const savedIsCompactMode = getLocalStorage<boolean>("finance-compact-mode", false)
    const savedCurrency = getLocalStorage<string>("finance-currency", "USD")
    const savedDateFormat = getLocalStorage<string>("finance-date-format", "MM/DD/YYYY")
    const savedChartStyle = getLocalStorage<string>("finance-chart-style", "default")
    const savedChartAnimations = getLocalStorage<boolean>("finance-chart-animations", true)

    setTransactions(savedTransactions)
    setBudgets(savedBudgets)
    setCategories(savedCategories)
    setAccounts(savedAccounts)
    setGoals(savedGoals)
    setLayouts(savedLayouts)
    setActiveLayout(savedActiveLayout)
    setIsCompactMode(savedIsCompactMode)
    setCurrency(savedCurrency)
    setDateFormat(savedDateFormat)
    setChartStyle(savedChartStyle)
    setChartAnimations(savedChartAnimations)

    // Set current layout
    const layout = savedLayouts.find((l) => l.id === savedActiveLayout) || DEFAULT_LAYOUTS[0]
    setCurrentLayout(layout)
  }, [])

  // Save data to localStorage
  useEffect(() => {
    if (transactions.length > 0) {
      setLocalStorage("finance-transactions", transactions)
    }
    if (budgets.length > 0) {
      setLocalStorage("finance-budgets", budgets)
    }
    if (categories.length > 0) {
      setLocalStorage("finance-categories", categories)
    }
    if (accounts.length > 0) {
      setLocalStorage("finance-accounts", accounts)
    }
    if (goals.length > 0) {
      setLocalStorage("finance-goals", goals)
    }
    if (layouts.length > 0) {
      setLocalStorage("finance-layouts", layouts)
    }
    setLocalStorage("finance-active-layout", activeLayout)
    setLocalStorage("finance-compact-mode", isCompactMode)
    setLocalStorage("finance-currency", currency)
    setLocalStorage("finance-date-format", dateFormat)
    setLocalStorage("finance-chart-style", chartStyle)
    setLocalStorage("finance-chart-animations", chartAnimations)
  }, [
    transactions,
    budgets,
    categories,
    accounts,
    goals,
    layouts,
    activeLayout,
    isCompactMode,
    currency,
    dateFormat,
    chartStyle,
    chartAnimations,
  ])

  // Calculate totals
  const totalIncome = transactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0)
  const totalExpenses = transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0)
  const balance = totalIncome - totalExpenses

  // Add transaction
  const addOrUpdateTransaction = () => {
    if (!newTransaction.description || newTransaction.amount <= 0 || !newTransaction.accountId) {
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

      // Update account balance
      if (transaction.accountId) {
        updateAccountBalance(transaction, true)
      }

      setIsEditTransactionMode(false)
      setEditingTransactionId(null)
      toast({
        title: "Transaction updated",
        description: "Your transaction has been updated.",
      })
    } else {
      // Add new transaction
      setTransactions([transaction, ...transactions])

      // Update account balance
      if (transaction.accountId) {
        updateAccountBalance(transaction)
      }

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
      accountId: "",
    })
    setIsTransactionDialogOpen(false)
  }

  // Update account balance when adding/editing transactions
  const updateAccountBalance = (transaction: Transaction, isEdit = false) => {
    const account = accounts.find((a) => a.id === transaction.accountId)
    if (!account) return

    setAccounts((prevAccounts) => {
      return prevAccounts.map((a) => {
        if (a.id === transaction.accountId) {
          let newBalance = a.balance

          // If editing, first remove the effect of the old transaction
          if (isEdit && editingTransactionId) {
            const oldTransaction = transactions.find((t) => t.id === editingTransactionId)
            if (oldTransaction && oldTransaction.accountId === a.id) {
              if (oldTransaction.type === "income") {
                newBalance -= oldTransaction.amount
              } else {
                newBalance += oldTransaction.amount
              }
            }
          }

          // Apply the new transaction
          if (transaction.type === "income") {
            newBalance += transaction.amount
          } else {
            newBalance -= transaction.amount
          }

          return { ...a, balance: newBalance }
        }
        return a
      })
    })
  }

  // Delete transaction
  const deleteTransaction = (id: string) => {
    const transaction = transactions.find((t) => t.id === id)
    if (transaction && transaction.accountId) {
      // Reverse the effect on account balance
      setAccounts((prevAccounts) => {
        return prevAccounts.map((a) => {
          if (a.id === transaction.accountId) {
            let newBalance = a.balance
            if (transaction.type === "income") {
              newBalance -= transaction.amount
            } else {
              newBalance += transaction.amount
            }
            return { ...a, balance: newBalance }
          }
          return a
        })
      })
    }

    setTransactions(transactions.filter((t) => t.id !== id))
    toast({
      title: "Transaction deleted",
      description: "The transaction has been removed.",
    })
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
      accountId: transaction.accountId || "",
    })
    setEditingTransactionId(id)
    setIsTransactionDialogOpen(true)
    setIsEditTransactionMode(true)
  }

  // Add budget
  const addBudget = () => {
    if (newBudget.amount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid budget amount.",
        variant: "destructive",
      })
      return
    }

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
      toast({
        title: "Budget updated",
        description: `Budget for ${newBudget.category} has been updated.`,
      })
    } else {
      // Add new budget
      const budget: Budget = {
        ...newBudget,
        id: crypto.randomUUID(),
        amount: Number(newBudget.amount),
      }
      setBudgets([...budgets, budget])
      toast({
        title: "Budget added",
        description: `Budget for ${newBudget.category} has been added.`,
      })
    }

    setNewBudget({
      category: "Other",
      amount: 0,
    })
    setIsBudgetDialogOpen(false)
  }

  // Delete budget
  const deleteBudget = (id: string) => {
    const budget = budgets.find((b) => b.id === id)
    setBudgets(budgets.filter((b) => b.id !== id))
    if (budget) {
      toast({
        title: "Budget deleted",
        description: `Budget for ${budget.category} has been removed.`,
      })
    }
  }

  // Add account
  const addAccount = (account: Omit<Account, "id">) => {
    const newAccount: Account = {
      ...account,
      id: crypto.randomUUID(),
    }
    setAccounts([...accounts, newAccount])
  }

  // Update account
  const updateAccount = (id: string, account: Omit<Account, "id">) => {
    setAccounts(accounts.map((a) => (a.id === id ? { ...account, id } : a)))
  }

  // Delete account
  const deleteAccount = (id: string) => {
    // Check if there are transactions associated with this account
    const hasTransactions = transactions.some((t) => t.accountId === id)

    if (hasTransactions) {
      toast({
        title: "Cannot delete account",
        description:
          "This account has transactions associated with it. Please delete or reassign those transactions first.",
        variant: "destructive",
      })
      return
    }

    setAccounts(accounts.filter((a) => a.id !== id))
    toast({
      title: "Account deleted",
      description: "The account has been removed.",
    })
  }

  // Update all accounts (used for currency conversion)
  const updateAccounts = (newAccounts: Account[]) => {
    setAccounts(newAccounts)
    toast({
      title: "Accounts updated",
      description: "Your account balances have been converted to the new currency.",
    })
  }

  // Add goal
  const addGoal = (goal: Omit<FinancialGoal, "id">) => {
    const newGoal: FinancialGoal = {
      ...goal,
      id: crypto.randomUUID(),
    }
    setGoals([...goals, newGoal])
    toast({
      title: "Goal added",
      description: `Your goal "${goal.name}" has been added.`,
    })
  }

  // Update goal
  const updateGoal = (id: string, goal: Omit<FinancialGoal, "id">) => {
    setGoals(goals.map((g) => (g.id === id ? { ...goal, id } : g)))
    toast({
      title: "Goal updated",
      description: `Your goal "${goal.name}" has been updated.`,
    })
  }

  // Delete goal
  const deleteGoal = (id: string) => {
    const goal = goals.find((g) => g.id === id)
    setGoals(goals.filter((g) => g.id !== id))
    if (goal) {
      toast({
        title: "Goal deleted",
        description: `Your goal "${goal.name}" has been removed.`,
      })
    }
  }

  // Add category
  const addCategory = (category: Category) => {
    setCategories([...categories, category])
  }

  // Calculate category spending
  const getCategorySpending = (category: string) => {
    return transactions
      .filter((t) => t.type === "expense" && t.category === category)
      .reduce((sum, t) => sum + t.amount, 0)
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

  // Prepare chart data
  const chartData = useMemo(() => {
    const expensesByCategory: { [key: string]: number } = {}
    const incomeByCategory: { [key: string]: number } = {}

    // Group by category
    filteredTransactions.forEach((transaction) => {
      if (transaction.type === "expense") {
        if (!expensesByCategory[transaction.category]) {
          expensesByCategory[transaction.category] = 0
        }
        expensesByCategory[transaction.category] += transaction.amount
      } else {
        if (!incomeByCategory[transaction.category]) {
          incomeByCategory[transaction.category] = 0
        }
        incomeByCategory[transaction.category] += transaction.amount
      }
    })

    // Convert to array format for charts
    const expensesData = Object.entries(expensesByCategory).map(([name, value]) => ({ name, value }))
    const incomeData = Object.entries(incomeByCategory).map(([name, value]) => ({ name, value }))

    // Sort by value (highest first)
    expensesData.sort((a, b) => b.value - a.value)
    incomeData.sort((a, b) => b.value - a.value)

    return {
      expenses: expensesData,
      income: incomeData,
    }
  }, [filteredTransactions])

  // Prepare budget data
  const budgetData = useMemo(() => {
    return budgets.map((budget) => {
      const spent = getCategorySpending(budget.category)
      return {
        category: budget.category,
        amount: budget.amount,
        spent,
        color: categories.find((c) => c.name === budget.category)?.color,
      }
    })
  }, [budgets, transactions, categories])

  // Change active layout
  const handleLayoutChange = (layoutId: string) => {
    const layout = layouts.find((l) => l.id === layoutId)
    if (layout) {
      setActiveLayout(layoutId)
      setCurrentLayout(layout)

      // Apply the layout changes to the UI
      const layoutElements = document.querySelectorAll("[data-layout-item]")
      layoutElements.forEach((element) => {
        const itemName = element.getAttribute("data-layout-item")
        if (itemName && layout.layout[itemName]) {
          const { x, y, w, h } = layout.layout[itemName]
          const gridElement = element as HTMLElement

          // Only hide if height is 0
          if (h === 0) {
            gridElement.style.display = "none"
          } else {
            gridElement.style.display = ""
            gridElement.style.gridColumn = `span ${w} / span ${w}`
            // Additional positioning could be added here if needed
          }
        }
      })
    }
  }

  const formatCurrency = (amount: number) => {
    const formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
    return formatter.format(amount)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    switch (dateFormat) {
      case "MM/DD/YYYY":
        return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`
      case "DD/MM/YYYY":
        return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`
      case "YYYY-MM-DD":
        return dateString.split("T")[0]
      default:
        return dateString.split("T")[0]
    }
  }

  // Calculate total budget and spent
  const totalBudgeted = budgets.reduce((sum, budget) => sum + budget.amount, 0)
  const totalSpent = budgets.reduce((sum, budget) => sum + getCategorySpending(budget.category), 0)
  const budgetProgress = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0

  // Calculate total goals progress
  const totalGoalTargets = goals.reduce((sum, goal) => sum + goal.targetAmount, 0)
  const totalGoalProgress = goals.reduce((sum, goal) => sum + goal.currentAmount, 0)
  const goalsProgress = totalGoalTargets > 0 ? (totalGoalProgress / totalGoalTargets) * 100 : 0

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Financial Dashboard</h2>
          <p className="text-muted-foreground">Track, analyze, and optimize your finances</p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={activeLayout} onValueChange={handleLayoutChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select layout" />
            </SelectTrigger>
            <SelectContent>
              {layouts.map((layout) => (
                <SelectItem key={layout.id} value={layout.id}>
                  {layout.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" onClick={() => setIsSettingsOpen(true)}>
            <Settings className="h-4 w-4" />
          </Button>

          <Button onClick={() => setIsTransactionDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Transaction
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full max-w-md mx-auto mb-6 grid grid-cols-5 h-10">
          <TabsTrigger value="dashboard" className="rounded-md">
            <LayoutDashboard className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Overview</span>
            <span className="sm:hidden">Home</span>
          </TabsTrigger>
          <TabsTrigger value="accounts" className="rounded-md">
            <Wallet className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Accounts</span>
            <span className="sm:hidden">Acct</span>
          </TabsTrigger>
          <TabsTrigger value="budgets" className="rounded-md">
            <Calculator className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Budgets</span>
            <span className="sm:hidden">Budg</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="rounded-md">
            <ChartPieIcon className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Analytics</span>
            <span className="sm:hidden">Analy</span>
          </TabsTrigger>
          <TabsTrigger value="transactions" className="rounded-md">
            <BarChart3 className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Transactions</span>
            <span className="sm:hidden">Trans</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="m-0 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardHeader className="pb-2">
                <CardDescription>Total Balance</CardDescription>
                <CardTitle className="text-2xl">{formatCurrency(balance)}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground flex items-center">
                  {balance >= 0 ? (
                    <TrendingUp className="h-4 w-4 mr-1 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 mr-1 text-red-500" />
                  )}
                  {balance >= 0 ? "Positive" : "Negative"} cash flow
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-500/20">
              <CardHeader className="pb-2">
                <CardDescription>Income</CardDescription>
                <CardTitle className="text-2xl text-green-500">{formatCurrency(totalIncome)}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground flex items-center">
                  <TrendingUp className="h-4 w-4 mr-1 text-green-500" />
                  {transactions.filter((t) => t.type === "income").length} transactions
                </div>
              </CardContent>
            </Card>

            <Card className="border-red-500/20">
              <CardHeader className="pb-2">
                <CardDescription>Expenses</CardDescription>
                <CardTitle className="text-2xl text-red-500">{formatCurrency(totalExpenses)}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground flex items-center">
                  <TrendingDown className="h-4 w-4 mr-1 text-red-500" />
                  {transactions.filter((t) => t.type === "expense").length} transactions
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Accounts</CardDescription>
                <CardTitle className="text-2xl">{accounts.length}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  {accounts.filter((a) => a.isAsset).length} assets, {accounts.filter((a) => !a.isAsset).length}{" "}
                  liabilities
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Dashboard Content */}
          <div className="grid grid-cols-12 gap-6">
            {/* Accounts */}
            <div className="col-span-12" data-layout-item="accounts">
              <AccountManagement
                accounts={accounts}
                onAddAccount={addAccount}
                onUpdateAccount={updateAccount}
                onDeleteAccount={deleteAccount}
              />
            </div>

            {/* Income/Expenses Chart & Budget Overview */}
            <div className="col-span-12 md:col-span-6" data-layout-item="incomeExpenses">
              <IncomeExpensesChart data={chartData.expenses} incomeData={chartData.income} />
            </div>
            <div className="col-span-12 md:col-span-6" data-layout-item="budgets">
              <BudgetOverview
                budgets={budgetData}
                onBudgetClick={(category) => {
                  const budget = budgets.find((b) => b.category === category)
                  if (budget) {
                    setNewBudget({
                      category: budget.category,
                      amount: budget.amount,
                    })
                  }
                  setIsBudgetDialogOpen(true)
                }}
                onAddBudget={() => {
                  setNewBudget({
                    category: "Other",
                    amount: 0,
                  })
                  setIsBudgetDialogOpen(true)
                }}
              />
            </div>

            {/* Financial Insights & Goals */}
            <div className="col-span-12 md:col-span-6" data-layout-item="insights">
              <FinancialInsights transactions={transactions} />
            </div>
            <div className="col-span-12 md:col-span-6" data-layout-item="goals">
              <FinancialGoals goals={goals} onAddGoal={addGoal} onUpdateGoal={updateGoal} onDeleteGoal={deleteGoal} />
            </div>

            {/* Recent Transactions */}
            <div className="col-span-12" data-layout-item="transactions">
              <TransactionList
                transactions={filteredTransactions.slice(0, 5)}
                onEdit={editTransaction}
                onDelete={deleteTransaction}
                showSearch={false}
                showFilters={false}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="accounts" className="m-0">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl">Total Assets</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">
                    {formatCurrency(accounts.filter((a) => a.isAsset).reduce((sum, a) => sum + a.balance, 0))}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-destructive/10 to-destructive/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl">Total Liabilities</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">
                    {formatCurrency(
                      Math.abs(accounts.filter((a) => !a.isAsset).reduce((sum, a) => sum + a.balance, 0)),
                    )}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl">Net Worth</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">
                    {formatCurrency(accounts.reduce((sum, a) => sum + a.balance, 0))}
                  </p>
                </CardContent>
              </Card>
            </div>

            <AccountManagement
              accounts={accounts}
              onAddAccount={addAccount}
              onUpdateAccount={updateAccount}
              onDeleteAccount={deleteAccount}
              className="border-0 shadow-none"
            />
          </div>
        </TabsContent>

        <TabsContent value="budgets" className="m-0">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Budget Summary */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calculator className="h-5 w-5 mr-2" />
                    Budget Overview
                  </CardTitle>
                  <CardDescription>Track your spending against your budget</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Total Budgeted</span>
                        <span className="text-sm font-medium">{formatCurrency(totalBudgeted)}</span>
                      </div>
                      <Progress value={100} className="h-2" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Total Spent</span>
                        <span className="text-sm font-medium">{formatCurrency(totalSpent)}</span>
                      </div>
                      <Progress
                        value={budgetProgress}
                        className="h-2"
                        indicatorClassName={
                          budgetProgress > 100 ? "bg-destructive" : budgetProgress > 85 ? "bg-amber-500" : undefined
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Remaining</span>
                        <span className="text-sm font-medium">{formatCurrency(totalBudgeted - totalSpent)}</span>
                      </div>
                      <Progress
                        value={Math.max(0, 100 - budgetProgress)}
                        className="h-2"
                        indicatorClassName="bg-green-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={() => {
                        setNewBudget({
                          category: "Other",
                          amount: 0,
                        })
                        setIsBudgetDialogOpen(true)
                      }}
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add Budget
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Budget List */}
              <Card>
                <CardHeader>
                  <CardTitle>Budget Categories</CardTitle>
                  <CardDescription>Your spending limits by category</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-[400px] overflow-y-auto">
                    {budgetData.length > 0 ? (
                      <div className="divide-y">
                        {budgetData.map((budget) => {
                          const percentage = budget.amount > 0 ? (budget.spent / budget.amount) * 100 : 0
                          const isOverBudget = percentage > 100
                          const isNearBudget = percentage > 85 && percentage <= 100

                          return (
                            <div key={budget.category} className="p-4 hover:bg-muted/50 transition-colors">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center">
                                  <div
                                    className="w-3 h-3 rounded-full mr-2"
                                    style={{ backgroundColor: budget.color || "var(--primary)" }}
                                  />
                                  <span className="font-medium">{budget.category}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge
                                    variant={isOverBudget ? "destructive" : isNearBudget ? "outline" : "secondary"}
                                  >
                                    {percentage.toFixed(0)}%
                                  </Badge>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => {
                                      setNewBudget({
                                        category: budget.category,
                                        amount: budget.amount,
                                      })
                                      setIsBudgetDialogOpen(true)
                                    }}
                                  >
                                    <Calculator className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                              <div className="space-y-1">
                                <Progress
                                  value={Math.min(percentage, 100)}
                                  className="h-2"
                                  indicatorClassName={
                                    isOverBudget ? "bg-destructive" : isNearBudget ? "bg-amber-500" : undefined
                                  }
                                />
                                <div className="flex justify-between text-sm text-muted-foreground">
                                  <span>{formatCurrency(budget.spent)} spent</span>
                                  <span>{formatCurrency(budget.amount)} budgeted</span>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="p-8 text-center">
                        <p className="text-muted-foreground mb-4">No budgets created yet</p>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setNewBudget({
                              category: "Other",
                              amount: 0,
                            })
                            setIsBudgetDialogOpen(true)
                          }}
                        >
                          <PlusCircle className="h-4 w-4 mr-2" />
                          Create Your First Budget
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Goals Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Financial Goals</CardTitle>
                  <CardDescription>Track progress towards your financial goals</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-[400px] overflow-y-auto">
                    {goals.length > 0 ? (
                      <div className="divide-y">
                        {goals.map((goal) => {
                          const percentage = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0

                          return (
                            <div key={goal.id} className="p-4 hover:bg-muted/50 transition-colors">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center">
                                  <div
                                    className="w-3 h-3 rounded-full mr-2"
                                    style={{ backgroundColor: goal.color || "var(--primary)" }}
                                  />
                                  <span className="font-medium">{goal.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary">{percentage.toFixed(0)}%</Badge>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => {
                                      const goalToEdit = goals.find((g) => g.id === goal.id)
                                      if (goalToEdit) {
                                        const editedGoal: Omit<FinancialGoal, "id"> = {
                                          name: goalToEdit.name,
                                          targetAmount: goalToEdit.targetAmount,
                                          currentAmount: goalToEdit.currentAmount,
                                          targetDate: goalToEdit.targetDate,
                                          description: goalToEdit.description,
                                          color: goalToEdit.color,
                                        }
                                        updateGoal(goal.id, editedGoal)
                                      }
                                    }}
                                  >
                                    <Target className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                              <div className="space-y-1">
                                <Progress value={percentage} className="h-2" />
                                <div className="flex justify-between text-sm text-muted-foreground">
                                  <span>{formatCurrency(goal.currentAmount)} saved</span>
                                  <span>{formatCurrency(goal.targetAmount)} goal</span>
                                </div>
                                {goal.targetDate && (
                                  <div className="text-xs text-muted-foreground mt-1">
                                    Target date: {new Date(goal.targetDate).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="p-8 text-center">
                        <p className="text-muted-foreground mb-4">No goals created yet</p>
                        <Button
                          variant="outline"
                          onClick={() => {
                            const newGoal: Omit<FinancialGoal, "id"> = {
                              name: "",
                              targetAmount: 0,
                              currentAmount: 0,
                              targetDate: "",
                              description: "",
                              color: "#2563eb",
                            }
                            addGoal(newGoal)
                          }}
                        >
                          <PlusCircle className="h-4 w-4 mr-2" />
                          Create Your First Goal
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="border-t p-4">
                  <Button
                    className="w-full"
                    onClick={() => {
                      const newGoal: Omit<FinancialGoal, "id"> = {
                        name: "",
                        targetAmount: 0,
                        currentAmount: 0,
                        targetDate: "",
                        description: "",
                        color: "#2563eb",
                      }
                      addGoal(newGoal)
                    }}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add New Goal
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="m-0">
          <Card className="border-primary/20 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Financial Analytics
              </CardTitle>
              <CardDescription>Visualize your financial data and identify trends</CardDescription>
            </CardHeader>
            <CardContent>
              <EnhancedAnalytics
                transactions={transactions}
                className="border-0 shadow-none"
                chartAnimations={chartAnimations}
                chartStyle={chartStyle}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="m-0">
          <Card className="border-primary/20 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Transaction History
              </CardTitle>
              <CardDescription>View and manage all your financial transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search transactions..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Filter by date" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="this-week">This Week</SelectItem>
                      <SelectItem value="this-month">This Month</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button onClick={() => setIsTransactionDialogOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add
                  </Button>
                </div>
              </div>

              <TransactionList
                transactions={filteredTransactions}
                onEdit={editTransaction}
                onDelete={deleteTransaction}
                showSearch={false}
                showFilters={true}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Transaction Dialog */}
      <Dialog open={isTransactionDialogOpen} onOpenChange={setIsTransactionDialogOpen}>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <CategorySelect
                  categories={categories}
                  selectedCategory={newTransaction.category}
                  onCategoryChange={(category) => setNewTransaction({ ...newTransaction, category })}
                  onAddCategory={addCategory}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="account">Account</Label>
                <Select
                  value={newTransaction.accountId}
                  onValueChange={(value) => setNewTransaction({ ...newTransaction, accountId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
            <div className="space-y-2 mt-4 pt-4 border-t">
              <Label>Linked Items</Label>
              {editingTransactionId && (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Link this transaction to related items</span>
                    <LinkItemDialog
                      sourceId={editingTransactionId}
                      sourceType="finance"
                      onLinkAdded={() => {
                        // Force refresh
                        const updatedTransactions = [...transactions]
                        setTransactions(updatedTransactions)
                      }}
                    />
                  </div>
                  <LinkedItemsList
                    sourceId={editingTransactionId}
                    sourceType="finance"
                    showEmpty={true}
                    maxItems={3}
                    emptyMessage="No items linked yet. Link clients, projects, or other related items."
                  />
                </>
              )}
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

      <SettingsDialog
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        isCompactMode={isCompactMode}
        setIsCompactMode={setIsCompactMode}
        currency={currency}
        setCurrency={setCurrency}
        dateFormat={dateFormat}
        setDateFormat={setDateFormat}
        chartStyle={chartStyle}
        setChartStyle={setChartStyle}
        chartAnimations={chartAnimations}
        setChartAnimations={setChartAnimations}
        accounts={accounts}
        updateAccounts={updateAccounts}
      />

      {/* Add/Edit Budget Dialog */}
      <Dialog open={isBudgetDialogOpen} onOpenChange={setIsBudgetDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Manage Budgets</DialogTitle>
            <DialogDescription>Create or update your budget categories</DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto pr-2">
            <div className="space-y-4 py-2">
              {budgets.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-medium">Current Budgets</h3>
                  {budgets.map((budget) => {
                    const spent = getCategorySpending(budget.category)
                    const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0
                    const categoryColor = categories.find((c) => c.name === budget.category)?.color || "#2563eb"

                    return (
                      <div
                        key={budget.id}
                        className="flex items-center justify-between space-x-2 p-3 border rounded-md"
                      >
                        <div className="flex-1">
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: categoryColor }} />
                            <span className="font-medium">{budget.category}</span>
                          </div>
                          <div className="flex justify-between text-sm mt-1">
                            <span>Budget: {formatCurrency(budget.amount)}</span>
                            <span>
                              Spent: {formatCurrency(spent)} ({percentage.toFixed(0)}%)
                            </span>
                          </div>
                        </div>
                        <Button variant="destructive" size="sm" onClick={() => deleteBudget(budget.id)}>
                          Delete
                        </Button>
                      </div>
                    )
                  })}
                </div>
              )}

              <div className="border-t pt-4 mt-4">
                <h3 className="font-medium mb-4">
                  {newBudget.category !== "Other" ? `Update ${newBudget.category} Budget` : "Add New Budget"}
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="budgetCategory">Category</Label>
                    <CategorySelect
                      categories={categories}
                      selectedCategory={newBudget.category}
                      onCategoryChange={(category) => setNewBudget({ ...newBudget, category })}
                      onAddCategory={addCategory}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="budgetAmount">Monthly Budget Amount</Label>
                    <Input
                      id="budgetAmount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={newBudget.amount || ""}
                      onChange={(e) => setNewBudget({ ...newBudget, amount: Number.parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setNewBudget({
                  category: "Other",
                  amount: 0,
                })
                setIsBudgetDialogOpen(false)
              }}
            >
              Cancel
            </Button>
            <Button onClick={addBudget}>Save Budget</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
