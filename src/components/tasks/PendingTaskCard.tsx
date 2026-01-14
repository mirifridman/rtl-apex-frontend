import { Calendar, User, AlertTriangle, Clock, ChevronDown, Users, UserPlus, FolderKanban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { DocumentsPopover } from "@/components/documents";
import { useDocumentCount } from "@/hooks/useDocuments";

export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type TaskStatus = "new" | "approved" | "in_progress" | "partially_done" | "stuck" | "done";

export interface TaskAssignee {
  id: string;
  name: string;
  avatarUrl?: string;
}

export interface TaskData {
  id: string;
  title: string;
  topic?: string;
  description?: string;
  priority: TaskPriority;
  deadline?: string;
  assignees: TaskAssignee[];
  status: TaskStatus;
  createdAt: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string | null;
  avatarUrl: string | null;
}

interface PendingTaskCardProps {
  task: TaskData;
  onApprove: (taskId: string) => void;
  onEdit: (taskId: string) => void;
  onAssignToggle?: (taskId: string, employeeId: string) => void;
  onPriorityChange?: (taskId: string, priority: TaskPriority) => void;
  onConvertToProject?: (task: TaskData) => void;
  employees?: Employee[];
  className?: string;
  isApproving?: boolean;
  isSelected?: boolean;
  onSelectionChange?: (taskId: string, selected: boolean) => void;
  showSelection?: boolean;
}

const priorityLabels: Record<TaskPriority, string> = {
  low: "נמוכה",
  medium: "בינונית",
  high: "גבוהה",
  urgent: "דחוף",
};

const priorityStyles: Record<TaskPriority, string> = {
  low: "priority-low",
  medium: "priority-medium",
  high: "priority-high",
  urgent: "priority-urgent",
};

const priorityOptions: TaskPriority[] = ["low", "medium", "high", "urgent"];

export function PendingTaskCard({ 
  task, 
  onApprove, 
  onEdit, 
  onAssignToggle,
  onPriorityChange,
  onConvertToProject,
  employees = [],
  className, 
  isApproving,
  isSelected = false,
  onSelectionChange,
  showSelection = false,
}: PendingTaskCardProps) {
  const { data: docCount = 0 } = useDocumentCount("task", task.id);
  const isEmployeeAssigned = (employeeId: string) => 
    task.assignees.some(a => a.id === employeeId);
  const isOverdue = task.deadline && new Date(task.deadline) < new Date();
  
  // Calculate progress (mock - based on time until deadline)
  const getProgress = () => {
    if (!task.deadline) return 0;
    const created = new Date(task.createdAt).getTime();
    const deadline = new Date(task.deadline).getTime();
    const now = Date.now();
    const total = deadline - created;
    const elapsed = now - created;
    return Math.min(100, Math.max(0, (elapsed / total) * 100));
  };
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("he-IL", {
      day: "numeric",
      month: "short",
    });
  };

  const getRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return `באיחור של ${Math.abs(diffDays)} ימים`;
    if (diffDays === 0) return "היום";
    if (diffDays === 1) return "מחר";
    if (diffDays <= 7) return `בעוד ${diffDays} ימים`;
    return formatDate(dateStr);
  };

  const progress = getProgress();

  return (
    <div
      className={cn(
        "relative p-6 rounded-3xl glass-card gradient-border overflow-hidden",
        "transition-all duration-500 ease-out",
        "group",
        "hover:shadow-[0_20px_50px_-15px_hsl(0_0%_0%/0.6)] hover:-translate-y-1 hover:scale-[1.02]",
        "animate-fade-in",
        isOverdue && "border-destructive/40 glow-destructive",
        isSelected && "ring-2 ring-primary",
        isApproving && "animate-slide-out",
        className
      )}
    >
      {/* Selection checkbox */}
      {showSelection && (
        <div className="absolute top-4 left-4 z-10">
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => onSelectionChange?.(task.id, !!checked)}
            className="w-5 h-5 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
          />
        </div>
      )}

      {/* Header - Clean borderless look */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="flex-1 min-w-0">
          {task.topic && (
            <p className="text-xs font-semibold text-primary mb-1 uppercase tracking-wide icon-glow">
              {task.topic}
            </p>
          )}
          <h3 className="font-bold text-foreground text-lg tracking-tight">{task.title}</h3>
          {task.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-2 leading-relaxed">
              {task.description}
            </p>
          )}
        </div>
        
        {/* Priority Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button 
              className={cn(
                "shrink-0 text-xs font-bold px-3.5 py-1.5 rounded-full border",
                "flex items-center gap-1.5 cursor-pointer transition-all",
                "hover:scale-105",
                priorityStyles[task.priority]
              )}
            >
              {priorityLabels[task.priority]}
              <ChevronDown className="w-3 h-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-background border-border z-50">
            {priorityOptions.map((priority) => (
              <DropdownMenuItem
                key={priority}
                onClick={() => onPriorityChange?.(task.id, priority)}
                className={cn(
                  "cursor-pointer font-medium",
                  task.priority === priority && "bg-accent"
                )}
              >
                <Badge 
                  variant="outline" 
                  className={cn("text-xs", priorityStyles[priority])}
                >
                  {priorityLabels[priority]}
                </Badge>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Meta - Glass pills */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-6 flex-wrap">
        {task.deadline && (
          <div className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-card",
            isOverdue && "bg-destructive/15 text-destructive border-destructive/30"
          )}>
            {isOverdue ? (
              <AlertTriangle className="w-3.5 h-3.5 icon-glow" />
            ) : (
              <Calendar className="w-3.5 h-3.5" />
            )}
            <span className="font-medium">{getRelativeTime(task.deadline)}</span>
          </div>
        )}
        
        {/* Assignees Multi-Select with Checkboxes */}
        <Popover>
          <PopoverTrigger asChild>
            {task.assignees.length > 0 ? (
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-card cursor-pointer hover:bg-accent/50 transition-all">
                {/* Show avatars */}
                <div className="flex -space-x-2 space-x-reverse">
                  {task.assignees.slice(0, 3).map((assignee) => (
                    <Avatar key={assignee.id} className="w-5 h-5 border border-background">
                      <AvatarImage src={assignee.avatarUrl} />
                      <AvatarFallback className="text-[8px] bg-primary text-primary-foreground">
                        {assignee.name.slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                <span className="font-medium">
                  {task.assignees.length === 1 
                    ? task.assignees[0].name 
                    : `${task.assignees.length} אחראים`}
                </span>
                <ChevronDown className="w-3 h-3" />
              </button>
            ) : (
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-warning/10 text-warning border border-warning/20 cursor-pointer hover:bg-warning/20 transition-all">
                <UserPlus className="w-3.5 h-3.5 icon-glow" />
                <span className="font-medium">ממתין לשיבוץ</span>
                <ChevronDown className="w-3 h-3" />
              </button>
            )}
          </PopoverTrigger>
          <PopoverContent align="start" className="bg-background border-border z-50 w-56 p-2">
            {employees.length === 0 ? (
              <p className="text-sm text-muted-foreground p-2">אין עובדים זמינים</p>
            ) : (
              <div className="space-y-1">
                {employees.map((employee) => {
                  const isAssigned = isEmployeeAssigned(employee.id);
                  const initials = employee.name.split(" ").map(n => n[0]).join("").slice(0, 2);
                  return (
                    <label
                      key={employee.id}
                      className={cn(
                        "flex items-center gap-3 p-2 rounded-lg cursor-pointer",
                        "hover:bg-accent/50 transition-colors",
                        isAssigned && "bg-accent/30"
                      )}
                    >
                      <Checkbox
                        checked={isAssigned}
                        onCheckedChange={() => onAssignToggle?.(task.id, employee.id)}
                        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={employee.avatarUrl || undefined} />
                          <AvatarFallback className="text-[10px] bg-primary/20 text-primary">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{employee.name}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </PopoverContent>
        </Popover>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-card">
          <Clock className="w-3.5 h-3.5" />
          <span>{formatDate(task.createdAt)}</span>
        </div>

        <DocumentsPopover entityType="task" entityId={task.id} count={docCount} />
      </div>

      {/* Actions - Modern neon buttons */}
      <div className="flex items-center gap-3 mb-4">
        <Button
          variant="default"
          size="sm"
          className="flex-1 gradient-success text-success-foreground font-bold rounded-2xl py-5 glow-success hover:scale-[1.02] transition-all duration-300"
          onClick={() => onApprove(task.id)}
        >
          אשר משימה
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 font-semibold rounded-2xl py-5 bg-secondary hover:bg-secondary/80 border-border hover:border-primary/30 hover:glow-primary transition-all duration-300"
          onClick={() => onEdit(task.id)}
        >
          ערוך
        </Button>
        {onConvertToProject && (
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 rounded-2xl h-10 w-10 text-muted-foreground hover:text-primary hover:bg-primary/10"
            onClick={() => onConvertToProject(task)}
            title="הפוך לפרויקט"
          >
            <FolderKanban className="w-5 h-5" />
          </Button>
        )}
      </div>

      {/* Progress bar at bottom */}
      {task.deadline && (
        <div className="relative h-1.5 bg-muted/30 rounded-full overflow-hidden">
          <div 
            className={cn(
              "absolute inset-y-0 right-0 rounded-full transition-all duration-700",
              isOverdue 
                ? "bg-gradient-to-l from-destructive to-red-500" 
                : progress > 70 
                  ? "bg-gradient-to-l from-warning to-amber-400"
                  : "bg-gradient-to-l from-primary to-blue-400"
            )}
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>
      )}
    </div>
  );
}
