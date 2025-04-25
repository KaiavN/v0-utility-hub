"use client"

import { useState, useEffect } from "react"
import { RoleGuard } from "@/components/role-guard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, FileText, Plus, Trash2 } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { getLocalStorage, setLocalStorage } from "@/lib/local-storage"
import { useToast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface Assignment {
  id: string
  title: string
  course: string
  dueDate: string
  description: string
  status: "todo" | "in-progress" | "completed"
  priority: "low" | "medium" | "high"
  completed: boolean
}

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [newAssignment, setNewAssignment] = useState<Omit<Assignment, "id">>({
    title: "",
    course: "",
    dueDate: new Date().toISOString().split("T")[0],
    description: "",
    status: "todo",
    priority: "medium",
    completed: false,
  })
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<string>("all")
  const [courses, setCourses] = useState<string[]>([])
  const [courseFilter, setCourseFilter] = useState<string | null>(null)

  const { toast } = useToast()

  // Load assignments from localStorage
  useEffect(() => {
    const savedAssignments = getLocalStorage<Assignment[]>("assignments", [])
    setAssignments(savedAssignments)

    // Extract unique courses
    const uniqueCourses = Array.from(new Set(savedAssignments.map((a) => a.course)))
    setCourses(uniqueCourses)
  }, [])

  // Save assignments to localStorage
  const saveAssignments = (updatedAssignments: Assignment[]) => {
    setAssignments(updatedAssignments)
    setLocalStorage("assignments", updatedAssignments)

    // Update courses list
    const uniqueCourses = Array.from(new Set(updatedAssignments.map((a) => a.course)))
    setCourses(uniqueCourses)
  }

  const addAssignment = () => {
    if (!newAssignment.title || !newAssignment.course || !newAssignment.dueDate) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    const assignment: Assignment = {
      ...newAssignment,
      id: Date.now().toString(),
    }

    const updatedAssignments = [...assignments, assignment]
    saveAssignments(updatedAssignments)

    setNewAssignment({
      title: "",
      course: "",
      dueDate: new Date().toISOString().split("T")[0],
      description: "",
      status: "todo",
      priority: "medium",
      completed: false,
    })

    setIsDialogOpen(false)

    toast({
      title: "Assignment added",
      description: "Your assignment has been added successfully.",
    })
  }

  const toggleAssignmentStatus = (id: string) => {
    const updatedAssignments = assignments.map((assignment) => {
      if (assignment.id === id) {
        const completed = !assignment.completed
        return {
          ...assignment,
          completed,
          status: completed ? "completed" : "todo",
        }
      }
      return assignment
    })

    saveAssignments(updatedAssignments)
  }

  const updateAssignmentStatus = (id: string, status: "todo" | "in-progress" | "completed") => {
    const updatedAssignments = assignments.map((assignment) => {
      if (assignment.id === id) {
        return {
          ...assignment,
          status,
          completed: status === "completed",
        }
      }
      return assignment
    })

    saveAssignments(updatedAssignments)
  }

  const deleteAssignment = (id: string) => {
    const updatedAssignments = assignments.filter((assignment) => assignment.id !== id)
    saveAssignments(updatedAssignments)

    toast({
      title: "Assignment deleted",
      description: "The assignment has been removed.",
    })
  }

  const getFilteredAssignments = () => {
    let filtered = [...assignments]

    // Apply tab filter
    if (activeTab === "upcoming") {
      filtered = filtered.filter((a) => !a.completed && new Date(a.dueDate) > new Date())
    } else if (activeTab === "completed") {
      filtered = filtered.filter((a) => a.completed)
    } else if (activeTab === "overdue") {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      filtered = filtered.filter((a) => !a.completed && new Date(a.dueDate) < today)
    }

    // Apply course filter
    if (courseFilter) {
      filtered = filtered.filter((a) => a.course === courseFilter)
    }

    // Sort by due date (closest first)
    return filtered.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
  }

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const due = new Date(dueDate)
    due.setHours(0, 0, 0, 0)

    const diffTime = due.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    return diffDays
  }

  const getStatusBadge = (assignment: Assignment) => {
    if (assignment.completed) {
      return <Badge className="bg-green-500">Completed</Badge>
    }

    const daysUntilDue = getDaysUntilDue(assignment.dueDate)

    if (daysUntilDue < 0) {
      return <Badge variant="destructive">Overdue</Badge>
    } else if (daysUntilDue === 0) {
      return <Badge variant="destructive">Due Today</Badge>
    } else if (daysUntilDue <= 3) {
      return (
        <Badge variant="outline" className="bg-amber-500 text-white">
          Due Soon
        </Badge>
      )
    } else {
      return <Badge variant="outline">Upcoming</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return (
          <Badge variant="outline" className="bg-red-500 text-white">
            High Priority
          </Badge>
        )
      case "medium":
        return (
          <Badge variant="outline" className="bg-amber-500 text-white">
            Medium Priority
          </Badge>
        )
      case "low":
        return (
          <Badge variant="outline" className="bg-green-500 text-white">
            Low Priority
          </Badge>
        )
      default:
        return null
    }
  }

  const getCompletionStats = () => {
    const total = assignments.length
    const completed = assignments.filter((a) => a.completed).length
    const overdue = assignments.filter((a) => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return !a.completed && new Date(a.dueDate) < today
    }).length

    const completionRate = total > 0 ? (completed / total) * 100 : 0

    return { total, completed, overdue, completionRate }
  }

  const stats = getCompletionStats()

  return (
    <RoleGuard allowedRoles={["student"]}>
      <div className="container mx-auto p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold">Assignment Tracker</h1>
            <p className="text-muted-foreground">Track and manage your course assignments</p>
          </div>

          <div className="flex items-center gap-2">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Assignment
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Assignment</DialogTitle>
                  <DialogDescription>Enter the details for your new assignment.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Assignment Title</Label>
                    <Input
                      id="title"
                      value={newAssignment.title}
                      onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                      placeholder="e.g., Research Paper, Problem Set 3"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="course">Course</Label>
                    <Input
                      id="course"
                      value={newAssignment.course}
                      onChange={(e) => setNewAssignment({ ...newAssignment, course: e.target.value })}
                      placeholder="e.g., CS101, Biology 202"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={newAssignment.dueDate}
                      onChange={(e) => setNewAssignment({ ...newAssignment, dueDate: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={newAssignment.priority}
                      onValueChange={(value: "low" | "medium" | "high") =>
                        setNewAssignment({ ...newAssignment, priority: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Input
                      id="description"
                      value={newAssignment.description}
                      onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                      placeholder="Add any additional details"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={addAssignment}>Add Assignment</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {courses.length > 0 && (
              <Select
                value={courseFilter || "all"}
                onValueChange={(value) => setCourseFilter(value === "all" ? null : value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by course" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {courses.map((course) => (
                    <SelectItem key={course} value={course}>
                      {course}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Total Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total}</div>
              <p className="text-sm text-muted-foreground">Across all courses</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Completion Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{Math.round(stats.completionRate)}%</div>
              <Progress value={stats.completionRate} className="h-2 mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Overdue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.overdue}</div>
              <p className="text-sm text-muted-foreground">
                {stats.overdue > 0 ? "Assignments need attention" : "No overdue assignments"}
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="overdue">Overdue</TabsTrigger>
          </TabsList>

          <Card>
            <CardHeader>
              <CardTitle>
                {activeTab === "all"
                  ? "All Assignments"
                  : activeTab === "upcoming"
                    ? "Upcoming Assignments"
                    : activeTab === "completed"
                      ? "Completed Assignments"
                      : "Overdue Assignments"}
              </CardTitle>
              <CardDescription>
                {courseFilter ? `Filtered by course: ${courseFilter}` : "Showing all courses"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {getFilteredAssignments().length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No assignments found</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {activeTab === "all" ? "Add your first assignment to get started" : `No ${activeTab} assignments`}
                  </p>
                  <Button className="mt-4" onClick={() => setIsDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Assignment
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {getFilteredAssignments().map((assignment) => (
                    <div
                      key={assignment.id}
                      className={`flex items-start justify-between rounded-lg border p-4 ${
                        assignment.completed ? "bg-muted/40" : ""
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <Checkbox
                          checked={assignment.completed}
                          onCheckedChange={() => toggleAssignmentStatus(assignment.id)}
                          className="mt-1"
                        />
                        <div>
                          <h3
                            className={`font-medium ${assignment.completed ? "line-through text-muted-foreground" : ""}`}
                          >
                            {assignment.title}
                          </h3>
                          <div className="flex flex-wrap gap-2 mt-1">
                            <Badge variant="outline">{assignment.course}</Badge>
                            {getStatusBadge(assignment)}
                            {getPriorityBadge(assignment.priority)}
                          </div>
                          {assignment.description && (
                            <p className="text-sm text-muted-foreground mt-2">{assignment.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <div className="flex items-center">
                              <Calendar className="mr-1 h-3 w-3" />
                              {new Date(assignment.dueDate).toLocaleDateString()}
                            </div>
                            {!assignment.completed && (
                              <div className="flex items-center">
                                <Clock className="mr-1 h-3 w-3" />
                                {getDaysUntilDue(assignment.dueDate) < 0
                                  ? `${Math.abs(getDaysUntilDue(assignment.dueDate))} days overdue`
                                  : getDaysUntilDue(assignment.dueDate) === 0
                                    ? "Due today"
                                    : `${getDaysUntilDue(assignment.dueDate)} days left`}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!assignment.completed && (
                          <Select
                            value={assignment.status}
                            onValueChange={(value: "todo" | "in-progress" | "completed") =>
                              updateAssignmentStatus(assignment.id, value)
                            }
                          >
                            <SelectTrigger className="w-[130px]">
                              <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="todo">To Do</SelectItem>
                              <SelectItem value="in-progress">In Progress</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => deleteAssignment(assignment.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </Tabs>
      </div>
    </RoleGuard>
  )
}
