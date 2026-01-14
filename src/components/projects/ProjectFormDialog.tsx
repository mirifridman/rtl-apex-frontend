import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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
import { Project, ProjectStatus, ProjectPriority, useCreateProject, useUpdateProject } from "@/hooks/useProjects";

interface ProjectFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: Project | null;
}

const statusOptions: { value: ProjectStatus; label: string }[] = [
  { value: "planning", label: "תכנון" },
  { value: "active", label: "פעיל" },
  { value: "on_hold", label: "מושהה" },
  { value: "completed", label: "הושלם" },
];

const priorityOptions: { value: ProjectPriority; label: string }[] = [
  { value: "low", label: "נמוכה" },
  { value: "medium", label: "בינונית" },
  { value: "high", label: "גבוהה" },
];

const statusStyles: Record<ProjectStatus, string> = {
  planning: "bg-muted/50 text-muted-foreground border-muted",
  active: "bg-success/20 text-success border-success/30",
  on_hold: "bg-warning/20 text-warning border-warning/30",
  completed: "bg-primary/20 text-primary border-primary/30",
};

const priorityStyles: Record<ProjectPriority, string> = {
  low: "priority-low",
  medium: "priority-medium",
  high: "priority-high",
};

export function ProjectFormDialog({ open, onOpenChange, project }: ProjectFormDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("planning");
  const [priority, setPriority] = useState<ProjectPriority>("medium");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [dueDate, setDueDate] = useState<Date | undefined>();

  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const isEditing = !!project;

  useEffect(() => {
    if (project) {
      setTitle(project.title);
      setDescription(project.description || "");
      setStatus(project.status);
      setPriority(project.priority);
      setStartDate(project.start_date ? new Date(project.start_date) : undefined);
      setDueDate(project.due_date ? new Date(project.due_date) : undefined);
    } else {
      setTitle("");
      setDescription("");
      setStatus("planning");
      setPriority("medium");
      setStartDate(undefined);
      setDueDate(undefined);
    }
  }, [project, open]);

  const handleSubmit = async () => {
    const data = {
      title,
      description: description || null,
      status,
      priority,
      start_date: startDate?.toISOString().split("T")[0] || null,
      due_date: dueDate?.toISOString().split("T")[0] || null,
    };

    if (isEditing) {
      await updateProject.mutateAsync({ id: project.id, ...data });
    } else {
      await createProject.mutateAsync(data);
    }
    onOpenChange(false);
  };

  const isPending = createProject.isPending || updateProject.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] glass-card border-border" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {isEditing ? "עריכת פרויקט" : "פרויקט חדש"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">שם הפרויקט</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="הזן שם פרויקט..."
              className="bg-secondary/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">תיאור</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="תיאור הפרויקט..."
              className="bg-secondary/50 min-h-[80px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>סטטוס</Label>
              <div className="flex flex-wrap gap-2">
                {statusOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setStatus(opt.value)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-bold border transition-all",
                      status === opt.value
                        ? statusStyles[opt.value]
                        : "bg-secondary/50 border-border text-muted-foreground hover:bg-secondary"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>עדיפות</Label>
              <div className="flex flex-wrap gap-2">
                {priorityOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPriority(opt.value)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-bold border transition-all",
                      priority === opt.value
                        ? priorityStyles[opt.value]
                        : "bg-secondary/50 border-border text-muted-foreground hover:bg-secondary"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>תאריך התחלה</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-right bg-secondary/50",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="ml-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP", { locale: he }) : "בחר תאריך"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>תאריך יעד</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-right bg-secondary/50",
                      !dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="ml-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "PPP", { locale: he }) : "בחר תאריך"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            ביטול
          </Button>
          <Button onClick={handleSubmit} disabled={!title.trim() || isPending}>
            {isPending && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
            {isEditing ? "שמור" : "צור פרויקט"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
