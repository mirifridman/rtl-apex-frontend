import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TaskNote {
  id: string;
  taskId: string;
  content: string;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

interface TaskNoteFromDB {
  id: string;
  task_id: string;
  content: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

function mapNoteFromDB(note: TaskNoteFromDB): TaskNote {
  return {
    id: note.id,
    taskId: note.task_id,
    content: note.content,
    createdBy: note.created_by,
    createdAt: note.created_at,
    updatedAt: note.updated_at,
  };
}

export function useTaskNotes(taskId: string | null) {
  return useQuery({
    queryKey: ["task-notes", taskId],
    queryFn: async () => {
      if (!taskId) return [];
      
      const { data, error } = await supabase
        .from("task_notes")
        .select("*")
        .eq("task_id", taskId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data as TaskNoteFromDB[]).map(mapNoteFromDB);
    },
    enabled: !!taskId,
  });
}

export function useAddTaskNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, content }: { taskId: string; content: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("task_notes")
        .insert({
          task_id: taskId,
          content,
          created_by: user?.id || null,
        })
        .select()
        .single();

      if (error) throw error;
      return mapNoteFromDB(data as TaskNoteFromDB);
    },
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: ["task-notes", taskId] });
    },
  });
}

export function useDeleteTaskNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ noteId, taskId }: { noteId: string; taskId: string }) => {
      const { error } = await supabase
        .from("task_notes")
        .delete()
        .eq("id", noteId);

      if (error) throw error;
      return { noteId, taskId };
    },
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: ["task-notes", taskId] });
    },
  });
}
