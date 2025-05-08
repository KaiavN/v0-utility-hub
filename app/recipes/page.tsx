"use client"

import { DialogTrigger } from "@/components/ui/dialog"

import type React from "react"

import { useState, useEffect } from "react"
import {
  Clock,
  PlusCircle,
  Search,
  Trash2,
  Utensils,
  Star,
  StarOff,
  Printer,
  Edit,
  MoreHorizontal,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { getLocalStorage, setLocalStorage } from "@/lib/local-storage"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Ingredient {
  id: string
  name: string
  amount: string
  unit: string
}

interface Step {
  id: string
  description: string
}

interface Recipe {
  id: string
  title: string
  description: string
  ingredients: Ingredient[]
  steps: Step[]
  prepTime: number
  cookTime: number
  servings: number
  category: string
  tags: string[]
  image?: string
  favorite: boolean
  createdAt: string
  lastMade?: string
  notes?: string
}

const defaultCategories = [
  "Breakfast",
  "Lunch",
  "Dinner",
  "Dessert",
  "Snack",
  "Appetizer",
  "Soup",
  "Salad",
  "Main Course",
  "Side Dish",
  "Beverage",
  "Other",
]

const defaultUnits = [
  "cup",
  "tablespoon",
  "teaspoon",
  "ounce",
  "pound",
  "gram",
  "kilogram",
  "milliliter",
  "liter",
  "pinch",
  "piece",
  "slice",
  "clove",
  "none",
]

export default function RecipesPage() {
  const { toast } = useToast()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [categories, setCategories] = useState<string[]>(defaultCategories)
  const [activeCategory, setActiveCategory] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddRecipeOpen, setIsAddRecipeOpen] = useState(false)
  const [isViewRecipeOpen, setIsViewRecipeOpen] = useState(false)
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "a-z" | "z-a" | "favorite">("newest")
  const [newRecipe, setNewRecipe] = useState<Omit<Recipe, "id" | "createdAt">>({
    title: "",
    description: "",
    ingredients: [{ id: "1", name: "", amount: "", unit: "" }],
    steps: [{ id: "1", description: "" }],
    prepTime: 0,
    cookTime: 0,
    servings: 2,
    category: "Other",
    tags: [],
    favorite: false,
  })
  const [newTag, setNewTag] = useState("")
  const [isCustomCategory, setIsCustomCategory] = useState(false)
  const [customCategoryName, setCustomCategoryName] = useState("")
  const [isEditCustomCategory, setIsEditCustomCategory] = useState(false)
  const [editCustomCategoryName, setEditCustomCategoryName] = useState("")

  // Load data from local storage
  useEffect(() => {
    try {
      const savedRecipes = getLocalStorage<Recipe[]>("recipes", [])
      const savedCategories = getLocalStorage<string[]>("recipeCategories", defaultCategories)

      // Ensure recipes is always an array
      setRecipes(Array.isArray(savedRecipes) ? savedRecipes : [])
      setCategories(Array.isArray(savedCategories) ? savedCategories : [...defaultCategories])

      // Reset custom category states
      setIsCustomCategory(false)
      setCustomCategoryName("")
      setIsEditCustomCategory(false)
      setEditCustomCategoryName("")
    } catch (error) {
      console.error("Error loading recipe data:", error)
      // Fallback to empty arrays if there's an error
      setRecipes([])
      setCategories([...defaultCategories])
    }
  }, [])

  // Save recipes to local storage
  const saveRecipes = (updatedRecipes: Recipe[]) => {
    setRecipes(updatedRecipes)
    setLocalStorage("recipes", updatedRecipes)
  }

  // Save categories to local storage
  const saveCategories = (updatedCategories: string[]) => {
    setCategories(updatedCategories)
    setLocalStorage("recipeCategories", updatedCategories)
  }

  // Add a new recipe
  const addRecipe = () => {
    if (!newRecipe.title) {
      toast({
        title: "Title required",
        description: "Please provide a title for your recipe.",
        variant: "destructive",
      })
      return
    }

    if (newRecipe.ingredients.some((ing) => !ing.name)) {
      toast({
        title: "Invalid ingredients",
        description: "Please provide a name for all ingredients.",
        variant: "destructive",
      })
      return
    }

    if (newRecipe.steps.some((step) => !step.description)) {
      toast({
        title: "Invalid steps",
        description: "Please provide a description for all steps.",
        variant: "destructive",
      })
      return
    }

    const recipe: Recipe = {
      ...newRecipe,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    }

    const updatedRecipes = [recipe, ...recipes]
    saveRecipes(updatedRecipes)

    // Add new category if it doesn't exist
    if (isCustomCategory && customCategoryName && !categories.includes(customCategoryName)) {
      const updatedCategories = [...categories, customCategoryName]
      saveCategories(updatedCategories)
    } else if (!categories.includes(recipe.category) && recipe.category !== "All") {
      const updatedCategories = [...categories, recipe.category]
      saveCategories(updatedCategories)
    }

    setNewRecipe({
      title: "",
      description: "",
      ingredients: [{ id: "1", name: "", amount: "", unit: "" }],
      steps: [{ id: "1", description: "" }],
      prepTime: 0,
      cookTime: 0,
      servings: 2,
      category: "Other",
      tags: [],
      favorite: false,
    })
    setIsCustomCategory(false)
    setCustomCategoryName("")
    setIsAddRecipeOpen(false)

    toast({
      title: "Recipe added",
      description: "Your recipe has been saved.",
    })
  }

  // Update an existing recipe
  const updateRecipe = () => {
    if (!selectedRecipe) return

    const updatedRecipes = recipes.map((recipe) => (recipe.id === selectedRecipe.id ? selectedRecipe : recipe))

    saveRecipes(updatedRecipes)

    // Add new category if it doesn't exist
    if (isEditCustomCategory && editCustomCategoryName && !categories.includes(editCustomCategoryName)) {
      const updatedCategories = [...categories, editCustomCategoryName]
      saveCategories(updatedCategories)
    } else if (!categories.includes(selectedRecipe.category) && selectedRecipe.category !== "All") {
      const updatedCategories = [...categories, selectedRecipe.category]
      saveCategories(updatedCategories)
    }

    setIsEditMode(false)
    setIsEditCustomCategory(false)
    setEditCustomCategoryName("")

    toast({
      title: "Recipe updated",
      description: "Your recipe has been updated.",
    })
  }

  // Delete a recipe
  const deleteRecipe = (id: string) => {
    const updatedRecipes = recipes.filter((recipe) => recipe.id !== id)
    saveRecipes(updatedRecipes)

    if (selectedRecipe?.id === id) {
      setSelectedRecipe(null)
      setIsViewRecipeOpen(false)
    }

    toast({
      title: "Recipe deleted",
      description: "Your recipe has been deleted.",
    })
  }

  // Toggle favorite status
  const toggleFavorite = (id: string) => {
    const updatedRecipes = recipes.map((recipe) => {
      if (recipe.id === id) {
        return { ...recipe, favorite: !recipe.favorite }
      }
      return recipe
    })

    saveRecipes(updatedRecipes)

    // Update selected recipe if it's the one being toggled
    if (selectedRecipe?.id === id) {
      setSelectedRecipe({ ...selectedRecipe, favorite: !selectedRecipe.favorite })
    }
  }

  // Mark recipe as made today
  const markAsMade = (id: string) => {
    const updatedRecipes = recipes.map((recipe) => {
      if (recipe.id === id) {
        return { ...recipe, lastMade: new Date().toISOString() }
      }
      return recipe
    })

    saveRecipes(updatedRecipes)

    // Update selected recipe if it's the one being marked
    if (selectedRecipe?.id === id) {
      setSelectedRecipe({ ...selectedRecipe, lastMade: new Date().toISOString() })
    }

    toast({
      title: "Recipe marked as made",
      description: "This recipe has been marked as made today.",
    })
  }

  // Add ingredient to new recipe
  const addIngredient = () => {
    setNewRecipe({
      ...newRecipe,
      ingredients: [...newRecipe.ingredients, { id: Date.now().toString(), name: "", amount: "", unit: "" }],
    })
  }

  // Remove ingredient from new recipe
  const removeIngredient = (id: string) => {
    if (newRecipe.ingredients.length <= 1) return

    setNewRecipe({
      ...newRecipe,
      ingredients: newRecipe.ingredients.filter((ing) => ing.id !== id),
    })
  }

  // Update ingredient in new recipe
  const updateIngredient = (id: string, field: keyof Ingredient, value: string) => {
    setNewRecipe({
      ...newRecipe,
      ingredients: newRecipe.ingredients.map((ing) => (ing.id === id ? { ...ing, [field]: value } : ing)),
    })
  }

  // Add step to new recipe
  const addStep = () => {
    setNewRecipe({
      ...newRecipe,
      steps: [...newRecipe.steps, { id: Date.now().toString(), description: "" }],
    })
  }

  // Remove step from new recipe
  const removeStep = (id: string) => {
    if (newRecipe.steps.length <= 1) return

    setNewRecipe({
      ...newRecipe,
      steps: newRecipe.steps.filter((step) => step.id !== id),
    })
  }

  // Update step in new recipe
  const updateStep = (id: string, description: string) => {
    setNewRecipe({
      ...newRecipe,
      steps: newRecipe.steps.map((step) => (step.id === id ? { ...step, description } : step)),
    })
  }

  // Add tag to new recipe
  const addTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && newTag.trim()) {
      e.preventDefault()

      if (!newRecipe.tags.includes(newTag.trim())) {
        setNewRecipe({
          ...newRecipe,
          tags: [...newRecipe.tags, newTag.trim()],
        })
      }

      setNewTag("")
    }
  }

  // Remove tag from new recipe
  const removeTag = (tagToRemove: string) => {
    setNewRecipe({
      ...newRecipe,
      tags: newRecipe.tags.filter((tag) => tag !== tagToRemove),
    })
  }

  // Filter recipes based on category and search query
  const filteredRecipes = (recipes || []).filter((recipe) => {
    const matchesCategory = activeCategory === "All" || recipe.category === activeCategory
    const matchesSearch =
      recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
      recipe.ingredients.some((ing) => ing.name.toLowerCase().includes(searchQuery.toLowerCase()))

    return matchesCategory && matchesSearch
  })

  // Sort recipes
  const sortedRecipes = [...(filteredRecipes || [])].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case "oldest":
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      case "a-z":
        return a.title.localeCompare(b.title)
      case "z-a":
        return b.title.localeCompare(a.title)
      case "favorite":
        return (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0)
      default:
        return 0
    }
  })

  // Get all unique tags from recipes
  const allTags = Array.from(new Set((recipes || []).flatMap((recipe) => recipe.tags))).sort()

  // Calculate total time (prep + cook)
  const calculateTotalTime = (prepTime: number, cookTime: number) => {
    const total = prepTime + cookTime
    if (total < 60) {
      return `${total} min`
    }
    const hours = Math.floor(total / 60)
    const minutes = total % 60
    return `${hours}h ${minutes > 0 ? `${minutes}m` : ""}`
  }

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Never"

    const date = new Date(dateString)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return "Today"
    if (diffDays === 1) return "Yesterday"
    if (diffDays < 7) return `${diffDays} days ago`

    return date.toLocaleDateString()
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Recipe Manager</h1>
          <p className="text-muted-foreground">Store and organize your favorite recipes</p>
        </div>
        <Dialog
          open={isAddRecipeOpen}
          onOpenChange={(open) => {
            setIsAddRecipeOpen(open)
            if (!open) {
              setIsCustomCategory(false)
              setCustomCategoryName("")
            }
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Recipe
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Recipe</DialogTitle>
              <DialogDescription>Enter the details for your new recipe.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Recipe Title</Label>
                <Input
                  id="title"
                  value={newRecipe.title}
                  onChange={(e) => setNewRecipe({ ...newRecipe, title: e.target.value })}
                  placeholder="e.g., Chocolate Chip Cookies"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newRecipe.description}
                  onChange={(e) => setNewRecipe({ ...newRecipe, description: e.target.value })}
                  placeholder="A brief description of the recipe"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="prepTime">Prep Time (min)</Label>
                  <Input
                    id="prepTime"
                    type="number"
                    min="0"
                    value={newRecipe.prepTime}
                    onChange={(e) => setNewRecipe({ ...newRecipe, prepTime: Number.parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cookTime">Cook Time (min)</Label>
                  <Input
                    id="cookTime"
                    type="number"
                    min="0"
                    value={newRecipe.cookTime}
                    onChange={(e) => setNewRecipe({ ...newRecipe, cookTime: Number.parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="servings">Servings</Label>
                  <Input
                    id="servings"
                    type="number"
                    min="1"
                    value={newRecipe.servings}
                    onChange={(e) => setNewRecipe({ ...newRecipe, servings: Number.parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={newRecipe.category}
                  onValueChange={(value) => {
                    if (value === "custom") {
                      // Don't set category to "custom", just flag that we need a custom input
                      setIsCustomCategory(true)
                    } else {
                      setIsCustomCategory(false)
                      setNewRecipe({ ...newRecipe, category: value })
                    }
                  }}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">Add New Category...</SelectItem>
                  </SelectContent>
                </Select>
                {isCustomCategory && (
                  <Input
                    placeholder="Enter new category name"
                    value={customCategoryName}
                    onChange={(e) => {
                      setCustomCategoryName(e.target.value)
                      setNewRecipe({ ...newRecipe, category: e.target.value })
                    }}
                    className="mt-2"
                  />
                )}
              </div>

              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label>Ingredients</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addIngredient}>
                    Add Ingredient
                  </Button>
                </div>
                <div className="space-y-2">
                  {newRecipe.ingredients.map((ingredient, index) => (
                    <div key={ingredient.id} className="flex items-center gap-2">
                      <Input
                        placeholder="Ingredient name"
                        value={ingredient.name}
                        onChange={(e) => updateIngredient(ingredient.id, "name", e.target.value)}
                        className="flex-grow"
                      />
                      <Input
                        placeholder="Amount"
                        value={ingredient.amount}
                        onChange={(e) => updateIngredient(ingredient.id, "amount", e.target.value)}
                        className="w-20"
                      />
                      <Select
                        value={ingredient.unit}
                        onValueChange={(value) => updateIngredient(ingredient.id, "unit", value)}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue placeholder="Unit" />
                        </SelectTrigger>
                        <SelectContent>
                          {defaultUnits.map((unit) => (
                            <SelectItem key={unit} value={unit}>
                              {unit}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeIngredient(ingredient.id)}
                        disabled={newRecipe.ingredients.length <= 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label>Instructions</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addStep}>
                    Add Step
                  </Button>
                </div>
                <div className="space-y-2">
                  {newRecipe.steps.map((step, index) => (
                    <div key={step.id} className="flex items-start gap-2">
                      <div className="mt-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                        {index + 1}
                      </div>
                      <Textarea
                        placeholder={`Step ${index + 1}`}
                        value={step.description}
                        onChange={(e) => updateStep(step.id, e.target.value)}
                        className="flex-grow"
                        rows={2}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeStep(step.id)}
                        disabled={newRecipe.steps.length <= 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="tags">Tags (press Enter to add)</Label>
                <div className="flex flex-wrap gap-2">
                  {newRecipe.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 rounded-full p-0.5 hover:bg-muted"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span className="sr-only">Remove {tag}</span>
                      </button>
                    </Badge>
                  ))}
                </div>
                <Input
                  id="tags"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={addTag}
                  placeholder="Enter tags and press Enter"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  value={newRecipe.notes || ""}
                  onChange={(e) => setNewRecipe({ ...newRecipe, notes: e.target.value })}
                  placeholder="Any additional notes or tips"
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddRecipeOpen(false)}>
                Cancel
              </Button>
              <Button onClick={addRecipe}>Save Recipe</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-6">
        <div className="relative mb-4">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search recipes..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <Tabs
            defaultValue="All"
            value={activeCategory}
            onValueChange={setActiveCategory}
            className="w-full sm:w-auto"
          >
            <TabsList className="flex flex-wrap h-auto">
              <TabsTrigger value="All">All</TabsTrigger>
              {categories.map((category) => (
                <TabsTrigger key={category} value={category}>
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2">
            <Label htmlFor="sortBy" className="whitespace-nowrap">
              Sort by:
            </Label>
            <Select
              value={sortBy}
              onValueChange={(value: "newest" | "oldest" | "a-z" | "z-a" | "favorite") => setSortBy(value)}
            >
              <SelectTrigger id="sortBy" className="w-[140px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
                <SelectItem value="a-z">A-Z</SelectItem>
                <SelectItem value="z-a">Z-A</SelectItem>
                <SelectItem value="favorite">Favorites</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Recipe Grid */}
      {sortedRecipes.length === 0 ? (
        <div className="flex h-60 items-center justify-center rounded-lg border border-dashed">
          <div className="text-center">
            <Utensils className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No recipes found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {searchQuery || activeCategory !== "All"
                ? "Try a different search or category"
                : "Add your first recipe to get started"}
            </p>
            {!searchQuery && activeCategory === "All" && (
              <Button className="mt-4" onClick={() => setIsAddRecipeOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Recipe
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sortedRecipes.map((recipe) => (
            <Card key={recipe.id} className="overflow-hidden flex flex-col h-full">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="line-clamp-1 mr-8">{recipe.title}</CardTitle>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-yellow-500"
                      onClick={() => toggleFavorite(recipe.id)}
                    >
                      {recipe.favorite ? (
                        <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                      ) : (
                        <StarOff className="h-5 w-5" />
                      )}
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedRecipe(recipe)
                            setIsViewRecipeOpen(true)
                            setIsEditMode(false)
                          }}
                        >
                          <Utensils className="mr-2 h-4 w-4" />
                          View Recipe
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedRecipe(recipe)
                            setIsViewRecipeOpen(true)
                            setIsEditMode(true)
                          }}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Recipe
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => markAsMade(recipe.id)}>
                          <Check className="mr-2 h-4 w-4" />
                          Mark as Made
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => deleteRecipe(recipe.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Recipe
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <CardDescription className="line-clamp-2">{recipe.description}</CardDescription>
              </CardHeader>
              <CardContent className="pb-3 flex-grow">
                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {calculateTotalTime(recipe.prepTime, recipe.cookTime)}
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Utensils className="h-3 w-3" />
                    {recipe.servings} {recipe.servings === 1 ? "serving" : "servings"}
                  </Badge>
                  <Badge variant="secondary">{recipe.category}</Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Ingredients:</span>
                    <span>{recipe.ingredients.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last made:</span>
                    <span>{formatDate(recipe.lastMade)}</span>
                  </div>
                </div>
                {recipe.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {recipe.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {recipe.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{recipe.tags.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
              <CardFooter className="pt-0 mt-auto">
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => {
                    setSelectedRecipe(recipe)
                    setIsViewRecipeOpen(true)
                    setIsEditMode(false)
                  }}
                >
                  View Recipe
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* View/Edit Recipe Dialog */}
      <Dialog
        open={isViewRecipeOpen}
        onOpenChange={(open) => {
          setIsViewRecipeOpen(open)
          if (!open) {
            setIsEditCustomCategory(false)
            setEditCustomCategoryName("")
            setIsEditMode(false)
          }
        }}
      >
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          {selectedRecipe && (
            <>
              <DialogHeader>
                <div className="flex justify-between items-center">
                  <DialogTitle className="text-2xl">{isEditMode ? "Edit Recipe" : selectedRecipe.title}</DialogTitle>
                  <div className="flex gap-2">
                    {!isEditMode && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-yellow-500"
                          onClick={() => toggleFavorite(selectedRecipe.id)}
                        >
                          {selectedRecipe.favorite ? (
                            <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                          ) : (
                            <StarOff className="h-5 w-5" />
                          )}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsEditMode(true)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                {!isEditMode && <DialogDescription>{selectedRecipe.description}</DialogDescription>}
              </DialogHeader>

              {isEditMode ? (
                // Edit Mode
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-title">Recipe Title</Label>
                    <Input
                      id="edit-title"
                      value={selectedRecipe.title}
                      onChange={(e) => setSelectedRecipe({ ...selectedRecipe, title: e.target.value })}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="edit-description">Description</Label>
                    <Textarea
                      id="edit-description"
                      value={selectedRecipe.description}
                      onChange={(e) => setSelectedRecipe({ ...selectedRecipe, description: e.target.value })}
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="edit-prepTime">Prep Time (min)</Label>
                      <Input
                        id="edit-prepTime"
                        type="number"
                        min="0"
                        value={selectedRecipe.prepTime}
                        onChange={(e) =>
                          setSelectedRecipe({
                            ...selectedRecipe,
                            prepTime: Number.parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-cookTime">Cook Time (min)</Label>
                      <Input
                        id="edit-cookTime"
                        type="number"
                        min="0"
                        value={selectedRecipe.cookTime}
                        onChange={(e) =>
                          setSelectedRecipe({
                            ...selectedRecipe,
                            cookTime: Number.parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-servings">Servings</Label>
                      <Input
                        id="edit-servings"
                        type="number"
                        min="1"
                        value={selectedRecipe.servings}
                        onChange={(e) =>
                          setSelectedRecipe({
                            ...selectedRecipe,
                            servings: Number.parseInt(e.target.value) || 1,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="edit-category">Category</Label>
                    <Select
                      value={selectedRecipe.category}
                      onValueChange={(value) => {
                        if (value === "custom") {
                          setIsEditCustomCategory(true)
                        } else {
                          setIsEditCustomCategory(false)
                          setSelectedRecipe({ ...selectedRecipe, category: value })
                        }
                      }}
                    >
                      <SelectTrigger id="edit-category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                        <SelectItem value="custom">Add New Category...</SelectItem>
                      </SelectContent>
                    </Select>
                    {isEditCustomCategory && (
                      <Input
                        placeholder="Enter new category name"
                        value={editCustomCategoryName}
                        onChange={(e) => {
                          setEditCustomCategoryName(e.target.value)
                          setSelectedRecipe({ ...selectedRecipe, category: e.target.value })
                        }}
                        className="mt-2"
                      />
                    )}
                  </div>

                  <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <Label>Ingredients</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedRecipe({
                            ...selectedRecipe,
                            ingredients: [
                              ...selectedRecipe.ingredients,
                              { id: Date.now().toString(), name: "", amount: "", unit: "" },
                            ],
                          })
                        }}
                      >
                        Add Ingredient
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {selectedRecipe.ingredients.map((ingredient, index) => (
                        <div key={ingredient.id} className="flex items-center gap-2">
                          <Input
                            placeholder="Ingredient name"
                            value={ingredient.name}
                            onChange={(e) => {
                              setSelectedRecipe({
                                ...selectedRecipe,
                                ingredients: selectedRecipe.ingredients.map((ing) =>
                                  ing.id === ingredient.id ? { ...ing, name: e.target.value } : ing,
                                ),
                              })
                            }}
                            className="flex-grow"
                          />
                          <Input
                            placeholder="Amount"
                            value={ingredient.amount}
                            onChange={(e) => {
                              setSelectedRecipe({
                                ...selectedRecipe,
                                ingredients: selectedRecipe.ingredients.map((ing) =>
                                  ing.id === ingredient.id ? { ...ing, amount: e.target.value } : ing,
                                ),
                              })
                            }}
                            className="w-20"
                          />
                          <Select
                            value={ingredient.unit}
                            onValueChange={(value) => {
                              setSelectedRecipe({
                                ...selectedRecipe,
                                ingredients: selectedRecipe.ingredients.map((ing) =>
                                  ing.id === ingredient.id ? { ...ing, unit: value } : ing,
                                ),
                              })
                            }}
                          >
                            <SelectTrigger className="w-24">
                              <SelectValue placeholder="Unit" />
                            </SelectTrigger>
                            <SelectContent>
                              {defaultUnits.map((unit) => (
                                <SelectItem key={unit} value={unit}>
                                  {unit}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (selectedRecipe.ingredients.length <= 1) return
                              setSelectedRecipe({
                                ...selectedRecipe,
                                ingredients: selectedRecipe.ingredients.filter((ing) => ing.id !== ingredient.id),
                              })
                            }}
                            disabled={selectedRecipe.ingredients.length <= 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <Label>Instructions</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedRecipe({
                            ...selectedRecipe,
                            steps: [...selectedRecipe.steps, { id: Date.now().toString(), description: "" }],
                          })
                        }}
                      >
                        Add Step
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {selectedRecipe.steps.map((step, index) => (
                        <div key={step.id} className="flex items-start gap-2">
                          <div className="mt-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                            {index + 1}
                          </div>
                          <Textarea
                            placeholder={`Step ${index + 1}`}
                            value={step.description}
                            onChange={(e) => {
                              setSelectedRecipe({
                                ...selectedRecipe,
                                steps: selectedRecipe.steps.map((s) =>
                                  s.id === step.id ? { ...s, description: e.target.value } : s,
                                ),
                              })
                            }}
                            className="flex-grow"
                            rows={2}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (selectedRecipe.steps.length <= 1) return
                              setSelectedRecipe({
                                ...selectedRecipe,
                                steps: selectedRecipe.steps.filter((s) => s.id !== step.id),
                              })
                            }}
                            disabled={selectedRecipe.steps.length <= 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label>Tags</Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {selectedRecipe.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                          {tag}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRecipe({
                                ...selectedRecipe,
                                tags: selectedRecipe.tags.filter((t) => t !== tag),
                              })
                            }}
                            className="ml-1 rounded-full p-0.5 hover:bg-muted"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a tag"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && newTag.trim()) {
                            e.preventDefault()
                            if (!selectedRecipe.tags.includes(newTag.trim())) {
                              setSelectedRecipe({
                                ...selectedRecipe,
                                tags: [...selectedRecipe.tags, newTag.trim()],
                              })
                            }
                            setNewTag("")
                          }
                        }}
                      />
                      <Button
                        type="button"
                        onClick={() => {
                          if (newTag.trim() && !selectedRecipe.tags.includes(newTag.trim())) {
                            setSelectedRecipe({
                              ...selectedRecipe,
                              tags: [...selectedRecipe.tags, newTag.trim()],
                            })
                            setNewTag("")
                          }
                        }}
                      >
                        Add
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="edit-notes">Notes (optional)</Label>
                    <Textarea
                      id="edit-notes"
                      value={selectedRecipe.notes || ""}
                      onChange={(e) => setSelectedRecipe({ ...selectedRecipe, notes: e.target.value })}
                      rows={3}
                    />
                  </div>
                </div>
              ) : (
                // View Mode
                <div className="space-y-6">
                  <div className="flex flex-wrap gap-3">
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Prep: {selectedRecipe.prepTime} min
                    </Badge>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Cook: {selectedRecipe.cookTime} min
                    </Badge>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Utensils className="h-3 w-3" />
                      {selectedRecipe.servings} {selectedRecipe.servings === 1 ? "serving" : "servings"}
                    </Badge>
                    <Badge variant="secondary">{selectedRecipe.category}</Badge>
                    {selectedRecipe.lastMade && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        Last made: {formatDate(selectedRecipe.lastMade)}
                      </Badge>
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2">Ingredients</h3>
                    <ul className="space-y-1 list-disc pl-5">
                      {selectedRecipe.ingredients.map((ingredient) => (
                        <li key={ingredient.id}>
                          {ingredient.amount && `${ingredient.amount} `}
                          {ingredient.unit && ingredient.unit !== "none" ? `${ingredient.unit} ` : ""}
                          {ingredient.name}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2">Instructions</h3>
                    <ol className="space-y-3 list-decimal pl-5">
                      {selectedRecipe.steps.map((step) => (
                        <li key={step.id}>{step.description}</li>
                      ))}
                    </ol>
                  </div>

                  {selectedRecipe.notes && (
                    <div>
                      <h3 className="text-lg font-medium mb-2">Notes</h3>
                      <p className="text-muted-foreground whitespace-pre-line">{selectedRecipe.notes}</p>
                    </div>
                  )}

                  {selectedRecipe.tags.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium mb-2">Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedRecipe.tags.map((tag) => (
                          <Badge key={tag} variant="outline">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between pt-4 border-t">
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => markAsMade(selectedRecipe.id)}>
                        <Check className="mr-2 h-4 w-4" />
                        Mark as Made
                      </Button>
                      <Button variant="outline" onClick={() => window.print()}>
                        <Printer className="mr-2 h-4 w-4" />
                        Print
                      </Button>
                    </div>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        deleteRecipe(selectedRecipe.id)
                        setIsViewRecipeOpen(false)
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              )}

              <DialogFooter>
                {isEditMode ? (
                  <>
                    <Button variant="outline" onClick={() => setIsEditMode(false)}>
                      Cancel
                    </Button>
                    <Button onClick={updateRecipe}>Save Changes</Button>
                  </>
                ) : (
                  <Button variant="outline" onClick={() => setIsViewRecipeOpen(false)}>
                    Close
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
