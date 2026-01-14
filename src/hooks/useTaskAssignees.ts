import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

async function updateTaskAssignedTo(taskId: string) {
  // Get the first assignee for the task to set as assigned_to
  const { data: assignees } = await supabase
    .from("task_assignees")
    .select("employee_id")
    .eq("task_id", taskId)
    .order("created_at", { ascending: true })
    .limit(1);

  const assignedTo = assignees && assignees.length > 0 ? assignees[0].employee_id : null;

  // Update the tasks table assigned_to column
  await supabase
    .from("tasks")
    .update({ assigned_to: assignedTo })
    .eq("id", taskId);
}

export function useToggleTaskAssignee() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ taskId, employeeId }: { taskId: string; employeeId: string }) => {
      // Check if assignment exists
      const { data: existing, error: checkError } = await supabase
        .from("task_assignees")
        .select("id")
        .eq("task_id", taskId)
        .eq("employee_id", employeeId)
        .maybeSingle();

      if (existing) {
        // Remove assignment
        const { error } = await supabase
          .from("task_assignees")
          .delete()
          .eq("task_id", taskId)
          .eq("employee_id", employeeId);
        
        if (error) throw error;
        
        // Update assigned_to in tasks table
        await updateTaskAssignedTo(taskId);
        
        return { action: "removed" };
      } else {
        // Add assignment
        const { error } = await supabase
          .from("task_assignees")
          .insert({ task_id: taskId, employee_id: employeeId });
        
        if (error) throw error;
        
        // Update assigned_to in tasks table
        await updateTaskAssignedTo(taskId);
        
        return { action: "added" };
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast({
        title: result.action === "added" ? "עובד שויך" : "שיוך הוסר",
        description: result.action === "added" 
          ? "העובד שויך למשימה בהצלחה" 
          : "השיוך הוסר בהצלחה",
      });
    },
    onError: () => {
      toast({
        title: "שגיאה",
        description: "לא ניתן לעדכן את השיוך",
        variant: "destructive",
      });
    },
  });
}
