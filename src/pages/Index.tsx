import { useState, useMemo } from "react";
import { ClipboardList, Clock, AlertTriangle, CheckCircle, Loader2, ListChecks, ListX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DashboardLayout } from "@/components/layout";
import { StatCard } from "@/components/dashboard";
import { SearchBar } from "@/components/dashboard/SearchBar";
import { NotificationBell } from "@/components/dashboard/NotificationBell";
import { GridBackground } from "@/components/dashboard/GridBackground";
import { PendingTasksList } from "@/components/tasks";
import { TaskEditDialog } from "@/components/tasks/TaskEditDialog";
import { TaskPriority, TaskData } from "@/components/tasks/PendingTaskCard";
import { useToast } from "@/hooks/use-toast";
import { usePendingTasks, useTaskStats, useApproveTask, useUpdateTask, useDeleteTask } from "@/hooks/useTasks";
import { useActiveEmployees } from "@/hooks/useEmployees";
import { useAuth } from "@/hooks/useAuth";
import { useToggleTaskAssignee } from "@/hooks/useTaskAssignees";
import { Button } from "@/components/ui/button";
import migdalLogo from "@/assets/migdal-logo.png";

export default function Index() {
  const { user } = useAuth();
  const { data: pendingTasks = [], isLoading: tasksLoading } = usePendingTasks();
  const { data: employees = [] } = useActiveEmployees();
  const { data: stats, isLoading: statsLoading } = useTaskStats();
  const approveTask = useApproveTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const toggleAssignee = useToggleTaskAssignee();
  const { toast } = useToast();

  const [editingTask, setEditingTask] = useState<TaskData | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [showSelection, setShowSelection] = useState(false);

  // Filter and sort tasks
  const filteredTasks = useMemo(() => {
    let filtered = pendingTasks;
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(query) ||
        task.topic?.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query)
      );
    }
    
    // Sort by deadline (closest first)
    return [...filtered].sort((a, b) => {
      if (!a.deadline && !b.deadline) return 0;
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    });
  }, [pendingTasks, searchQuery]);

  const handleApprove = (taskId: string) => {
    approveTask.mutate(
      { taskId },
      {
        onSuccess: () => {
          toast({
            title: "המשימה אושרה ✨",
            description: "המשימה הועברה לרשימת המשימות הפעילות",
          });
          setSelectedTasks(prev => {
            const next = new Set(prev);
            next.delete(taskId);
            return next;
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

  const handleBulkApprove = (taskIds: string[]) => {
    let successCount = 0;
    let errorCount = 0;
    
    taskIds.forEach(taskId => {
      approveTask.mutate(
        { taskId },
        {
          onSuccess: () => {
            successCount++;
            if (successCount + errorCount === taskIds.length) {
              toast({
                title: `${successCount} משימות אושרו ✨`,
                description: errorCount > 0 ? `${errorCount} משימות נכשלו` : "כל המשימות הועברו לרשימת המשימות הפעילות",
              });
              setSelectedTasks(new Set());
              setShowSelection(false);
            }
          },
          onError: () => {
            errorCount++;
            if (successCount + errorCount === taskIds.length) {
              toast({
                title: "חלק מהמשימות נכשלו",
                description: `${successCount} הצליחו, ${errorCount} נכשלו`,
                variant: "destructive",
              });
            }
          },
        }
      );
    });
  };

  const handleEdit = (taskId: string) => {
    const task = pendingTasks.find(t => t.id === taskId);
    if (task) {
      setEditingTask(task);
      setEditDialogOpen(true);
    }
  };

  const handleSaveEdit = (taskId: string, updates: {
    title?: string;
    topic?: string;
    description?: string;
    deadline?: string | null;
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
          setEditingTask(null);
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
        setEditingTask(null);
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

  const handlePriorityChange = (taskId: string, priority: TaskPriority) => {
    updateTask.mutate(
      { taskId, updates: { priority } },
      {
        onSuccess: () => {
          toast({
            title: "העדיפות עודכנה",
            description: "עדיפות המשימה עודכנה בהצלחה",
          });
        },
        onError: () => {
          toast({
            title: "שגיאה",
            description: "לא ניתן לעדכן את העדיפות",
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleSelectionChange = (taskId: string, selected: boolean) => {
    setSelectedTasks(prev => {
      const next = new Set(prev);
      if (selected) {
        next.add(taskId);
      } else {
        next.delete(taskId);
      }
      return next;
    });
  };

  const toggleSelectionMode = () => {
    setShowSelection(!showSelection);
    if (showSelection) {
      setSelectedTasks(new Set());
    }
  };

  // Map employees to the expected format
  const mappedEmployees = employees.map(emp => ({
    id: emp.id,
    name: emp.name,
    email: emp.email,
    avatarUrl: emp.avatarUrl,
  }));

  const isLoading = tasksLoading || statsLoading;
  const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "מירי";

  // Calculate total completed
  const totalCompleted = stats?.completedThisWeek ?? 0;

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "בוקר טוב";
    if (hour < 17) return "צהריים טובים";
    if (hour < 21) return "ערב טוב";
    return "לילה טוב";
  };

  return (
    <DashboardLayout>
      <GridBackground />
      
      <div className="relative p-10 pr-16 space-y-10">
        {/* Page Header */}
        <div className="flex items-start justify-between animate-fade-in">
          <div className="flex items-center gap-6">
            {/* Logo */}
            <div className="w-20 h-20 rounded-2xl glass-card flex items-center justify-center p-2 glow-primary">
              <img src={migdalLogo} alt="מגדלור" className="w-16 h-16 object-contain" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">{getGreeting()},</p>
              <h1 className="text-4xl font-black text-foreground tracking-tight">
                {userName}
              </h1>
              <p className="text-muted-foreground mt-2">
                הנה סיכום המשימות שלך להיום
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <NotificationBell 
              count={stats?.pendingApproval ?? 0} 
              onClick={() => {}}
            />
          </div>
        </div>

        {/* Stats Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="relative">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <div className="absolute inset-0 blur-xl bg-primary/30" />
            </div>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="animate-fade-in stagger-1">
              <StatCard
                title="משימות פתוחות"
                value={stats?.totalOpen ?? 0}
                maxValue={Math.max(50, (stats?.totalOpen ?? 0) + 10)}
                icon={ClipboardList}
                variant="primary"
              />
            </div>
            <div className="animate-fade-in stagger-2">
              <StatCard
                title="באיחור"
                value={stats?.overdue ?? 0}
                maxValue={Math.max(20, (stats?.overdue ?? 0) + 5)}
                icon={AlertTriangle}
                variant="destructive"
              />
            </div>
            <div className="animate-fade-in stagger-3">
              <StatCard
                title="הושלמו בסה״כ"
                value={totalCompleted}
                maxValue={Math.max(100, totalCompleted + 20)}
                icon={CheckCircle}
                variant="accent"
              />
            </div>
            <div className="animate-fade-in stagger-4">
              <StatCard
                title="ממתינות לאישור"
                value={stats?.pendingApproval ?? 0}
                maxValue={Math.max(30, (stats?.pendingApproval ?? 0) + 10)}
                icon={Clock}
                variant="warning"
              />
            </div>
          </div>
        )}

        {/* Section Header with Bulk Actions */}
        <div className="flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-foreground">ממתין לאישור</h2>
            <Badge className="bg-warning/20 text-warning border border-warning/30">
              {filteredTasks.length}
            </Badge>
          </div>
          
          <Button
            variant={showSelection ? "default" : "outline"}
            onClick={toggleSelectionMode}
            className={`rounded-2xl transition-all ${showSelection ? 'gradient-primary glow-primary' : ''}`}
          >
            {showSelection ? (
              <>
                <ListX className="w-4 h-4 ml-2" />
                ביטול בחירה
              </>
            ) : (
              <>
                <ListChecks className="w-4 h-4 ml-2" />
                אשר בחירה מרובה
              </>
            )}
          </Button>
        </div>

        {/* Search */}
        <div className="animate-fade-in">
          <SearchBar 
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="חיפוש משימות..."
            className="max-w-md"
          />
        </div>

        {/* Pending Tasks Section */}
        {tasksLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="relative">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <div className="absolute inset-0 blur-2xl bg-primary/30" />
            </div>
          </div>
        ) : (
          <PendingTasksList
            tasks={filteredTasks}
            employees={mappedEmployees}
            onApprove={handleApprove}
            onEdit={handleEdit}
            onAssignToggle={handleAssignToggle}
            onPriorityChange={handlePriorityChange}
            onBulkApprove={handleBulkApprove}
            selectedTasks={selectedTasks}
            onSelectionChange={handleSelectionChange}
            showSelection={showSelection}
          />
        )}
      </div>

      <TaskEditDialog
        task={editingTask}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSave={handleSaveEdit}
        onDelete={handleDeleteTask}
        isSaving={updateTask.isPending}
        isDeleting={deleteTask.isPending}
      />
    </DashboardLayout>
  );
}
