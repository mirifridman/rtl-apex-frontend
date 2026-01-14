import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout";
import { useTasks, useApproveTask, useUpdateTask, useDeleteTask } from "@/hooks/useTasks";
import { useActiveEmployees } from "@/hooks/useEmployees";
import { useToggleTaskAssignee } from "@/hooks/useTaskAssignees";
import { useConvertTaskToProject } from "@/hooks/useProjects";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Calendar, AlertTriangle, Filter, UserPlus, Clock, CheckCircle2 } from "lucide-react";
import { format, isPast, isToday, isThisWeek, isThisMonth } from "date-fns";
import { he } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { TaskFilters, ActiveFilter, SortDirection } from "@/components/tasks/TaskFilters";
import { TaskEditDialog } from "@/components/tasks/TaskEditDialog";
import { useToast } from "@/hooks/use-toast";
import type { TaskData, TaskPriority } from "@/components/tasks";

const priorityConfig = {
  urgent: { label: "דחוף", className: "priority-urgent" },
  high: { label: "גבוהה", className: "priority-high" },
  medium: { label: "בינונית", className: "priority-medium" },
  low: { label: "נמוכה", className: "priority-low" },
};

const statusConfig: Record<string, { label: string; className: string }> = {
  new: { label: "ממתין לאישור", className: "status-new" },
  approved: { label: "מאושרת", className: "status-approved" },
  in_progress: { label: "בעבודה", className: "status-in_progress" },
  partially_done: { label: "הושלם חלקית", className: "status-partially_done" },
  stuck: { label: "תקוע", className: "status-stuck" },
  done: { label: "הושלמה", className: "status-done" },
};

const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };

export default function TasksPage() {
  const navigate = useNavigate();
  const { data: tasks = [], isLoading } = useTasks();
  const { data: employees = [] } = useActiveEmployees();
  const approveTask = useApproveTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const toggleAssignee = useToggleTaskAssignee();
  const convertToProject = useConvertTaskToProject();
  const { toast } = useToast();
  
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [activeTab, setActiveTab] = useState<string>("all");
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Get the current task from tasks array to ensure we have the latest data
  const editingTask = editingTaskId ? tasks.find(t => t.id === editingTaskId) || null : null;

  // Count pending tasks
  const pendingCount = tasks.filter(task => task.status === "new").length;

  // Apply filters
  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    // Apply active tab filter
    if (activeTab === "pending") {
      result = result.filter(task => task.status === "new");
    } else if (activeTab !== "all") {
      result = result.filter(task => task.status === activeTab);
    }

    // Apply custom filters
    activeFilters.forEach(filter => {
      switch (filter.type) {
        case "employee":
          if (filter.value === "unassigned") {
            result = result.filter(task => task.assignees.length === 0);
          } else {
            result = result.filter(task => task.assignees.some(a => a.id === filter.value));
          }
          break;
        case "priority":
          result = result.filter(task => task.priority === filter.value);
          break;
        case "status":
          result = result.filter(task => task.status === filter.value);
          break;
        case "deadline":
          result = result.filter(task => {
            if (!task.deadline) {
              return filter.value === "no_deadline";
            }
            const deadline = new Date(task.deadline);
            switch (filter.value) {
              case "overdue":
                return isPast(deadline) && task.status !== "done";
              case "today":
                return isToday(deadline);
              case "week":
                return isThisWeek(deadline);
              case "month":
                return isThisMonth(deadline);
              case "no_deadline":
                return false;
              default:
                return true;
            }
          });
          break;
      }
    });

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "created_at":
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case "deadline":
          if (!a.deadline && !b.deadline) comparison = 0;
          else if (!a.deadline) comparison = 1;
          else if (!b.deadline) comparison = -1;
          else comparison = new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
          break;
        case "priority":
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return result;
  }, [tasks, activeFilters, sortBy, sortDirection, activeTab]);

  // Map employees for filter component
  const mappedEmployees = employees.map(emp => ({
    id: emp.id,
    name: emp.name,
    email: emp.email,
    avatarUrl: emp.avatarUrl,
  }));

  const handleSortChange = (newSortBy: string, direction: SortDirection) => {
    setSortBy(newSortBy);
    setSortDirection(direction);
  };

  const handleCardClick = (task: TaskData) => {
    setEditingTaskId(task.id);
    setEditDialogOpen(true);
  };

  const handleApprove = (taskId: string) => {
    approveTask.mutate(
      { taskId },
      {
        onSuccess: () => {
          toast({
            title: "המשימה אושרה",
            description: "המשימה הועברה לרשימת המשימות הפעילות",
          });
        },
        onError: () => {
          toast({
            title: "שגיאה",
            description: "לא ניתן לאשר את המשימה",
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleSaveEdit = (taskId: string, updates: {
    title?: string;
    topic?: string;
    description?: string;
    deadline?: string | null;
    priority?: TaskData["priority"];
    status?: TaskData["status"];
  }) => {
    updateTask.mutate(
      { taskId, updates },
      {
        onSuccess: () => {
          toast({
            title: "המשימה עודכנה",
            description: "השינויים נשמרו בהצלחה",
          });
          setEditDialogOpen(false);
          setEditingTaskId(null);
        },
        onError: () => {
          toast({
            title: "שגיאה",
            description: "לא ניתן לעדכן את המשימה",
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleDeleteTask = (taskId: string) => {
    deleteTask.mutate(taskId, {
      onSuccess: () => {
        toast({
          title: "המשימה נמחקה",
          description: "המשימה הוסרה בהצלחה",
        });
        setEditDialogOpen(false);
        setEditingTaskId(null);
      },
      onError: () => {
        toast({
          title: "שגיאה",
          description: "לא ניתן למחוק את המשימה",
          variant: "destructive",
        });
      },
    });
  };

  const handleAssignToggle = (taskId: string, employeeId: string) => {
    toggleAssignee.mutate({ taskId, employeeId });
  };

  const handleConvertToProject = (task: TaskData) => {
    convertToProject.mutate(
      { taskId: task.id, taskTitle: task.title, taskDescription: task.description },
      {
        onSuccess: () => {
          setEditDialogOpen(false);
          setEditingTaskId(null);
          navigate("/projects");
        },
      }
    );
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-8 flex items-center justify-center min-h-[60vh]">
          <div className="relative">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <div className="absolute inset-0 blur-2xl bg-primary/30" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const TaskCard = ({ task, index }: { task: TaskData; index: number }) => {
    const priority = priorityConfig[task.priority];
    const status = statusConfig[task.status] || { label: task.status, className: "" };
    const isOverdue = task.deadline && isPast(new Date(task.deadline)) && task.status !== "done";
    const isPending = task.status === "new";

    return (
      <Card 
        onClick={() => handleCardClick(task)}
        className={cn(
          "glass-card border-border/50 hover:border-primary/30 transition-all duration-300 animate-fade-in cursor-pointer",
          "hover:shadow-[0_20px_50px_-15px_hsl(0_0%_0%/0.6)] hover:-translate-y-1",
          isOverdue && "border-destructive/50",
          isPending && "border-warning/30"
        )}
        style={{ animationDelay: `${index * 50}ms` }}
      >
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-3">
              {task.topic && (
                <p className="text-xs font-semibold text-primary uppercase tracking-wide">
                  {task.topic}
                </p>
              )}
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="font-bold text-foreground text-lg">{task.title}</h3>
                <Badge variant="outline" className={cn("text-xs", priority.className)}>
                  {priority.label}
                </Badge>
                <Badge variant="outline" className={cn("text-xs", status.className)}>
                  {status.label}
                </Badge>
                {isOverdue && (
                  <Badge variant="destructive" className="text-xs gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    באיחור
                  </Badge>
                )}
              </div>

              {task.description && (
                <p className="text-muted-foreground text-sm line-clamp-2">
                  {task.description}
                </p>
              )}

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {task.deadline && (
                  <div className={cn("flex items-center gap-1.5", isOverdue && "text-destructive")}>
                    <Calendar className="w-4 h-4" />
                    <span>{format(new Date(task.deadline), "d בMMMM yyyy", { locale: he })}</span>
                  </div>
                )}

                {task.assignees.length > 0 ? (
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {task.assignees.slice(0, 3).map((assignee) => (
                        <Avatar key={assignee.id} className="w-6 h-6 border-2 border-background">
                          <AvatarImage src={assignee.avatarUrl} />
                          <AvatarFallback className="text-xs bg-primary/20 text-primary">
                            {assignee.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                    <span>
                      {task.assignees.length === 1 
                        ? task.assignees[0].name 
                        : `${task.assignees.length} אחראים`}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-warning">
                    <UserPlus className="w-4 h-4" />
                    <span>ממתין לשיבוץ</span>
                  </div>
                )}

                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span>{format(new Date(task.createdAt), "d בMMMM", { locale: he })}</span>
                </div>
              </div>
            </div>

            {/* Quick Approve Button for pending tasks */}
            {isPending && (
              <Button
                size="sm"
                className="shrink-0 gradient-success text-success-foreground glow-success"
                onClick={(e) => {
                  e.stopPropagation();
                  handleApprove(task.id);
                }}
              >
                <CheckCircle2 className="w-4 h-4 ml-1" />
                אשר
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <DashboardLayout>
      <div className="p-8 space-y-6" dir="rtl">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-3xl font-black text-foreground tracking-tight">משימות</h1>
          <p className="text-muted-foreground mt-1">
            {tasks.length} משימות | {pendingCount} ממתינות לאישור
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="animate-fade-in">
          <TabsList className="glass-card p-1 mb-4 h-auto flex-wrap">
            <TabsTrigger 
              value="all" 
              className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              הכל ({tasks.length})
            </TabsTrigger>
            <TabsTrigger 
              value="pending" 
              className={cn(
                "rounded-xl relative",
                activeTab === "pending" 
                  ? "status-new" 
                  : "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              )}
            >
              ממתין לאישור ({pendingCount})
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-warning rounded-full animate-pulse" />
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="approved" 
              className={cn(
                "rounded-xl",
                activeTab === "approved" 
                  ? "status-approved" 
                  : "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              )}
            >
              מאושרות ({tasks.filter(t => t.status === "approved").length})
            </TabsTrigger>
            <TabsTrigger 
              value="in_progress" 
              className={cn(
                "rounded-xl",
                activeTab === "in_progress" 
                  ? "status-in_progress" 
                  : "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              )}
            >
              בעבודה ({tasks.filter(t => t.status === "in_progress").length})
            </TabsTrigger>
            <TabsTrigger 
              value="partially_done" 
              className={cn(
                "rounded-xl",
                activeTab === "partially_done" 
                  ? "status-partially_done" 
                  : "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              )}
            >
              הושלם חלקית ({tasks.filter(t => t.status === "partially_done").length})
            </TabsTrigger>
            <TabsTrigger 
              value="stuck" 
              className={cn(
                "rounded-xl",
                activeTab === "stuck" 
                  ? "status-stuck" 
                  : "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              )}
            >
              תקוע ({tasks.filter(t => t.status === "stuck").length})
            </TabsTrigger>
            <TabsTrigger 
              value="done" 
              className={cn(
                "rounded-xl",
                activeTab === "done" 
                  ? "status-done" 
                  : "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              )}
            >
              הושלמו ({tasks.filter(t => t.status === "done").length})
            </TabsTrigger>
          </TabsList>

          {/* Filters Section */}
          <div className="glass-card p-4 rounded-2xl mb-6">
            <TaskFilters
              employees={mappedEmployees}
              onFilterChange={setActiveFilters}
              onSortChange={handleSortChange}
              activeFilters={activeFilters}
              sortBy={sortBy}
              sortDirection={sortDirection}
            />
          </div>

          <TabsContent value={activeTab} className="mt-0">
            {filteredTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center glow-primary animate-float mb-6">
                  <Filter className="w-10 h-10 text-primary-foreground" />
                </div>
                <h2 className="text-xl font-bold text-foreground mb-2">אין משימות תואמות</h2>
                <p className="text-muted-foreground text-center max-w-md">
                  נסה לשנות את הפילטרים או הלשונית
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredTasks.map((task, index) => (
                  <TaskCard key={task.id} task={task} index={index} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <TaskEditDialog
        task={editingTask}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSave={handleSaveEdit}
        onDelete={handleDeleteTask}
        onAssignToggle={handleAssignToggle}
        onConvertToProject={handleConvertToProject}
        employees={mappedEmployees}
        isSaving={updateTask.isPending}
        isDeleting={deleteTask.isPending}
      />
    </DashboardLayout>
  );
}
