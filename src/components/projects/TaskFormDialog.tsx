import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { cn } from "@/lib/utils";

type TaskPriority = "low" | "medium" | "high" | "urgent";

interface TaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (task: {
    title: string;
    topic?: string;
    description?: string;
    priority: TaskPriority;
    deadline?: string | null;
    project_id?: string;
  }) => void;
  projectId?: string;
  isSubmitting?: boolean;
}

const priorityOptions: { value: TaskPriority; label: string }[] = [
  { value: "low", label: "נמוכה" },
  { value: "medium", label: "בינונית" },
  { value: "high", label: "גבוהה" },
  { value: "urgent", label: "דחוף" },
];

const priorityStyles: Record<TaskPriority, string> = {
  low: "priority-low",
  medium: "priority-medium",
  high: "priority-high",
  urgent: "priority-urgent",
};

export function TaskFormDialog({
  open,
  onOpenChange,
  onSubmit,
  projectId,
  isSubmitting,
}: TaskFormDialogProps) {
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [deadline, setDeadline] = useState<Date | undefined>(undefined);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const handleSubmit = () => {
    if (!title.trim()) return;
    onSubmit({
      title: title.trim(),
      topic: topic.trim() || undefined,
      description: description.trim() || undefined,
      priority,
      deadline: deadline?.toISOString() || null,
      project_id: projectId,
    });
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setTitle("");
      setTopic("");
      setDescription("");
      setPriority("medium");
      setDeadline(undefined);
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] glass-card border-border" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">משימה חדשה</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Topic */}
          <div className="space-y-2">
            <Label htmlFor="task-topic" className="text-sm font-medium">נושא</Label>
            <Input
              id="task-topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="נושא המשימה..."
              className="bg-secondary/50 border-border"
            />
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="task-title" className="text-sm font-medium">כותרת *</Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="כותרת המשימה..."
              className="bg-secondary/50 border-border"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="task-description" className="text-sm font-medium">תיאור</Label>
            <Textarea
              id="task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="תיאור המשימה..."
              className="bg-secondary/50 border-border min-h-[80px]"
            />
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">עדיפות</Label>
            <div className="flex flex-wrap gap-2">
              {priorityOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPriority(option.value)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-bold border transition-all",
                    priority === option.value
                      ? priorityStyles[option.value]
                      : "bg-secondary/50 border-border text-muted-foreground hover:bg-secondary"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Deadline */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">תאריך יעד</Label>
            <div className="flex gap-2">
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "flex-1 justify-start text-right bg-secondary/50 border-border",
                      !deadline && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="ml-2 h-4 w-4" />
                    {deadline ? format(deadline, "PPP", { locale: he }) : "בחר תאריך"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-background border-border" align="start">
                  <Calendar
                    mode="single"
                    selected={deadline}
                    onSelect={(date) => {
                      setDeadline(date);
                      setCalendarOpen(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {deadline && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setDeadline(undefined)}
                  className="border-border bg-secondary/50 hover:bg-destructive/20 hover:text-destructive"
                >
                  ✕
                </Button>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={isSubmitting}
          >
            ביטול
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !title.trim()}
            className="gradient-primary text-primary-foreground"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin ml-2" />
            ) : null}
            צור משימה
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
