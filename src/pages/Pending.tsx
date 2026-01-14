import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout";
import { PendingTasksList } from "@/components/tasks";
import { TaskEditDialog } from "@/components/tasks/TaskEditDialog";
import { useToast } from "@/hooks/use-toast";
import { usePendingTasks, useApproveTask, useUpdateTask, useDeleteTask } from "@/hooks/useTasks";
import { useActiveEmployees } from "@/hooks/useEmployees";
import { useToggleTaskAssignee } from "@/hooks/useTaskAssignees";
import { useConvertTaskToProject } from "@/hooks/useProjects";
import { TaskPriority, TaskData } from "@/components/tasks/PendingTaskCard";
import { Loader2 } from "lucide-react";

export default function PendingPage() {
  const navigate = useNavigate();
  const { data: pendingTasks = [], isLoading } = usePendingTasks();
  const { data: employees = [] } = useActiveEmployees();
  const approveTask = useApproveTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const toggleAssignee = useToggleTaskAssignee();
  const convertToProject = useConvertTaskToProject();
  const { toast } = useToast();

  const [editingTask, setEditingTask] = useState<TaskData | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

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

  const handleConvertToProject = (task: TaskData) => {
    convertToProject.mutate(
      { taskId: task.id, taskTitle: task.title, taskDescription: task.description },
      {
        onSuccess: () => {
          navigate("/projects");
        },
      }
    );
  };

  // Map employees to the expected format
  const mappedEmployees = employees.map(emp => ({
    id: emp.id,
    name: emp.name,
    email: emp.email,
    avatarUrl: emp.avatarUrl,
  }));

  return (
    <DashboardLayout>
      <div className="p-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <PendingTasksList
            tasks={pendingTasks}
            employees={mappedEmployees}
            onApprove={handleApprove}
            onEdit={handleEdit}
            onAssignToggle={handleAssignToggle}
            onPriorityChange={handlePriorityChange}
            onConvertToProject={handleConvertToProject}
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
