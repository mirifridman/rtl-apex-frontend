import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Clock, AlertTriangle } from "lucide-react";
import { format, isPast } from "date-fns";
import { he } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { Employee } from "@/hooks/useEmployees";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface EmployeeTasksDialogProps {
  employee: Employee | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEditEmployee: () => void;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  new: { label: "חדשה", className: "status-new" },
  approved: { label: "מאושרת", className: "status-approved" },
  in_progress: { label: "בעבודה", className: "status-in_progress" },
  stuck: { label: "תקוע", className: "status-stuck" },
  done: { label: "הושלמה", className: "status-done" },
};

const priorityConfig: Record<string, { label: string; className: string }> = {
  urgent: { label: "דחוף", className: "priority-urgent" },
  high: { label: "גבוהה", className: "priority-high" },
  medium: { label: "בינונית", className: "priority-medium" },
  low: { label: "נמוכה", className: "priority-low" },
};

export function EmployeeTasksDialog({
  employee,
  open,
  onOpenChange,
  onEditEmployee,
}: EmployeeTasksDialogProps) {
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["employee-tasks", employee?.id],
    queryFn: async () => {
      if (!employee) return [];
      
      const { data, error } = await supabase
        .from("task_assignees")
        .select(`
          task_id,
          tasks (
            id,
            title,
            topic,
            status,
            priority,
            deadline
          )
        `)
        .eq("employee_id", employee.id);

      if (error) throw error;
      
      return data
        .map((item) => item.tasks)
        .filter((task): task is NonNullable<typeof task> => task !== null)
        .sort((a, b) => {
          // Sort: active first, then by deadline
          if (a.status === "done" && b.status !== "done") return 1;
          if (a.status !== "done" && b.status === "done") return -1;
          if (!a.deadline && !b.deadline) return 0;
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        });
    },
    enabled: !!employee && open,
  });

  const initials = employee?.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

  const activeTasks = tasks.filter((t) => t.status !== "done");
  const completedTasks = tasks.filter((t) => t.status === "done");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0">
          <div className="flex items-center gap-4">
            <Avatar className="w-12 h-12 border-2 border-primary/30">
              <AvatarImage src={employee?.avatarUrl || undefined} />
              <AvatarFallback className="gradient-primary text-primary-foreground font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle className="text-xl font-bold">{employee?.name}</DialogTitle>
              {employee?.role && (
                <p className="text-sm text-muted-foreground">{employee.role}</p>
              )}
            </div>
            <button
              onClick={onEditEmployee}
              className="mr-auto text-sm text-primary hover:underline"
            >
              ערוך פרטים
            </button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>אין משימות משויכות</p>
            </div>
          ) : (
            <>
              {/* Active Tasks */}
              {activeTasks.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    משימות פעילות ({activeTasks.length})
                  </h3>
                  <div className="space-y-2">
                    {activeTasks.map((task) => (
                      <TaskItem key={task.id} task={task} />
                    ))}
                  </div>
                </div>
              )}

              {/* Completed Tasks */}
              {completedTasks.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    הושלמו ({completedTasks.length})
                  </h3>
                  <div className="space-y-2 opacity-60">
                    {completedTasks.map((task) => (
                      <TaskItem key={task.id} task={task} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface TaskItemProps {
  task: {
    id: string;
    title: string;
    topic: string | null;
    status: string;
    priority: string;
    deadline: string | null;
  };
}

function TaskItem({ task }: TaskItemProps) {
  const status = statusConfig[task.status] || statusConfig.new;
  const priority = priorityConfig[task.priority] || priorityConfig.medium;
  const isOverdue = task.deadline && isPast(new Date(task.deadline)) && task.status !== "done";

  return (
    <div className="glass-card p-3 rounded-xl">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {task.topic && (
            <span className="text-xs text-accent">{task.topic}</span>
          )}
          <h4 className="font-medium text-foreground truncate">{task.title}</h4>
        </div>
        <Badge className={cn("shrink-0 text-xs", priority.className)}>
          {priority.label}
        </Badge>
      </div>

      <div className="flex items-center gap-3 mt-2 text-xs">
        <Badge variant="outline" className={cn("text-xs", status.className)}>
          {status.label}
        </Badge>
        
        {task.deadline && (
          <span className={cn(
            "flex items-center gap-1",
            isOverdue ? "text-destructive" : "text-muted-foreground"
          )}>
            {isOverdue && <AlertTriangle className="w-3 h-3" />}
            <Calendar className="w-3 h-3" />
            {format(new Date(task.deadline), "d MMM", { locale: he })}
          </span>
        )}
      </div>
    </div>
  );
}
