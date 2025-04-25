"use client"

import { Label } from "@/components/ui/label"

import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export interface Category {
  id: string
  name: string
  color: string
}

interface CategorySelectProps {
  categories: Category[]
  onCategoryChange: (category: string) => void
  selectedCategory: string
  onAddCategory: (category: Category) => void
}

export function CategorySelect({ categories, onCategoryChange, selectedCategory, onAddCategory }: CategorySelectProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [newCategoryColor, setNewCategoryColor] = useState("bg-blue-500")

  const handleCreateCategory = () => {
    if (!newCategoryName) {
      return
    }

    const newCategory: Category = {
      id: crypto.randomUUID(),
      name: newCategoryName,
      color: newCategoryColor,
    }

    onAddCategory(newCategory)
    setNewCategoryName("")
    setNewCategoryColor("bg-blue-500")
    setIsDialogOpen(false)
  }

  return (
    <>
      <Select value={selectedCategory} onValueChange={onCategoryChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select category" />
        </SelectTrigger>
        <SelectContent>
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.name}>
              {category.name}
            </SelectItem>
          ))}
          <SelectItem value="new">+ Add New Category</SelectItem>
        </SelectContent>
      </Select>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Category</DialogTitle>
            <DialogDescription>Create a new category to organize your transactions.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="categoryName">Category Name</Label>
              <Input
                id="categoryName"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Enter category name"
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {[
                  "bg-blue-500",
                  "bg-green-500",
                  "bg-red-500",
                  "bg-purple-500",
                  "bg-yellow-500",
                  "bg-pink-500",
                  "bg-indigo-500",
                  "bg-gray-500",
                ].map((color) => (
                  <div
                    key={color}
                    className={`h-8 w-8 cursor-pointer rounded-full ${color} ${
                      newCategoryColor === color ? "ring-2 ring-primary ring-offset-2" : ""
                    }`}
                    onClick={() => setNewCategoryColor(color)}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCategory}>Create Category</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
