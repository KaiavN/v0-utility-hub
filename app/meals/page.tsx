"use client"

import { useState, useEffect } from "react"
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit2,
  ListChecks,
  Pizza,
  Plus,
  Search,
  Trash2,
  UtensilsCrossed,
  Import,
  BookOpen,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { getLocalStorage, setLocalStorage } from "@/lib/local-storage"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"

// Types
interface Recipe {
  id: string
  name: string
  description: string
  ingredients: string[]
  instructions: string[]
  prepTime: number
  cookTime: number
  servings: number
  tags: string[]
  imageUrl?: string
  createdAt: string
}

interface MealPlan {
  id: string
  date: string
  breakfast?: string // Recipe ID
  lunch?: string // Recipe ID
  dinner?: string // Recipe ID
  snacks?: string[] // Recipe IDs
}

interface ShoppingListItem {
  id: string
  name: string
  completed: boolean
  category: string
}

interface MealPlannerData {
  recipes: Recipe[]
  mealPlans: MealPlan[]
  shoppingList: ShoppingListItem[]
  recipeTags: string[]
  groceryCategories: string[]
}

// Recipe Manager Recipe Type
interface RecipeManagerIngredient {
  id: string
  name: string
  amount: string
  unit: string
}

interface RecipeManagerStep {
  id: string
  description: string
}

interface RecipeManagerRecipe {
  id: string
  title: string
  description: string
  ingredients: RecipeManagerIngredient[]
  steps: RecipeManagerStep[]
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

// Initial data
const initialMealPlannerData: MealPlannerData = {
  recipes: [],
  mealPlans: [],
  shoppingList: [],
  recipeTags: [
    "Quick & Easy",
    "Vegetarian",
    "Vegan",
    "Gluten-Free",
    "Low-Carb",
    "Breakfast",
    "Lunch",
    "Dinner",
    "Dessert",
    "Snack",
    "Healthy",
    "Comfort Food",
    "Italian",
    "Asian",
    "Mexican",
    "Mediterranean",
  ],
  groceryCategories: [
    "Produce",
    "Meat & Seafood",
    "Dairy",
    "Bakery",
    "Pantry",
    "Frozen",
    "Beverages",
    "Snacks",
    "Condiments",
    "Spices",
    "Canned Goods",
    "Baking",
    "Other",
  ],
}

// Helper function to get the week dates
const getWeekDates = (date: Date): Date[] => {
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1) // Adjust for Sunday
  const monday = new Date(date.setDate(diff))

  const weekDates = []
  for (let i = 0; i < 7; i++) {
    const nextDay = new Date(monday)
    nextDay.setDate(monday.getDate() + i)
    weekDates.push(nextDay)
  }

  return weekDates
}

// Format time (minutes to hours and minutes)
const formatTime = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} min`
  }

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  if (remainingMinutes === 0) {
    return `${hours} hr`
  }

  return `${hours} hr ${remainingMinutes} min`
}

export default function MealsPage() {
  const { toast } = useToast()
  const [mealPlannerData, setMealPlannerData] = useState<MealPlannerData>(initialMealPlannerData)
  const [activeTab, setActiveTab] = useState("recipes")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  // Recipe dialog
  const [recipeDialogOpen, setRecipeDialogOpen] = useState(false)
  const [newRecipe, setNewRecipe] = useState<Omit<Recipe, "id" | "createdAt">>({
    name: "",
    description: "",
    ingredients: [""],
    instructions: [""],
    prepTime: 0,
    cookTime: 0,
    servings: 2,
    tags: [],
  })
  const [editingRecipeId, setEditingRecipeId] = useState<string | null>(null)

  // Shopping list dialog
  const [shoppingItemDialogOpen, setShoppingItemDialogOpen] = useState(false)
  const [newShoppingItem, setNewShoppingItem] = useState<Omit<ShoppingListItem, "id">>({
    name: "",
    completed: false,
    category: "Other",
  })

  // Meal planning
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(new Date())
  const weekDates = getWeekDates(new Date(currentWeekStart))
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())
  const [mealPlanDialogOpen, setMealPlanDialogOpen] = useState(false)
  const [selectedMealType, setSelectedMealType] = useState<"breakfast" | "lunch" | "dinner" | "snacks">("dinner")

  // Recipe Import
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [recipeManagerRecipes, setRecipeManagerRecipes] = useState<RecipeManagerRecipe[]>([])
  const [selectedRecipesToImport, setSelectedRecipesToImport] = useState<string[]>([])
  const [importSearchQuery, setImportSearchQuery] = useState("")
  const [importCategoryFilter, setImportCategoryFilter] = useState<string>("All")

  // Load data from local storage
  useEffect(() => {
    const savedData = getLocalStorage<MealPlannerData>("mealPlannerData", initialMealPlannerData)
    setMealPlannerData(savedData)

    // Load recipe manager recipes
    const recipeManagerData = getLocalStorage<RecipeManagerRecipe[]>("recipes", [])
    setRecipeManagerRecipes(recipeManagerData)
  }, [])

  // Save data to local storage
  const saveMealPlannerData = (data: MealPlannerData) => {
    setMealPlannerData(data)
    setLocalStorage("mealPlannerData", data)
  }

  // Recipe management
  const addOrUpdateRecipe = () => {
    if (!newRecipe.name || newRecipe.ingredients.some((i) => !i) || newRecipe.instructions.some((i) => !i)) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields for the recipe.",
        variant: "destructive",
      })
      return
    }

    // Filter out empty ingredients and instructions
    const ingredients = newRecipe.ingredients.filter((i) => i.trim())
    const instructions = newRecipe.instructions.filter((i) => i.trim())

    if (ingredients.length === 0 || instructions.length === 0) {
      toast({
        title: "Missing information",
        description: "Please add at least one ingredient and one instruction.",
        variant: "destructive",
      })
      return
    }

    let updatedRecipes: Recipe[]

    if (editingRecipeId) {
      // Update existing recipe
      updatedRecipes = mealPlannerData.recipes.map((recipe) =>
        recipe.id === editingRecipeId
          ? {
              ...recipe,
              ...newRecipe,
              ingredients,
              instructions,
              updatedAt: new Date().toISOString(),
            }
          : recipe,
      )

      toast({
        title: "Recipe updated",
        description: "Your recipe has been updated successfully.",
      })
    } else {
      // Add new recipe
      const recipe: Recipe = {
        ...newRecipe,
        ingredients,
        instructions,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      }

      updatedRecipes = [...mealPlannerData.recipes, recipe]

      toast({
        title: "Recipe added",
        description: "Your recipe has been saved successfully.",
      })
    }

    const updatedData = {
      ...mealPlannerData,
      recipes: updatedRecipes,
    }

    saveMealPlannerData(updatedData)
    setRecipeDialogOpen(false)
    resetRecipeForm()
  }

  const deleteRecipe = (recipeId: string) => {
    // Check if recipe is used in meal plans
    const isUsedInMealPlan = mealPlannerData.mealPlans.some(
      (plan) =>
        plan.breakfast === recipeId ||
        plan.lunch === recipeId ||
        plan.dinner === recipeId ||
        (plan.snacks && plan.snacks.includes(recipeId)),
    )

    if (isUsedInMealPlan) {
      toast({
        title: "Cannot delete recipe",
        description: "This recipe is used in your meal plans. Remove it from meal plans first.",
        variant: "destructive",
      })
      return
    }

    const updatedData = {
      ...mealPlannerData,
      recipes: mealPlannerData.recipes.filter((recipe) => recipe.id !== recipeId),
    }

    saveMealPlannerData(updatedData)

    toast({
      title: "Recipe deleted",
      description: "Your recipe has been deleted.",
    })
  }

  const resetRecipeForm = () => {
    setNewRecipe({
      name: "",
      description: "",
      ingredients: [""],
      instructions: [""],
      prepTime: 0,
      cookTime: 0,
      servings: 2,
      tags: [],
    })
    setEditingRecipeId(null)
  }

  const editRecipe = (recipeId: string) => {
    const recipe = mealPlannerData.recipes.find((r) => r.id === recipeId)
    if (!recipe) return

    setNewRecipe({
      name: recipe.name,
      description: recipe.description,
      ingredients: [...recipe.ingredients],
      instructions: [...recipe.instructions],
      prepTime: recipe.prepTime,
      cookTime: recipe.cookTime,
      servings: recipe.servings,
      tags: [...recipe.tags],
      imageUrl: recipe.imageUrl,
    })

    setEditingRecipeId(recipeId)
    setRecipeDialogOpen(true)
  }

  // Shopping list management
  const addShoppingItem = () => {
    if (!newShoppingItem.name) {
      toast({
        title: "Item name required",
        description: "Please provide a name for the item.",
        variant: "destructive",
      })
      return
    }

    const item: ShoppingListItem = {
      ...newShoppingItem,
      id: Date.now().toString(),
    }

    const updatedData = {
      ...mealPlannerData,
      shoppingList: [...mealPlannerData.shoppingList, item],
    }

    saveMealPlannerData(updatedData)
    setShoppingItemDialogOpen(false)
    setNewShoppingItem({
      name: "",
      completed: false,
      category: "Other",
    })

    toast({
      title: "Item added",
      description: "Item has been added to your shopping list.",
    })
  }

  const toggleShoppingItemStatus = (itemId: string) => {
    const updatedData = {
      ...mealPlannerData,
      shoppingList: mealPlannerData.shoppingList.map((item) =>
        item.id === itemId ? { ...item, completed: !item.completed } : item,
      ),
    }

    saveMealPlannerData(updatedData)
  }

  const deleteShoppingItem = (itemId: string) => {
    const updatedData = {
      ...mealPlannerData,
      shoppingList: mealPlannerData.shoppingList.filter((item) => item.id !== itemId),
    }

    saveMealPlannerData(updatedData)

    toast({
      title: "Item removed",
      description: "Item has been removed from your shopping list.",
    })
  }

  const clearCompletedItems = () => {
    const updatedData = {
      ...mealPlannerData,
      shoppingList: mealPlannerData.shoppingList.filter((item) => !item.completed),
    }

    saveMealPlannerData(updatedData)

    toast({
      title: "Cleared completed items",
      description: "All completed items have been removed from your shopping list.",
    })
  }

  // Meal planning
  const goToPreviousWeek = () => {
    const prevWeek = new Date(currentWeekStart)
    prevWeek.setDate(prevWeek.getDate() - 7)
    setCurrentWeekStart(prevWeek)
  }

  const goToNextWeek = () => {
    const nextWeek = new Date(currentWeekStart)
    nextWeek.setDate(nextWeek.getDate() + 7)
    setCurrentWeekStart(nextWeek)
  }

  const formatDateKey = (date: Date): string => {
    return date.toISOString().split("T")[0]
  }

  const getMealPlanForDate = (date: Date): MealPlan | undefined => {
    const dateKey = formatDateKey(date)
    return mealPlannerData.mealPlans.find((plan) => plan.date === dateKey)
  }

  const getRecipeById = (recipeId?: string): Recipe | undefined => {
    if (!recipeId) return undefined
    return mealPlannerData.recipes.find((recipe) => recipe.id === recipeId)
  }

  const assignRecipeToDate = (recipeId: string, date: Date, mealType: "breakfast" | "lunch" | "dinner" | "snacks") => {
    if (!date) {
      toast({
        title: "Date required",
        description: "Please select a date for the meal plan.",
        variant: "destructive",
      })
      return
    }

    const dateKey = formatDateKey(date)
    const existingPlan = mealPlannerData.mealPlans.find((plan) => plan.date === dateKey)

    let updatedPlans: MealPlan[]

    if (existingPlan) {
      // Update existing plan
      updatedPlans = mealPlannerData.mealPlans.map((plan) => {
        if (plan.date === dateKey) {
          if (mealType === "snacks") {
            // For snacks, we allow multiple recipes
            const currentSnacks = plan.snacks || []
            if (!currentSnacks.includes(recipeId)) {
              return {
                ...plan,
                snacks: [...currentSnacks, recipeId],
              }
            }
            return plan
          } else {
            // For main meals, we replace the current recipe
            return {
              ...plan,
              [mealType]: recipeId,
            }
          }
        }
        return plan
      })
    } else {
      // Create a new plan
      const newPlan: MealPlan = {
        id: Date.now().toString(),
        date: dateKey,
        ...(mealType === "breakfast" && { breakfast: recipeId }),
        ...(mealType === "lunch" && { lunch: recipeId }),
        ...(mealType === "dinner" && { dinner: recipeId }),
        ...(mealType === "snacks" && { snacks: [recipeId] }),
      }

      updatedPlans = [...mealPlannerData.mealPlans, newPlan]
    }

    const updatedData = {
      ...mealPlannerData,
      mealPlans: updatedPlans,
    }

    saveMealPlannerData(updatedData)
    setMealPlanDialogOpen(false)

    toast({
      title: "Meal planned",
      description: `Recipe added to your meal plan for ${date.toLocaleDateString()}.`,
    })
  }

  const removeRecipeFromDate = (date: Date, mealType: "breakfast" | "lunch" | "dinner", recipeId?: string) => {
    const dateKey = formatDateKey(date)

    const updatedPlans = mealPlannerData.mealPlans.map((plan) => {
      if (plan.date === dateKey) {
        const updatedPlan = { ...plan }
        if (mealType === "breakfast") updatedPlan.breakfast = undefined
        if (mealType === "lunch") updatedPlan.lunch = undefined
        if (mealType === "dinner") updatedPlan.dinner = undefined
        return updatedPlan
      }
      return plan
    })

    const updatedData = {
      ...mealPlannerData,
      mealPlans: updatedPlans,
    }

    saveMealPlannerData(updatedData)

    toast({
      title: "Meal removed",
      description: `Recipe removed from your meal plan for ${date.toLocaleDateString()}.`,
    })
  }

  const removeSnackFromDate = (date: Date, recipeId: string) => {
    const dateKey = formatDateKey(date)

    const updatedPlans = mealPlannerData.mealPlans.map((plan) => {
      if (plan.date === dateKey && plan.snacks) {
        return {
          ...plan,
          snacks: plan.snacks.filter((id) => id !== recipeId),
        }
      }
      return plan
    })

    const updatedData = {
      ...mealPlannerData,
      mealPlans: updatedPlans,
    }

    saveMealPlannerData(updatedData)

    toast({
      title: "Snack removed",
      description: `Snack removed from your meal plan for ${date.toLocaleDateString()}.`,
    })
  }

  // Convert meal plans to shopping list
  const generateShoppingList = () => {
    // Get all unique recipe IDs from the meal plans
    const recipeIds = new Set<string>()

    mealPlannerData.mealPlans.forEach((plan) => {
      if (plan.breakfast) recipeIds.add(plan.breakfast)
      if (plan.lunch) recipeIds.add(plan.lunch)
      if (plan.dinner) recipeIds.add(plan.dinner)
      if (plan.snacks) plan.snacks.forEach((snackId) => recipeIds.add(snackId))
    })

    // Get all ingredients from these recipes
    const allIngredients: string[] = []

    Array.from(recipeIds).forEach((id) => {
      const recipe = mealPlannerData.recipes.find((r) => r.id === id)
      if (recipe) {
        allIngredients.push(...recipe.ingredients)
      }
    })

    // Create shopping list items from ingredients (avoiding duplicates)
    const ingredientSet = new Set(allIngredients)

    const shoppingItems: ShoppingListItem[] = []
    let id = Date.now()

    ingredientSet.forEach((ingredient) => {
      shoppingItems.push({
        id: (id++).toString(),
        name: ingredient,
        completed: false,
        category: "Other",
      })
    })

    const updatedData = {
      ...mealPlannerData,
      shoppingList: [...mealPlannerData.shoppingList, ...shoppingItems],
    }

    saveMealPlannerData(updatedData)

    toast({
      title: "Shopping list generated",
      description: `${shoppingItems.length} items added to your shopping list.`,
    })
  }

  // Filter recipes based on search query and tags
  const getFilteredRecipes = () => {
    return mealPlannerData.recipes.filter((recipe) => {
      // Match search query
      const matchesSearch =
        recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipe.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipe.ingredients.some((i) => i.toLowerCase().includes(searchQuery.toLowerCase()))

      // Match selected tags
      const matchesTags = selectedTags.length === 0 || selectedTags.every((tag) => recipe.tags.includes(tag))

      return matchesSearch && matchesTags
    })
  }

  // Import recipes from Recipe Manager
  const importRecipes = () => {
    if (selectedRecipesToImport.length === 0) {
      toast({
        title: "No recipes selected",
        description: "Please select at least one recipe to import.",
        variant: "destructive",
      })
      return
    }

    const recipesToImport = recipeManagerRecipes
      .filter((recipe) => selectedRecipesToImport.includes(recipe.id))
      .map((recipe) => {
        // Convert Recipe Manager recipe to Meal Planner recipe format
        const ingredients = recipe.ingredients.map((ing) => {
          const amount = ing.amount ? `${ing.amount} ` : ""
          const unit = ing.unit && ing.unit !== "none" ? `${ing.unit} ` : ""
          return `${amount}${unit}${ing.name}`
        })

        const instructions = recipe.steps.map((step) => step.description)

        return {
          id: `imported-${recipe.id}`,
          name: recipe.title,
          description: recipe.description,
          ingredients,
          instructions,
          prepTime: recipe.prepTime,
          cookTime: recipe.cookTime,
          servings: recipe.servings,
          tags: recipe.tags,
          createdAt: new Date().toISOString(),
        }
      })

    // Check for duplicates by name
    const existingRecipeNames = mealPlannerData.recipes.map((recipe) => recipe.name.toLowerCase())
    const newRecipes = recipesToImport.filter((recipe) => !existingRecipeNames.includes(recipe.name.toLowerCase()))
    const duplicateCount = recipesToImport.length - newRecipes.length

    const updatedData = {
      ...mealPlannerData,
      recipes: [...mealPlannerData.recipes, ...newRecipes],
    }

    saveMealPlannerData(updatedData)
    setImportDialogOpen(false)
    setSelectedRecipesToImport([])

    toast({
      title: "Recipes imported",
      description: `${newRecipes.length} recipes imported successfully${duplicateCount > 0 ? `. ${duplicateCount} duplicate(s) skipped.` : "."}`,
    })
  }

  // Get filtered recipes for import
  const getFilteredImportRecipes = () => {
    return recipeManagerRecipes.filter((recipe) => {
      const matchesSearch =
        recipe.title.toLowerCase().includes(importSearchQuery.toLowerCase()) ||
        recipe.description.toLowerCase().includes(importSearchQuery.toLowerCase())

      const matchesCategory = importCategoryFilter === "All" || recipe.category === importCategoryFilter

      return matchesSearch && matchesCategory
    })
  }

  // Get all unique categories from Recipe Manager recipes
  const getRecipeManagerCategories = () => {
    const categories = new Set<string>()
    recipeManagerRecipes.forEach((recipe) => {
      if (recipe.category) categories.add(recipe.category)
    })
    return Array.from(categories).sort()
  }

  // Toggle recipe selection for import
  const toggleRecipeSelection = (recipeId: string) => {
    if (selectedRecipesToImport.includes(recipeId)) {
      setSelectedRecipesToImport(selectedRecipesToImport.filter((id) => id !== recipeId))
    } else {
      setSelectedRecipesToImport([...selectedRecipesToImport, recipeId])
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Meal Planner</h1>
          <p className="text-muted-foreground">Plan your meals, save recipes, and generate shopping lists</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
            <Import className="mr-2 h-4 w-4" />
            Import Recipes
          </Button>
          <Button
            onClick={() => {
              resetRecipeForm()
              setRecipeDialogOpen(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Recipe
          </Button>
        </div>
      </div>

      <Tabs defaultValue="recipes" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="recipes">Recipes</TabsTrigger>
          <TabsTrigger value="mealplan">Meal Plan</TabsTrigger>
          <TabsTrigger value="shopping">Shopping List</TabsTrigger>
        </TabsList>

        {/* Recipes Tab */}
        <TabsContent value="recipes" className="space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative md:w-1/3">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search recipes..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {mealPlannerData.recipeTags.slice(0, 8).map((tag) => (
                <Badge
                  key={tag}
                  variant={selectedTags.includes(tag) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => {
                    if (selectedTags.includes(tag)) {
                      setSelectedTags(selectedTags.filter((t) => t !== tag))
                    } else {
                      setSelectedTags([...selectedTags, tag])
                    }
                  }}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {getFilteredRecipes().length === 0 ? (
              <div className="col-span-full flex h-40 items-center justify-center rounded-lg border border-dashed">
                <div className="flex flex-col items-center text-center">
                  <UtensilsCrossed className="mb-2 h-10 w-10 text-muted-foreground" />
                  <h3 className="text-lg font-medium">No recipes found</h3>
                  <p className="text-sm text-muted-foreground">Add your first recipe or try a different search</p>
                  <Button
                    className="mt-4"
                    onClick={() => {
                      resetRecipeForm()
                      setRecipeDialogOpen(true)
                    }}
                  >
                    Add Recipe
                  </Button>
                </div>
              </div>
            ) : (
              getFilteredRecipes().map((recipe) => (
                <Card key={recipe.id} className="overflow-hidden">
                  {recipe.imageUrl ? (
                    <div className="aspect-video w-full overflow-hidden">
                      <img
                        src={recipe.imageUrl || "/placeholder.svg"}
                        alt={recipe.name}
                        className="h-full w-full object-cover transition-all hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="flex aspect-video w-full items-center justify-center bg-muted">
                      <Pizza className="h-10 w-10 text-muted-foreground" />
                    </div>
                  )}
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <CardTitle className="line-clamp-1">{recipe.name}</CardTitle>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground"
                          onClick={() => editRecipe(recipe.id)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground"
                          onClick={() => deleteRecipe(recipe.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <CardDescription className="line-clamp-2">
                      {recipe.description || "No description available"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="mb-2 flex flex-wrap gap-1">
                      {recipe.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {recipe.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{recipe.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <div className="flex items-center">
                        <Clock className="mr-1 h-3 w-3" />
                        <span>Prep: {formatTime(recipe.prepTime)}</span>
                      </div>
                      <div className="flex items-center">
                        <UtensilsCrossed className="mr-1 h-3 w-3" />
                        <span>Cook: {formatTime(recipe.cookTime)}</span>
                      </div>
                      <div>Serves: {recipe.servings}</div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setSelectedDate(new Date())
                        setSelectedMealType("dinner")
                        setMealPlanDialogOpen(true)
                        // Pre-select the recipe we want to add to meal plan
                        // We'll use local state to track this between dialogs
                        localStorage.setItem("selectedRecipeId", recipe.id)
                      }}
                    >
                      <CalendarDays className="mr-2 h-4 w-4" />
                      Add to Meal Plan
                    </Button>
                  </CardFooter>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Meal Plan Tab */}
        <TabsContent value="mealplan" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Previous Week
              </Button>
              <Button variant="outline" size="sm" onClick={goToNextWeek}>
                Next Week
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            <Button onClick={generateShoppingList}>
              <ListChecks className="mr-2 h-4 w-4" />
              Generate Shopping List
            </Button>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[900px]">
              <div className="grid grid-cols-8 gap-2">
                <div className="p-2 text-center font-medium">Meal</div>
                {weekDates.map((date) => (
                  <div
                    key={date.toISOString()}
                    className={`rounded-t-lg p-2 text-center font-medium 
                      ${date.toDateString() === new Date().toDateString() ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                  >
                    {date.toLocaleDateString("en-US", { weekday: "short" })}
                    <br />
                    {date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </div>
                ))}
              </div>

              {/* Breakfast Row */}
              <div className="grid grid-cols-8 gap-2">
                <div className="flex items-center justify-center bg-muted p-2 text-center font-medium">Breakfast</div>
                {weekDates.map((date) => {
                  const mealPlan = getMealPlanForDate(date)
                  const recipe = getRecipeById(mealPlan?.breakfast)

                  return (
                    <div key={date.toISOString()} className="min-h-[100px] rounded-sm border p-2">
                      {recipe ? (
                        <div className="flex h-full flex-col">
                          <div className="font-medium">{recipe.name}</div>
                          <div className="mt-auto flex justify-between">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => removeRecipeFromDate(date, "breakfast")}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          className="h-full w-full justify-center"
                          onClick={() => {
                            setSelectedDate(date)
                            setSelectedMealType("breakfast")
                            setMealPlanDialogOpen(true)
                          }}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Lunch Row */}
              <div className="grid grid-cols-8 gap-2">
                <div className="flex items-center justify-center bg-muted p-2 text-center font-medium">Lunch</div>
                {weekDates.map((date) => {
                  const mealPlan = getMealPlanForDate(date)
                  const recipe = getRecipeById(mealPlan?.lunch)

                  return (
                    <div key={date.toISOString()} className="min-h-[100px] rounded-sm border p-2">
                      {recipe ? (
                        <div className="flex h-full flex-col">
                          <div className="font-medium">{recipe.name}</div>
                          <div className="mt-auto flex justify-between">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => removeRecipeFromDate(date, "lunch")}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          className="h-full w-full justify-center"
                          onClick={() => {
                            setSelectedDate(date)
                            setSelectedMealType("lunch")
                            setMealPlanDialogOpen(true)
                          }}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Dinner Row */}
              <div className="grid grid-cols-8 gap-2">
                <div className="flex items-center justify-center bg-muted p-2 text-center font-medium">Dinner</div>
                {weekDates.map((date) => {
                  const mealPlan = getMealPlanForDate(date)
                  const recipe = getRecipeById(mealPlan?.dinner)

                  return (
                    <div key={date.toISOString()} className="min-h-[100px] rounded-sm border p-2">
                      {recipe ? (
                        <div className="flex h-full flex-col">
                          <div className="font-medium">{recipe.name}</div>
                          <div className="mt-auto flex justify-between">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => removeRecipeFromDate(date, "dinner")}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          className="h-full w-full justify-center"
                          onClick={() => {
                            setSelectedDate(date)
                            setSelectedMealType("dinner")
                            setMealPlanDialogOpen(true)
                          }}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Snacks Row */}
              <div className="grid grid-cols-8 gap-2">
                <div className="flex items-center justify-center bg-muted p-2 text-center font-medium">Snacks</div>
                {weekDates.map((date) => {
                  const mealPlan = getMealPlanForDate(date)
                  const snackIds = mealPlan?.snacks || []

                  return (
                    <div key={date.toISOString()} className="min-h-[100px] rounded-sm border p-2">
                      {snackIds.length > 0 ? (
                        <div className="flex h-full flex-col">
                          {snackIds.map((id) => {
                            const recipe = getRecipeById(id)
                            if (!recipe) return null

                            return (
                              <div key={id} className="mb-1 flex items-center justify-between">
                                <span className="text-sm">{recipe.name}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => removeSnackFromDate(date, id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            )
                          })}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-auto justify-center"
                            onClick={() => {
                              setSelectedDate(date)
                              setSelectedMealType("snacks")
                              setMealPlanDialogOpen(true)
                            }}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          className="h-full w-full justify-center"
                          onClick={() => {
                            setSelectedDate(date)
                            setSelectedMealType("snacks")
                            setMealPlanDialogOpen(true)
                          }}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Shopping List Tab */}
        <TabsContent value="shopping" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Shopping List</h2>
            <div className="flex gap-2">
              <Dialog open={shoppingItemDialogOpen} onOpenChange={setShoppingItemDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Item
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Shopping Item</DialogTitle>
                    <DialogDescription>Add an item to your shopping list</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="itemName">Item Name</Label>
                      <Input
                        id="itemName"
                        value={newShoppingItem.name}
                        onChange={(e) =>
                          setNewShoppingItem({
                            ...newShoppingItem,
                            name: e.target.value,
                          })
                        }
                        placeholder="e.g., Milk, Eggs, Bread"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="itemCategory">Category</Label>
                      <Select
                        value={newShoppingItem.category}
                        onValueChange={(value) =>
                          setNewShoppingItem({
                            ...newShoppingItem,
                            category: value,
                          })
                        }
                      >
                        <SelectTrigger id="itemCategory">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {mealPlannerData.groceryCategories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShoppingItemDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={addShoppingItem}>Add Item</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {mealPlannerData.shoppingList.some((item) => item.completed) && (
                <Button variant="outline" onClick={clearCompletedItems}>
                  Clear Completed
                </Button>
              )}
            </div>
          </div>

          <Card>
            <CardContent className="p-6">
              {mealPlannerData.shoppingList.length === 0 ? (
                <div className="flex h-40 items-center justify-center">
                  <div className="flex flex-col items-center text-center">
                    <ListChecks className="mb-2 h-10 w-10 text-muted-foreground" />
                    <h3 className="text-lg font-medium">Your shopping list is empty</h3>
                    <p className="text-sm text-muted-foreground">Add items manually or generate from your meal plan</p>
                    <div className="mt-4 flex gap-2">
                      <Button onClick={() => setShoppingItemDialogOpen(true)}>Add Item</Button>
                      <Button variant="outline" onClick={generateShoppingList}>
                        Generate from Meal Plan
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  {/* Group by category */}
                  {mealPlannerData.groceryCategories.map((category) => {
                    const itemsInCategory = mealPlannerData.shoppingList.filter((item) => item.category === category)

                    if (itemsInCategory.length === 0) return null

                    return (
                      <div key={category} className="mb-6">
                        <h3 className="mb-2 font-medium">{category}</h3>
                        <div className="space-y-2">
                          {itemsInCategory.map((item) => (
                            <div key={item.id} className="flex items-center justify-between rounded-lg border p-2">
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  checked={item.completed}
                                  onCheckedChange={() => toggleShoppingItemStatus(item.id)}
                                  id={`item-${item.id}`}
                                />
                                <label
                                  htmlFor={`item-${item.id}`}
                                  className={item.completed ? "line-through text-muted-foreground" : ""}
                                >
                                  {item.name}
                                </label>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => deleteShoppingItem(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Recipe Dialog */}
      <Dialog open={recipeDialogOpen} onOpenChange={setRecipeDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>{editingRecipeId ? "Edit Recipe" : "Add New Recipe"}</DialogTitle>
            <DialogDescription>
              {editingRecipeId ? "Update your recipe details below." : "Enter the details for your new recipe."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid max-h-[60vh] gap-4 overflow-y-auto py-4">
            <div className="grid gap-2">
              <Label htmlFor="recipeName">Recipe Name</Label>
              <Input
                id="recipeName"
                value={newRecipe.name}
                onChange={(e) => setNewRecipe({ ...newRecipe, name: e.target.value })}
                placeholder="e.g., Spaghetti Carbonara"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="recipeDescription">Description</Label>
              <Textarea
                id="recipeDescription"
                value={newRecipe.description}
                onChange={(e) => setNewRecipe({ ...newRecipe, description: e.target.value })}
                placeholder="Briefly describe your recipe"
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
                  value={newRecipe.prepTime || ""}
                  onChange={(e) =>
                    setNewRecipe({
                      ...newRecipe,
                      prepTime: Number.parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cookTime">Cook Time (min)</Label>
                <Input
                  id="cookTime"
                  type="number"
                  min="0"
                  value={newRecipe.cookTime || ""}
                  onChange={(e) =>
                    setNewRecipe({
                      ...newRecipe,
                      cookTime: Number.parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="servings">Servings</Label>
                <Input
                  id="servings"
                  type="number"
                  min="1"
                  value={newRecipe.servings || ""}
                  onChange={(e) =>
                    setNewRecipe({
                      ...newRecipe,
                      servings: Number.parseInt(e.target.value) || 1,
                    })
                  }
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2">
                {mealPlannerData.recipeTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant={newRecipe.tags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => {
                      if (newRecipe.tags.includes(tag)) {
                        setNewRecipe({
                          ...newRecipe,
                          tags: newRecipe.tags.filter((t) => t !== tag),
                        })
                      } else {
                        setNewRecipe({
                          ...newRecipe,
                          tags: [...newRecipe.tags, tag],
                        })
                      }
                    }}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Ingredients</Label>
              {newRecipe.ingredients.map((ingredient, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={ingredient}
                    onChange={(e) => {
                      const updatedIngredients = [...newRecipe.ingredients]
                      updatedIngredients[index] = e.target.value
                      setNewRecipe({ ...newRecipe, ingredients: updatedIngredients })
                    }}
                    placeholder={`Ingredient ${index + 1}`}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    onClick={() => {
                      const updatedIngredients = [...newRecipe.ingredients]
                      updatedIngredients.splice(index, 1)
                      setNewRecipe({ ...newRecipe, ingredients: updatedIngredients })
                    }}
                    disabled={newRecipe.ingredients.length <= 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                className="mt-2"
                onClick={() => {
                  setNewRecipe({
                    ...newRecipe,
                    ingredients: [...newRecipe.ingredients, ""],
                  })
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Ingredient
              </Button>
            </div>
            <div className="grid gap-2">
              <Label>Instructions</Label>
              {newRecipe.instructions.map((instruction, index) => (
                <div key={index} className="flex gap-2">
                  <Textarea
                    value={instruction}
                    onChange={(e) => {
                      const updatedInstructions = [...newRecipe.instructions]
                      updatedInstructions[index] = e.target.value
                      setNewRecipe({ ...newRecipe, instructions: updatedInstructions })
                    }}
                    placeholder={`Step ${index + 1}`}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    onClick={() => {
                      const updatedInstructions = [...newRecipe.instructions]
                      updatedInstructions.splice(index, 1)
                      setNewRecipe({ ...newRecipe, instructions: updatedInstructions })
                    }}
                    disabled={newRecipe.instructions.length <= 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                className="mt-2"
                onClick={() => {
                  setNewRecipe({
                    ...newRecipe,
                    instructions: [...newRecipe.instructions, ""],
                  })
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Step
              </Button>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="imageUrl">Image URL (optional)</Label>
              <Input
                id="imageUrl"
                value={newRecipe.imageUrl || ""}
                onChange={(e) => setNewRecipe({ ...newRecipe, imageUrl: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRecipeDialogOpen(false)
                resetRecipeForm()
              }}
            >
              Cancel
            </Button>
            <Button onClick={addOrUpdateRecipe}>{editingRecipeId ? "Update Recipe" : "Add Recipe"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Meal Plan Dialog */}
      <Dialog open={mealPlanDialogOpen} onOpenChange={setMealPlanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to Meal Plan</DialogTitle>
            <DialogDescription>
              {selectedDate && `Select a recipe for ${selectedMealType} on ${selectedDate.toLocaleDateString()}`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-6">
              {mealPlannerData.recipes.map((recipe) => {
                // Check if this recipe is the one pre-selected from the recipe card
                const isPreselected = localStorage.getItem("selectedRecipeId") === recipe.id

                return (
                  <div
                    key={recipe.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50 ${
                      isPreselected ? "border-primary" : ""
                    }`}
                    onClick={() => {
                      if (selectedDate) {
                        assignRecipeToDate(recipe.id, selectedDate, selectedMealType)
                      }
                      // Clear the selected recipe ID
                      localStorage.removeItem("selectedRecipeId")
                    }}
                  >
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-muted`}>
                      <Pizza className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="font-medium">{recipe.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatTime(recipe.prepTime + recipe.cookTime)} • Serves {recipe.servings}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import Recipes Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Import Recipes from Recipe Manager</DialogTitle>
            <DialogDescription>Select recipes from your Recipe Manager to import into Meal Planner</DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-4 my-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search recipes..."
                className="pl-8"
                value={importSearchQuery}
                onChange={(e) => setImportSearchQuery(e.target.value)}
              />
            </div>

            <Select value={importCategoryFilter} onValueChange={setImportCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Categories</SelectItem>
                {getRecipeManagerCategories().map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="border rounded-md">
            <div className="flex items-center justify-between p-3 border-b">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="select-all"
                  checked={
                    selectedRecipesToImport.length > 0 &&
                    selectedRecipesToImport.length === getFilteredImportRecipes().length
                  }
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedRecipesToImport(getFilteredImportRecipes().map((r) => r.id))
                    } else {
                      setSelectedRecipesToImport([])
                    }
                  }}
                />
                <label htmlFor="select-all" className="text-sm font-medium">
                  Select All
                </label>
              </div>
              <div className="text-sm text-muted-foreground">
                {selectedRecipesToImport.length} of {getFilteredImportRecipes().length} selected
              </div>
            </div>

            <ScrollArea className="h-[400px]">
              {getFilteredImportRecipes().length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <BookOpen className="h-10 w-10 text-muted-foreground mb-2" />
                  <h3 className="text-lg font-medium">No recipes found</h3>
                  <p className="text-sm text-muted-foreground">Try a different search term or category filter</p>
                </div>
              ) : (
                <div className="divide-y">
                  {getFilteredImportRecipes().map((recipe) => (
                    <div key={recipe.id} className="flex items-start gap-3 p-3 hover:bg-muted/50">
                      <Checkbox
                        id={`recipe-${recipe.id}`}
                        checked={selectedRecipesToImport.includes(recipe.id)}
                        onCheckedChange={() => toggleRecipeSelection(recipe.id)}
                      />
                      <div className="flex-1">
                        <label htmlFor={`recipe-${recipe.id}`} className="block font-medium cursor-pointer">
                          {recipe.title}
                        </label>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {recipe.description || "No description available"}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {recipe.category}
                          </Badge>
                          {recipe.favorite && (
                            <Badge variant="secondary" className="text-xs">
                              Favorite
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTime(recipe.prepTime + recipe.cookTime)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setImportDialogOpen(false)
                setSelectedRecipesToImport([])
                setImportSearchQuery("")
                setImportCategoryFilter("All")
              }}
            >
              Cancel
            </Button>
            <Button onClick={importRecipes} disabled={selectedRecipesToImport.length === 0}>
              <Import className="mr-2 h-4 w-4" />
              Import {selectedRecipesToImport.length} Recipe{selectedRecipesToImport.length !== 1 ? "s" : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
