"\"use client"

export interface Transaction {
  id: string
  date: string
  description: string
  amount: number
  type: "income" | "expense"
  category: string
}

export interface Budget {
  id: string
  category: string
  amount: number
}
