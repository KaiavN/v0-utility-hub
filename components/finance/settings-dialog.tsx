"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { InfoIcon } from "lucide-react"

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  isCompactMode: boolean
  setIsCompactMode: (isCompactMode: boolean) => void
  currency: string
  setCurrency: (currency: string) => void
  dateFormat: string
  setDateFormat: (dateFormat: string) => void
  chartStyle: string
  setChartStyle: (chartStyle: string) => void
  chartAnimations: boolean
  setChartAnimations: (chartAnimations: boolean) => void
  accounts: any[] // Add proper type
  updateAccounts: (accounts: any[]) => void // Add proper type
}

// Exchange rates relative to USD (as of a recent date)
// In a real app, you would fetch these from an API
const exchangeRates = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 149.5,
  CAD: 1.36,
  AUD: 1.52,
  CHF: 0.89,
  CNY: 7.24,
  INR: 83.12,
  BRL: 5.05,
}

export function SettingsDialog({
  open,
  onOpenChange,
  isCompactMode,
  setIsCompactMode,
  currency,
  setCurrency,
  dateFormat,
  setDateFormat,
  chartStyle,
  setChartStyle,
  chartAnimations,
  setChartAnimations,
  accounts,
  updateAccounts,
}: SettingsDialogProps) {
  const [activeTab, setActiveTab] = useState("preferences")
  const [showCurrencyAlert, setShowCurrencyAlert] = useState(false)
  const [previousCurrency, setPreviousCurrency] = useState(currency)

  const currencies = [
    { name: "US Dollar ($)", value: "USD" },
    { name: "Euro (€)", value: "EUR" },
    { name: "British Pound (£)", value: "GBP" },
    { name: "Japanese Yen (¥)", value: "JPY" },
    { name: "Canadian Dollar (C$)", value: "CAD" },
    { name: "Australian Dollar (A$)", value: "AUD" },
    { name: "Swiss Franc (CHF)", value: "CHF" },
    { name: "Chinese Yuan (¥)", value: "CNY" },
    { name: "Indian Rupee (₹)", value: "INR" },
    { name: "Brazilian Real (R$)", value: "BRL" },
  ]

  const dateFormats = [
    { name: "MM/DD/YYYY", value: "MM/DD/YYYY" },
    { name: "DD/MM/YYYY", value: "DD/MM/YYYY" },
    { name: "YYYY-MM-DD", value: "YYYY-MM-DD" },
    { name: "YYYY/MM/DD", value: "YYYY/MM/DD" },
    { name: "DD.MM.YYYY", value: "DD.MM.YYYY" },
  ]

  const chartStyles = [
    { name: "Default", value: "default" },
    { name: "Monochrome", value: "monochrome" },
    { name: "Vibrant", value: "vibrant" },
    { name: "Pastel", value: "pastel" },
    { name: "Gradient", value: "gradient" },
  ]

  // Handle currency change
  const handleCurrencyChange = (newCurrency: string) => {
    if (newCurrency !== currency) {
      setPreviousCurrency(currency)
      setCurrency(newCurrency)
      setShowCurrencyAlert(true)

      // Convert account balances to the new currency
      if (accounts && accounts.length > 0) {
        const updatedAccounts = accounts.map((account) => {
          // Convert from previous currency to USD (as base), then to new currency
          const valueInUSD = account.balance / exchangeRates[previousCurrency as keyof typeof exchangeRates]
          const newBalance = valueInUSD * exchangeRates[newCurrency as keyof typeof exchangeRates]

          return {
            ...account,
            balance: Number.parseFloat(newBalance.toFixed(2)),
            currency: newCurrency,
          }
        })

        updateAccounts(updatedAccounts)
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Finance Settings</DialogTitle>
          <DialogDescription>Customize your financial dashboard experience</DialogDescription>
        </DialogHeader>

        {showCurrencyAlert && (
          <Alert className="mb-4">
            <InfoIcon className="h-4 w-4" />
            <AlertTitle>Currency Updated</AlertTitle>
            <AlertDescription>
              Your account balances have been converted from {previousCurrency} to {currency} using current exchange
              rates.
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="visualization">Visualization</TabsTrigger>
          </TabsList>

          <TabsContent value="preferences" className="space-y-6 py-4">
            <div className="space-y-3">
              <Label className="text-base">Currency</Label>
              <Select value={currency} onValueChange={handleCurrencyChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((curr) => (
                    <SelectItem key={curr.value} value={curr.value}>
                      {curr.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="text-sm text-muted-foreground">
                Choose your preferred currency for displaying monetary values
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-base">Date Format</Label>
              <Select value={dateFormat} onValueChange={setDateFormat}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select date format" />
                </SelectTrigger>
                <SelectContent>
                  {dateFormats.map((format) => (
                    <SelectItem key={format.value} value={format.value}>
                      {format.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="text-sm text-muted-foreground">
                Choose how dates are displayed throughout the application
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-base">Default View</Label>
              <RadioGroup defaultValue="dashboard">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="dashboard" id="dashboard" />
                  <Label htmlFor="dashboard">Dashboard</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="accounts" id="accounts" />
                  <Label htmlFor="accounts">Accounts</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="budgets" id="budgets" />
                  <Label htmlFor="budgets">Budgets & Goals</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="transactions" id="transactions" />
                  <Label htmlFor="transactions">Transactions</Label>
                </div>
              </RadioGroup>
              <div className="text-sm text-muted-foreground">
                Choose which view to show when you first open the application
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Compact Mode</Label>
                <div className="text-sm text-muted-foreground">Reduce spacing between elements</div>
              </div>
              <Switch checked={isCompactMode} onCheckedChange={setIsCompactMode} />
            </div>
          </TabsContent>

          <TabsContent value="visualization" className="space-y-6 py-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Chart Animations</Label>
                <div className="text-sm text-muted-foreground">Enable or disable chart animations</div>
              </div>
              <Switch checked={chartAnimations} onCheckedChange={setChartAnimations} />
            </div>

            <div className="space-y-3">
              <Label className="text-base">Chart Color Scheme</Label>
              <Select value={chartStyle} onValueChange={setChartStyle}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select color scheme" />
                </SelectTrigger>
                <SelectContent>
                  {chartStyles.map((style) => (
                    <SelectItem key={style.value} value={style.value}>
                      {style.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="text-sm text-muted-foreground">Choose the color scheme for charts and graphs</div>
            </div>

            <div className="space-y-3">
              <Label className="text-base">Data Visualization</Label>
              <RadioGroup defaultValue="auto">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="auto" id="auto" />
                  <Label htmlFor="auto">Automatic (based on data)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="bar" id="bar" />
                  <Label htmlFor="bar">Bar Charts</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="line" id="line" />
                  <Label htmlFor="line">Line Charts</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pie" id="pie" />
                  <Label htmlFor="pie">Pie Charts</Label>
                </div>
              </RadioGroup>
              <div className="text-sm text-muted-foreground">
                Choose your preferred chart type for data visualization
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6">
          <Button
            variant="outline"
            onClick={() => {
              setShowCurrencyAlert(false)
              onOpenChange(false)
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              setShowCurrencyAlert(false)
              onOpenChange(false)
            }}
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
