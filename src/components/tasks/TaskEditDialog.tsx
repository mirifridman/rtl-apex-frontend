import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { 
  Calendar as CalendarIcon, 
  Trash2, 
  Loader2, 
  User, 
  ChevronDown, 
  MessageSquarePlus, 
  X,
  CheckCircle,
  UserPlus,
  Shield
} from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useTaskNotes, useAddTaskNote, useDeleteTaskNote } from "@/hooks/useTaskNotes";
import { useDirectApproveTask } from "@/hooks/useApprovalRequests";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ApprovalStatus } from "./ApprovalStatus";
import { ApprovalRequestDialog } from "./ApprovalRequestDialog";
import { useToast } from "@/hooks/use-toast";
import type { TaskData, TaskPriority, TaskStatus, Employee } from "./PendingTaskCard";

interface TaskEditDialogProps {
  task: TaskData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (taskId: string, updates: {
    title?: string;
    topic?: string;
    description?: string;
    deadline?: string | null;
    priority?: TaskPriority;
    status?: TaskStatus;
  }) => void;
  onDelete: (taskId: string) => void;
  onAssignToggle?: (taskId: string, employeeId: string) => void;
  employees?: Employee[];
  isSaving?: boolean;
  isDeleting?: boolean;
}

const priorityOptions: { value: TaskPriority; label: string }[] = [
  { value: "low", label: "נמוכה" },
  { value: "medium", label: "בינונית" },
  { value: "high", label: "גבוהה" },
  { value: "urgent", label: "דחוף" },
];

const statusOptions: { value: TaskStatus; label: string }[] = [
  { value: "new", label: "חדשה" },
  { value: "approved", label: "מאושרת" },
  { value: "in_progress", label: "בעבודה" },
  { value: "partially_done", label: "הושלם חלקית" },
  { value: "stuck", label: "תקוע" },
  { value: "done", label: "הושלמה" },
];

const priorityStyles: Record<TaskPriority, string> = {
  low: "priority-low",
  medium: "priority-medium",
  high: "priority-high",
  urgent: "priority-urgent",
};

const statusStyles: Record<TaskStatus, string> = {
  new: "status-new",
  approved: "status-approved",
  in_progress: "status-in_progress",
  partially_done: "status-partially_done",
  stuck: "status-stuck",
  done: "status-done",
};

export function TaskEditDialog({
  task,
  open,
  onOpenChange,
  onSave,
  onDelete,
  onAssignToggle,
  employees = [],
  isSaving,
  isDeleting,
}: TaskEditDialogProps) {
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState<Date | undefined>(undefined);
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [status, setStatus] = useState<TaskStatus>("new");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [assigneesOpen, setAssigneesOpen] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [approvalRequestOpen, setApprovalRequestOpen] = useState(false);

  const { toast } = useToast();

  // Notes hooks
  const { data: notes = [], isLoading: notesLoading } = useTaskNotes(task?.id || null);
  const addNote = useAddTaskNote();
  const deleteNote = useDeleteTaskNote();
  const directApprove = useDirectApproveTask();

  // Update state when task changes
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setTopic(task.topic || "");
      setDescription(task.description || "");
      setDeadline(task.deadline ? new Date(task.deadline) : undefined);
      setPriority(task.priority);
      setStatus(task.status);
      setNewNote("");
    }
  }, [task]);

  const isEmployeeAssigned = (employeeId: string) =>
    task?.assignees.some((a) => a.id === employeeId) || false;

  const handleSave = () => {
    if (!task) return;
    onSave(task.id, {
      title,
      topic: topic || undefined,
      description: description || undefined,
      deadline: deadline?.toISOString() || null,
      priority,
      status,
    });
  };

  const handleDelete = () => {
    if (!task) return;
    if (confirm("האם אתה בטוח שברצונך למחוק את המשימה?")) {
      onDelete(task.id);
    }
  };

  const clearDeadline = () => {
    setDeadline(undefined);
  };

  const handleAddNote = () => {
    if (!task || !newNote.trim()) return;
    addNote.mutate(
      { taskId: task.id, content: newNote.trim() },
      { onSuccess: () => setNewNote("") }
    );
  };

  const handleDeleteNote = (noteId: string) => {
    if (!task) return;
    deleteNote.mutate({ noteId, taskId: task.id });
  };

  const handleDirectApprove = async () => {
    if (!task) return;
    try {
      await directApprove.mutateAsync({ taskId: task.id });
      toast({
        title: "המשימה אושרה",
        description: "המשימה אושרה בהצלחה",
      });
      setStatus("approved");
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "לא ניתן לאשר את המשימה",
        variant: "destructive",
      });
    }
  };

  const isPending = task?.status === "new";

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[650px] glass-card border-border max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">עריכת משימה</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-4">
            {/* Topic */}
            <div className="space-y-2">
              <Label htmlFor="topic" className="text-sm font-medium">נושא</Label>
              <Input
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="נושא המשימה..."
                className="bg-secondary/50 border-border"
              />
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium">כותרת</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="כותרת המשימה..."
                className="bg-secondary/50 border-border"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">תיאור</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="תיאור המשימה..."
                className="bg-secondary/50 border-border min-h-[80px]"
              />
            </div>

            {/* Priority & Status Row */}
            <div className="grid grid-cols-2 gap-4">
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

              {/* Status */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">סטטוס</Label>
                <div className="flex flex-wrap gap-2">
                  {statusOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setStatus(option.value)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-bold border transition-all",
                        status === option.value
                          ? statusStyles[option.value]
                          : "bg-secondary/50 border-border text-muted-foreground hover:bg-secondary"
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Assignees */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">אחראים</Label>
              <Popover open={assigneesOpen} onOpenChange={setAssigneesOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between bg-secondary/50 border-border"
                  >
                    <span className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      {task?.assignees.length
                        ? `${task.assignees.length} אחראים נבחרו`
                        : "בחר אחראים"}
                    </span>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2 bg-background border-border" align="start">
                  {employees.length === 0 ? (
                    <p className="text-sm text-muted-foreground p-2">אין עובדים זמינים</p>
                  ) : (
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {employees.map((employee) => {
                        const isSelected = isEmployeeAssigned(employee.id);
                        return (
                          <label
                            key={employee.id}
                            className={cn(
                              "flex items-center gap-3 p-2 rounded-lg cursor-pointer",
                              "hover:bg-accent/50 transition-colors",
                              isSelected && "bg-accent/30"
                            )}
                          >
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => {
                                if (task) {
                                  onAssignToggle?.(task.id, employee.id);
                                }
                              }}
                              className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                            />
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm font-medium">{employee.name}</span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </PopoverContent>
              </Popover>
              {task && task.assignees.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {task.assignees.map((assignee) => (
                    <span
                      key={assignee.id}
                      className="px-2.5 py-1 text-xs font-medium bg-primary/20 text-primary rounded-full border border-primary/30"
                    >
                      {assignee.name}
                    </span>
                  ))}
                </div>
              )}
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
                    onClick={clearDeadline}
                    className="border-border bg-secondary/50 hover:bg-destructive/20 hover:text-destructive"
                  >
                    ✕
                  </Button>
                )}
              </div>
            </div>

            {/* Approval Section */}
            {task && (
              <>
                <Separator className="my-4" />
                <div className="space-y-4">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    אישור משימה
                  </Label>
                  
                  {isPending ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          onClick={handleDirectApprove}
                          disabled={directApprove.isPending}
                          className="gradient-success text-success-foreground glow-success"
                        >
                          {directApprove.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin ml-2" />
                          ) : (
                            <CheckCircle className="w-4 h-4 ml-2" />
                          )}
                          אשר משימה
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setApprovalRequestOpen(true)}
                          className="border-primary/30 hover:bg-primary/10"
                        >
                          <UserPlus className="w-4 h-4 ml-2" />
                          בקש אישור מחבר צוות
                        </Button>
                      </div>
                      
                      <ApprovalStatus taskId={task.id} />
                    </div>
                  ) : (
                    <ApprovalStatus 
                      taskId={task.id}
                      approvedBy={null}
                      approvedAt={null}
                    />
                  )}
                </div>
              </>
            )}

            {/* Notes Section */}
            <Separator className="my-4" />
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <MessageSquarePlus className="w-4 h-4" />
                הערות ({notes.length})
              </Label>
              
              {/* Add new note */}
              <div className="flex gap-2">
                <Textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="הוסף הערה חדשה..."
                  className="bg-secondary/50 border-border min-h-[60px] flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddNote}
                  disabled={!newNote.trim() || addNote.isPending}
                  className="self-end"
                >
                  {addNote.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "הוסף"
                  )}
                </Button>
              </div>

              {/* Notes list */}
              {notesLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : notes.length > 0 ? (
                <ScrollArea className="max-h-[150px]">
                  <div className="space-y-2">
                    {notes.map((note) => (
                      <div
                        key={note.id}
                        className="p-3 rounded-xl bg-secondary/30 border border-border group relative"
                      >
                        <p className="text-sm text-foreground whitespace-pre-wrap pr-6">
                          {note.content}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1.5">
                          {format(new Date(note.createdAt), "d בMMMM, HH:mm", { locale: he })}
                        </p>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/20 rounded"
                          disabled={deleteNote.isPending}
                        >
                          <X className="w-3.5 h-3.5 text-destructive" />
                        </button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-2">אין הערות עדיין</p>
              )}
            </div>
          </div>

          <DialogFooter className="flex gap-2 sm:gap-2">
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting || isSaving}
              className="gap-2"
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              מחק
            </Button>
            <div className="flex-1" />
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving || isDeleting}
            >
              ביטול
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || isDeleting || !title.trim()}
              className="gradient-primary text-primary-foreground"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin ml-2" />
              ) : null}
              שמור
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approval Request Dialog */}
      {task && (
        <ApprovalRequestDialog
          open={approvalRequestOpen}
          onOpenChange={setApprovalRequestOpen}
          taskId={task.id}
          taskTitle={task.title}
        />
      )}
    </>
  );
}
