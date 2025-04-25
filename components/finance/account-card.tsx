"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { CreditCard, TrendingUp, TrendingDown, DollarSign, Wallet, PiggyBank, AlertCircle } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface AccountCardProps {
  accountName: string
  balance: number
  accountType: string
  previousBalance?: number
  className?: string
  icon?: "credit-card" | "wallet" | "piggy-bank" | "dollar"
  onClick?: () => void
}

export function AccountCard({
  accountName,
  balance,
  accountType,
  previousBalance,
  className,
  icon = "wallet",
  onClick,
}: AccountCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const percentChange = previousBalance ? ((balance - previousBalance) / Math.abs(previousBalance)) * 100 : 0

  const isPositive = balance >= 0
  const hasIncreased = previousBalance ? balance > previousBalance : false

  const getIcon = () => {
    switch (icon) {
      case "credit-card":
        return <CreditCard className="h-5 w-5" />
      case "piggy-bank":
        return <PiggyBank className="h-5 w-5" />
      case "dollar":
        return <DollarSign className="h-5 w-5" />
      case "wallet":
      default:
        return <Wallet className="h-5 w-5" />
    }
  }

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ type: "spring", stiffness: 300 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Card
        className={cn(
          "border-2 overflow-hidden transition-all duration-300",
          isPositive ? "border-primary/20" : "border-destructive/20",
          isHovered && "shadow-lg border-primary/40",
          className,
        )}
        onClick={onClick}
      >
        <CardHeader className="flex flex-row items-center justify-between pb-2 relative">
          <div className="flex items-center gap-2">
            <div className={cn("p-1.5 rounded-full", isPositive ? "bg-primary/10" : "bg-destructive/10")}>
              {getIcon()}
            </div>
            <CardTitle className="text-sm font-medium">{accountName}</CardTitle>
          </div>

          {previousBalance && (
            <div
              className={cn("flex items-center text-xs font-medium", hasIncreased ? "text-green-500" : "text-red-500")}
            >
              {hasIncreased ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
              {Math.abs(percentChange).toFixed(1)}%
            </div>
          )}

          {isHovered && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent"
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 300, opacity: 1 }}
              transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, repeatType: "loop" }}
            />
          )}
        </CardHeader>
        <CardContent>
          <motion.div
            className="text-2xl font-bold"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {formatCurrency(balance)}
          </motion.div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{accountType} Account</p>
            {!isPositive && balance < 0 && (
              <div className="flex items-center text-destructive text-xs">
                <AlertCircle className="h-3 w-3 mr-1" />
                Negative Balance
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
