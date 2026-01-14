import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export type ProjectStatus = "planning" | "active" | "on_hold" | "completed";
export type ProjectPriority = "low" | "medium" | "high";

export interface Project {
  id: string;
  title: string;
  description: string | null;
  status: ProjectStatus;
  priority: ProjectPriority;
  start_date: string | null;
  due_date: string | null;
  owner_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectInsert {
  title: string;
  description?: string | null;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  start_date?: string | null;
  due_date?: string | null;
  owner_id?: string | null;
}

export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as Project[];
    },
  });
}

export function useProject(id: string | null) {
  return useQuery({
    queryKey: ["projects", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data as Project | null;
    },
    enabled: !!id,
  });
}

export function useProjectTasks(projectId: string | null) {
  return useQuery({
    queryKey: ["projects", projectId, "tasks"],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
  });
}

export function useProjectDecisions(projectId: string | null) {
  return useQuery({
    queryKey: ["projects", projectId, "decisions"],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from("decisions")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (project: ProjectInsert) => {
      const { data, error } = await supabase
        .from("projects")
        .insert({ ...project, created_by: user?.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast({ title: "הפרויקט נוצר בהצלחה" });
    },
    onError: (error) => {
      toast({ title: "שגיאה ביצירת הפרויקט", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Project> & { id: string }) => {
      const { data, error } = await supabase
        .from("projects")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast({ title: "הפרויקט עודכן בהצלחה" });
    },
    onError: (error) => {
      toast({ title: "שגיאה בעדכון הפרויקט", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast({ title: "הפרויקט נמחק בהצלחה" });
    },
    onError: (error) => {
      toast({ title: "שגיאה במחיקת הפרויקט", description: error.message, variant: "destructive" });
    },
  });
}

export function useConvertTaskToProject() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ taskId, taskTitle, taskDescription }: { taskId: string; taskTitle: string; taskDescription?: string }) => {
      // Create project from task
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .insert({
          title: taskTitle,
          description: taskDescription || null,
          status: "planning",
          priority: "medium",
          created_by: user?.id,
        })
        .select()
        .single();

      if (projectError) throw projectError;

      // Link task to project
      const { error: taskError } = await supabase
        .from("tasks")
        .update({ project_id: project.id })
        .eq("id", taskId);

      if (taskError) throw taskError;

      return project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast({ title: "המשימה הומרה לפרויקט בהצלחה" });
    },
    onError: (error) => {
      toast({ title: "שגיאה בהמרת המשימה", description: error.message, variant: "destructive" });
    },
  });
}
