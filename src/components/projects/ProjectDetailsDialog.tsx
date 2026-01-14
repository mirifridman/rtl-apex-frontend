import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, ClipboardList, Gavel, Paperclip, Plus, Loader2, FolderKanban } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Project, useProjectTasks, useProjectDecisions, useConvertTaskToProject } from "@/hooks/useProjects";
import { useDocuments } from "@/hooks/useDocuments";
import { useCreateTask } from "@/hooks/useTasks";
import { FileDropZone } from "@/components/documents";
import { CircularProgress } from "@/components/ui/circular-progress";
import { TaskFormDialog } from "./TaskFormDialog";
import { useToast } from "@/hooks/use-toast";

interface ProjectDetailsDialogProps {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusConfig = {
  planning: { label: "תכנון", className: "bg-muted/50 text-muted-foreground border-muted" },
  active: { label: "פעיל", className: "bg-success/20 text-success border-success/30" },
  on_hold: { label: "מושהה", className: "bg-warning/20 text-warning border-warning/30" },
  completed: { label: "הושלם", className: "bg-primary/20 text-primary border-primary/30" },
};

export function ProjectDetailsDialog({ project, open, onOpenChange }: ProjectDetailsDialogProps) {
  const [activeTab, setActiveTab] = useState("tasks");
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const { toast } = useToast();
  
  const { data: tasks = [], isLoading: tasksLoading } = useProjectTasks(project?.id || null);
  const { data: decisions = [], isLoading: decisionsLoading } = useProjectDecisions(project?.id || null);
  const { data: documents = [], isLoading: docsLoading } = useDocuments("project", project?.id || null);
  
  const createTask = useCreateTask();
  const convertToProject = useConvertTaskToProject();

  const handleCreateTask = (taskData: any) => {
    createTask.mutate(taskData, {
      onSuccess: () => {
        setTaskFormOpen(false);
        toast({ title: "המשימה נוצרה בהצלחה" });
      },
    });
  };

  const handleConvertToProject = (task: any) => {
    if (confirm("האם להמיר משימה זו לפרויקט עצמאי?")) {
      convertToProject.mutate({
        taskId: task.id,
        taskTitle: task.title,
        taskDescription: task.description,
      });
    }
  };

  if (!project) return null;

  const completedTasks = tasks.filter((t: any) => t.status === "done").length;
  const progress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
  const statusInfo = statusConfig[project.status];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] glass-card border-border max-h-[85vh] overflow-hidden flex flex-col" dir="rtl">
        <DialogHeader className="pb-4 border-b border-border">
          <div className="flex items-start gap-4">
            <CircularProgress value={progress} size={64} strokeWidth={5}>
              <span className="text-sm font-bold">{progress}%</span>
            </CircularProgress>
            <div className="flex-1">
              <DialogTitle className="text-xl font-bold">{project.title}</DialogTitle>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge variant="outline" className={cn("text-xs", statusInfo.className)}>
                  {statusInfo.label}
                </Badge>
                {project.start_date && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      {format(new Date(project.start_date), "dd/MM/yy", { locale: he })}
                      {project.due_date && ` - ${format(new Date(project.due_date), "dd/MM/yy", { locale: he })}`}
                    </span>
                  </div>
                )}
              </div>
              {project.description && (
                <p className="text-sm text-muted-foreground mt-2">{project.description}</p>
              )}
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="glass-card p-1 mb-4 shrink-0">
            <TabsTrigger value="tasks" className="gap-2">
              <ClipboardList className="w-4 h-4" />
              משימות ({tasks.length})
            </TabsTrigger>
            <TabsTrigger value="decisions" className="gap-2">
              <Gavel className="w-4 h-4" />
              החלטות ({decisions.length})
            </TabsTrigger>
            <TabsTrigger value="files" className="gap-2">
              <Paperclip className="w-4 h-4" />
              קבצים ({documents.length})
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto">
            <TabsContent value="tasks" className="mt-0 h-full">
              <div className="mb-4">
                <Button
                  onClick={() => setTaskFormOpen(true)}
                  size="sm"
                  className="gap-2 gradient-primary text-primary-foreground"
                >
                  <Plus className="w-4 h-4" />
                  משימה חדשה
                </Button>
              </div>
              
              {tasksLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : tasks.length === 0 ? (
                <div className="text-center py-12">
                  <ClipboardList className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                  <p className="text-muted-foreground">אין משימות בפרויקט זה</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {tasks.map((task: any) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border group"
                    >
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        task.status === "done" ? "bg-success" : 
                        task.status === "in_progress" ? "bg-primary" : "bg-muted-foreground"
                      )} />
                      <span className="flex-1 text-sm">{task.title}</span>
                      <Badge variant="outline" className="text-xs">
                        {task.status === "done" ? "הושלם" : 
                         task.status === "in_progress" ? "בעבודה" : "ממתין"}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleConvertToProject(task)}
                        title="המר לפרויקט"
                        disabled={convertToProject.isPending}
                      >
                        <FolderKanban className="w-4 h-4 text-muted-foreground hover:text-primary" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="decisions" className="mt-0 h-full">
              {decisionsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : decisions.length === 0 ? (
                <div className="text-center py-12">
                  <Gavel className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                  <p className="text-muted-foreground">אין החלטות בפרויקט זה</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {decisions.map((decision: any) => (
                    <div
                      key={decision.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border"
                    >
                      <Gavel className="w-4 h-4 text-accent" />
                      <span className="flex-1 text-sm">{decision.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(decision.decision_date), "dd/MM/yy", { locale: he })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="files" className="mt-0 h-full">
              <FileDropZone entityType="project" entityId={project.id} />
              
              {docsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : documents.length > 0 && (
                <div className="mt-4 space-y-2">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border"
                    >
                      <Paperclip className="w-4 h-4 text-muted-foreground" />
                      <span className="flex-1 text-sm truncate">{doc.file_name}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(doc.created_at), "dd/MM/yy", { locale: he })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>

        <TaskFormDialog
          open={taskFormOpen}
          onOpenChange={setTaskFormOpen}
          onSubmit={handleCreateTask}
          projectId={project?.id}
          isSubmitting={createTask.isPending}
        />
      </DialogContent>
    </Dialog>
  );
}
