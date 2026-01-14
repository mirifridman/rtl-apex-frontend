import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { TaskData, TaskStatus, TaskPriority, TaskAssignee } from "@/components/tasks";

interface TaskFromDB {
  id: string;
  title: string;
  topic: string | null;
  description: string | null;
  status: string;
  priority: string;
  deadline: string | null;
  assigned_to: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface TaskAssigneeFromDB {
  employee_id: string;
  employees: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
}

async function fetchTaskAssignees(taskIds: string[]): Promise<Map<string, TaskAssignee[]>> {
  if (taskIds.length === 0) return new Map();
  
  const { data, error } = await supabase
    .from("task_assignees")
    .select(`
      task_id,
      employee_id,
      employees (
        id,
        name,
        avatar_url
      )
    `)
    .in("task_id", taskIds);

  if (error) {
    console.error("Error fetching task assignees:", error);
    return new Map();
  }

  const assigneesMap = new Map<string, TaskAssignee[]>();
  data?.forEach((item: any) => {
    const taskId = item.task_id;
    const assignee: TaskAssignee = {
      id: item.employees.id,
      name: item.employees.name,
      avatarUrl: item.employees.avatar_url ?? undefined,
    };
    
    if (!assigneesMap.has(taskId)) {
      assigneesMap.set(taskId, []);
    }
    assigneesMap.get(taskId)!.push(assignee);
  });

  return assigneesMap;
}

function mapTaskFromDB(task: TaskFromDB, assignees: TaskAssignee[]): TaskData {
  return {
    id: task.id,
    title: task.title,
    topic: task.topic ?? undefined,
    description: task.description ?? undefined,
    status: task.status as TaskStatus,
    priority: task.priority as TaskPriority,
    deadline: task.deadline ?? undefined,
    assignees,
    createdAt: task.created_at,
  };
}

export function useTasks(status?: TaskStatus) {
  const queryClient = useQueryClient();

  // Real-time subscription for tasks
  useEffect(() => {
    const channel = supabase
      .channel('tasks-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["tasks"] });
          queryClient.invalidateQueries({ queryKey: ["taskStats"] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'task_assignees'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["tasks"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ["tasks", status],
    queryFn: async () => {
      let query = supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false });

      if (status) {
        query = query.eq("status", status);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching tasks:", error);
        throw error;
      }

      const taskIds = (data as TaskFromDB[]).map(t => t.id);
      const assigneesMap = await fetchTaskAssignees(taskIds);

      return (data as TaskFromDB[]).map(task => 
        mapTaskFromDB(task, assigneesMap.get(task.id) || [])
      );
    },
    enabled: true,
  });
}

export function usePendingTasks() {
  return useTasks("new");
}

export function useApproveTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, assignedTo }: { taskId: string; assignedTo?: string }) => {
      const updateData: { status: "approved" | "done" | "in_progress" | "new"; assigned_to?: string } = {
        status: "approved",
      };
      
      if (assignedTo) {
        updateData.assigned_to = assignedTo;
      }

      const { error } = await supabase
        .from("tasks")
        .update(updateData)
        .eq("id", taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["taskStats"] });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      taskId, 
      updates 
    }: { 
      taskId: string; 
      updates: Partial<{
        title: string;
        topic: string;
        description: string;
        priority: TaskPriority;
        deadline: string | null;
        assigned_to: string;
        status: TaskStatus;
      }>;
    }) => {
      const { error } = await supabase
        .from("tasks")
        .update(updates)
        .eq("id", taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["taskStats"] });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["taskStats"] });
    },
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (task: {
      title: string;
      topic?: string;
      description?: string;
      priority?: TaskPriority;
      deadline?: string | null;
      project_id?: string;
    }) => {
      const { data, error } = await supabase
        .from("tasks")
        .insert(task)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["taskStats"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useTaskStats() {
  return useQuery({
    queryKey: ["taskStats"],
    queryFn: async () => {
      const { data: tasks, error } = await supabase
        .from("tasks")
        .select("status, deadline");

      if (error) throw error;

      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const stats = {
        totalOpen: 0,
        overdue: 0,
        completedThisWeek: 0,
        pendingApproval: 0,
      };

      tasks?.forEach((task) => {
        if (task.status === "new") {
          stats.pendingApproval++;
          stats.totalOpen++;
        } else if (task.status === "approved" || task.status === "in_progress") {
          stats.totalOpen++;
        } else if (task.status === "done") {
          stats.completedThisWeek++;
        }

        if (task.deadline && task.status !== "done") {
          if (new Date(task.deadline) < now) {
            stats.overdue++;
          }
        }
      });

      return stats;
    },
    enabled: true,
  });
}
