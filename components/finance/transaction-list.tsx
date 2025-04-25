"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Edit2, Trash2, ArrowUpRight, ArrowDownLeft, Filter, SortDesc, SortAsc, Search } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useState } from "react"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface Transaction {
  id: string
  date: string
  description: string
  amount: number
  type: string
  category: string
}

interface TransactionListProps {
  transactions: Transaction[]
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  className?: string
  showSearch?: boolean
  showFilters?: boolean
}

export function TransactionList({
  transactions: initialTransactions,
  onEdit,
  onDelete,
  className,
  showSearch = true,
  showFilters = true,
}: TransactionListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortField, setSortField] = useState<"date" | "amount">("date")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  // Get unique categories
  const categories = [...new Set(initialTransactions.map((t) => t.category))]

  // Filter and sort transactions
  const filteredTransactions = initialTransactions
    .filter((transaction) => {
      // Search filter
      const matchesSearch =
        searchTerm === "" ||
        transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.category.toLowerCase().includes(searchTerm.toLowerCase())

      // Type filter
      const matchesType = typeFilter === "all" || transaction.type === typeFilter

      // Category filter
      const matchesCategory = selectedCategory === null || transaction.category === selectedCategory

      return matchesSearch && matchesType && matchesCategory
    })
    .sort((a, b) => {
      // Sort by field
      if (sortField === "date") {
        const dateA = new Date(a.date).getTime()
        const dateB = new Date(b.date).getTime()
        return sortDirection === "asc" ? dateA - dateB : dateB - dateA
      } else {
        return sortDirection === "asc" ? a.amount - b.amount : b.amount - a.amount
      }
    })

  const toggleSortDirection = () => {
    setSortDirection(sortDirection === "asc" ? "desc" : "asc")
  }

  const toggleSortField = () => {
    setSortField(sortField === "date" ? "amount" : "date")
  }

  return (
    <Card className={cn("border border-primary/20 shadow-sm overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2">
          {showFilters ? "Transactions" : "Recent Transactions"}
          <Badge variant="outline" className="ml-2">
            {filteredTransactions.length}
          </Badge>
        </CardTitle>

        {showFilters && (
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1">
                  <Filter className="h-3.5 w-3.5" />
                  Filter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Transaction Type</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => setTypeFilter("all")}
                  className={typeFilter === "all" ? "bg-muted" : ""}
                >
                  All Transactions
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setTypeFilter("income")}
                  className={typeFilter === "income" ? "bg-muted" : ""}
                >
                  Income Only
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setTypeFilter("expense")}
                  className={typeFilter === "expense" ? "bg-muted" : ""}
                >
                  Expenses Only
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                <DropdownMenuLabel>Categories</DropdownMenuLabel>
                <div className="max-h-[200px] overflow-y-auto">
                  <DropdownMenuItem
                    onClick={() => setSelectedCategory(null)}
                    className={selectedCategory === null ? "bg-muted" : ""}
                  >
                    All Categories
                  </DropdownMenuItem>
                  {categories.map((category) => (
                    <DropdownMenuItem
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={selectedCategory === category ? "bg-muted" : ""}
                    >
                      {category}
                    </DropdownMenuItem>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 gap-1" onClick={toggleSortField}>
                    {sortField === "date" ? "Date" : "Amount"}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Sort by {sortField === "date" ? "date" : "amount"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8" onClick={toggleSortDirection}>
                    {sortDirection === "asc" ? (
                      <SortAsc className="h-3.5 w-3.5" />
                    ) : (
                      <SortDesc className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Sort {sortDirection === "asc" ? "ascending" : "descending"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </CardHeader>

      {showSearch && (
        <div className="px-6 pb-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 pl-8"
            />
          </div>
        </div>
      )}

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          {filteredTransactions.length > 0 ? (
            <div className="divide-y">
              <AnimatePresence>
                {filteredTransactions.map((transaction) => (
                  <motion.div
                    key={transaction.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors border-t border-border/40 first:border-t-0"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex items-center justify-center w-10 h-10 rounded-full",
                          transaction.type === "income"
                            ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
                        )}
                      >
                        {transaction.type === "income" ? (
                          <ArrowUpRight className="h-5 w-5" />
                        ) : (
                          <ArrowDownLeft className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{transaction.description}</div>
                        <div className="text-sm text-muted-foreground">{formatDate(transaction.date)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div>
                        <div
                          className={cn(
                            "text-right font-medium",
                            transaction.type === "income"
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400",
                          )}
                        >
                          {transaction.type === "income" ? "+" : "-"}
                          {formatCurrency(transaction.amount)}
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="text-xs">
                            {transaction.category}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full"
                          onClick={() => onEdit(transaction.id)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full text-red-500"
                          onClick={() => onDelete(transaction.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">No transactions found. Try adjusting your filters.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
