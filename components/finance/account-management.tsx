"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { PlusCircle, Trash2, CreditCard, Wallet, PiggyBank, DollarSign, Building, Briefcase } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { AccountCard } from "./account-card"
import { formatCurrency } from "@/lib/utils"

export interface Account {
  id: string
  name: string
  type: string
  balance: number
  currency: string
  icon: "credit-card" | "wallet" | "piggy-bank" | "dollar" | "building" | "briefcase"
  color?: string
  includeInTotal: boolean
  isAsset: boolean
}

interface AccountManagementProps {
  accounts: Account[]
  onAddAccount: (account: Omit<Account, "id">) => void
  onUpdateAccount: (id: string, account: Omit<Account, "id">) => void
  onDeleteAccount: (id: string) => void
  className?: string
}

export function AccountManagement({
  accounts,
  onAddAccount,
  onUpdateAccount,
  onDeleteAccount,
  className,
}: AccountManagementProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null)
  const [newAccount, setNewAccount] = useState<Omit<Account, "id">>({
    name: "",
    type: "Checking",
    balance: 0,
    currency: "USD",
    icon: "wallet",
    includeInTotal: true,
    isAsset: true,
  })

  const accountTypes = [
    { value: "Checking", label: "Checking Account", icon: <Wallet className="h-4 w-4 mr-2" /> },
    { value: "Savings", label: "Savings Account", icon: <PiggyBank className="h-4 w-4 mr-2" /> },
    { value: "Credit Card", label: "Credit Card", icon: <CreditCard className="h-4 w-4 mr-2" /> },
    { value: "Investment", label: "Investment Account", icon: <DollarSign className="h-4 w-4 mr-2" /> },
    { value: "Loan", label: "Loan", icon: <Building className="h-4 w-4 mr-2" /> },
    { value: "Business", label: "Business Account", icon: <Briefcase className="h-4 w-4 mr-2" /> },
  ]

  const iconOptions = [
    { value: "wallet", label: "Wallet", icon: <Wallet className="h-4 w-4" /> },
    { value: "piggy-bank", label: "Piggy Bank", icon: <PiggyBank className="h-4 w-4" /> },
    { value: "credit-card", label: "Credit Card", icon: <CreditCard className="h-4 w-4" /> },
    { value: "dollar", label: "Dollar", icon: <DollarSign className="h-4 w-4" /> },
    { value: "building", label: "Building", icon: <Building className="h-4 w-4" /> },
    { value: "briefcase", label: "Briefcase", icon: <Briefcase className="h-4 w-4" /> },
  ]

  const handleOpenDialog = (accountId?: string) => {
    if (accountId) {
      const account = accounts.find((a) => a.id === accountId)
      if (account) {
        setNewAccount({
          name: account.name,
          type: account.type,
          balance: account.balance,
          currency: account.currency,
          icon: account.icon,
          color: account.color,
          includeInTotal: account.includeInTotal,
          isAsset: account.isAsset,
        })
        setEditingAccountId(accountId)
      }
    } else {
      setNewAccount({
        name: "",
        type: "Checking",
        balance: 0,
        currency: "USD",
        icon: "wallet",
        includeInTotal: true,
        isAsset: true,
      })
      setEditingAccountId(null)
    }
    setIsDialogOpen(true)
  }

  const handleSaveAccount = () => {
    if (!newAccount.name) {
      toast({
        title: "Missing information",
        description: "Please provide an account name.",
        variant: "destructive",
      })
      return
    }

    if (editingAccountId) {
      onUpdateAccount(editingAccountId, newAccount)
      toast({
        title: "Account updated",
        description: `Your account "${newAccount.name}" has been updated.`,
      })
    } else {
      onAddAccount(newAccount)
      toast({
        title: "Account added",
        description: `Your account "${newAccount.name}" has been added.`,
      })
    }

    setIsDialogOpen(false)
  }

  // Calculate totals
  const totalAssets = accounts
    .filter((account) => account.isAsset && account.includeInTotal)
    .reduce((sum, account) => sum + account.balance, 0)

  const totalLiabilities = accounts
    .filter((account) => !account.isAsset && account.includeInTotal)
    .reduce((sum, account) => sum + account.balance, 0)

  const netWorth = totalAssets - totalLiabilities

  // Group accounts by type
  const assetAccounts = accounts.filter((account) => account.isAsset)
  const liabilityAccounts = accounts.filter((account) => !account.isAsset)

  return (
    <>
      <Card className={cn("border-2 border-primary/20 shadow-lg", className)}>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Accounts</CardTitle>
          <Button size="sm" onClick={() => handleOpenDialog()}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Account
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="text-sm font-medium text-muted-foreground">Total Assets</div>
                <div className="text-2xl font-bold mt-1">{formatCurrency(totalAssets)}</div>
              </CardContent>
            </Card>
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="text-sm font-medium text-muted-foreground">Total Liabilities</div>
                <div className="text-2xl font-bold mt-1">{formatCurrency(totalLiabilities)}</div>
              </CardContent>
            </Card>
            <Card className={cn("bg-muted/50", netWorth < 0 ? "border-destructive" : "border-primary/20")}>
              <CardContent className="p-4">
                <div className="text-sm font-medium text-muted-foreground">Net Worth</div>
                <div className={cn("text-2xl font-bold mt-1", netWorth < 0 ? "text-destructive" : "")}>
                  {formatCurrency(netWorth)}
                </div>
              </CardContent>
            </Card>
          </div>

          {assetAccounts.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Assets</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence>
                  {assetAccounts.map((account) => (
                    <motion.div
                      key={account.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                    >
                      <AccountCard
                        accountName={account.name}
                        balance={account.balance}
                        accountType={account.type}
                        icon={account.icon}
                        className="h-full"
                        onClick={() => handleOpenDialog(account.id)}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {liabilityAccounts.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Liabilities</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence>
                  {liabilityAccounts.map((account) => (
                    <motion.div
                      key={account.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                    >
                      <AccountCard
                        accountName={account.name}
                        balance={account.balance}
                        accountType={account.type}
                        icon={account.icon}
                        className="h-full"
                        onClick={() => handleOpenDialog(account.id)}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {accounts.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No accounts yet.</p>
              <Button variant="outline" className="mt-4" onClick={() => handleOpenDialog()}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Your First Account
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingAccountId ? "Edit Account" : "Add New Account"}</DialogTitle>
            <DialogDescription>
              {editingAccountId ? "Update your account details." : "Create a new account to track your finances."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Account Name</Label>
                <Input
                  id="name"
                  value={newAccount.name}
                  onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                  placeholder="e.g., Chase Checking"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Account Type</Label>
                <Select
                  value={newAccount.type}
                  onValueChange={(value) => setNewAccount({ ...newAccount, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {accountTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center">
                          {type.icon}
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="balance">Current Balance</Label>
                <Input
                  id="balance"
                  type="number"
                  step="0.01"
                  value={newAccount.balance}
                  onChange={(e) => setNewAccount({ ...newAccount, balance: Number(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={newAccount.currency}
                  onValueChange={(value) => setNewAccount({ ...newAccount, currency: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                    <SelectItem value="JPY">JPY (¥)</SelectItem>
                    <SelectItem value="CAD">CAD (C$)</SelectItem>
                    <SelectItem value="AUD">AUD (A$)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="icon">Icon</Label>
                <Select
                  value={newAccount.icon}
                  onValueChange={(value) => setNewAccount({ ...newAccount, icon: value as Account["icon"] })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select icon" />
                  </SelectTrigger>
                  <SelectContent>
                    {iconOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center">
                          {option.icon}
                          <span className="ml-2">{option.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="isAsset">Account Classification</Label>
                <Select
                  value={newAccount.isAsset ? "asset" : "liability"}
                  onValueChange={(value) => setNewAccount({ ...newAccount, isAsset: value === "asset" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asset">Asset (positive value)</SelectItem>
                    <SelectItem value="liability">Liability (debt)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="includeInTotal"
                  checked={newAccount.includeInTotal}
                  onChange={(e) => setNewAccount({ ...newAccount, includeInTotal: e.target.checked })}
                  className="form-checkbox h-4 w-4 text-primary rounded border-gray-300 focus:ring-primary"
                />
                <Label htmlFor="includeInTotal">Include in net worth calculations</Label>
              </div>
            </div>
          </div>
          <DialogFooter className="flex justify-between">
            {editingAccountId && (
              <Button
                variant="destructive"
                onClick={() => {
                  onDeleteAccount(editingAccountId)
                  setIsDialogOpen(false)
                  toast({
                    title: "Account deleted",
                    description: `Your account "${newAccount.name}" has been deleted.`,
                  })
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Account
              </Button>
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveAccount}>{editingAccountId ? "Update" : "Add Account"}</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
