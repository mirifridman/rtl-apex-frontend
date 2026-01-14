import { Clock, ArrowLeft, Sparkles, CheckSquare } from "lucide-react";
import { PendingTaskCard, TaskData, TaskPriority, Employee } from "./PendingTaskCard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PendingTasksListProps {
  tasks: TaskData[];
  employees?: Employee[];
  onApprove: (taskId: string) => void;
  onEdit: (taskId: string) => void;
  onAssignToggle?: (taskId: string, employeeId: string) => void;
  onPriorityChange?: (taskId: string, priority: TaskPriority) => void;
  onConvertToProject?: (task: TaskData) => void;
  onBulkApprove?: (taskIds: string[]) => void;
  selectedTasks?: Set<string>;
  onSelectionChange?: (taskId: string, selected: boolean) => void;
  showSelection?: boolean;
  className?: string;
}

export function PendingTasksList({ 
  tasks, 
  employees = [],
  onApprove, 
  onEdit, 
  onAssignToggle,
  onPriorityChange,
  onConvertToProject,
  onBulkApprove,
  selectedTasks = new Set(),
  onSelectionChange,
  showSelection = false,
  className 
}: PendingTasksListProps) {
  if (tasks.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-20", className)}>
        <div className="relative mb-6">
          {/* Animated 3D-style icon */}
          <div className="w-24 h-24 rounded-3xl gradient-primary flex items-center justify-center glow-primary animate-float">
            <Clock className="w-12 h-12 text-primary-foreground" strokeWidth={1.5} />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full gradient-accent flex items-center justify-center glow-accent animate-pulse-soft">
            <Sparkles className="w-4 h-4 text-accent-foreground" />
          </div>
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">אין משימות ממתינות</h3>
        <p className="text-muted-foreground text-center max-w-sm">
          כל המשימות טופלו. נהדר! 🎉
        </p>
      </div>
    );
  }

  const selectedCount = selectedTasks.size;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl gradient-primary flex items-center justify-center glow-primary">
            <Clock className="w-5 h-5 text-primary-foreground" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">ממתין לאישור</h2>
            <p className="text-sm text-muted-foreground">
              {tasks.length} משימות דורשות את תשומת לבך
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Bulk approve button */}
          {showSelection && selectedCount > 0 && (
            <Button
              onClick={() => onBulkApprove?.(Array.from(selectedTasks))}
              className="gradient-success text-success-foreground font-bold rounded-2xl glow-success hover:scale-[1.02] transition-all"
            >
              <CheckSquare className="w-4 h-4 ml-2" />
              אשר {selectedCount} משימות
            </Button>
          )}
          
          <button className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors font-medium group">
            <span>הצג הכל</span>
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Task Cards Grid */}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {tasks.map((task, index) => (
          <div
            key={task.id}
            className={cn(
              "animate-fade-in",
              `stagger-${Math.min(index + 1, 6)}`
            )}
          >
            <PendingTaskCard
              task={task}
              employees={employees}
              onApprove={onApprove}
              onEdit={onEdit}
              onAssignToggle={onAssignToggle}
              onPriorityChange={onPriorityChange}
              onConvertToProject={onConvertToProject}
              isSelected={selectedTasks.has(task.id)}
              onSelectionChange={onSelectionChange}
              showSelection={showSelection}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
