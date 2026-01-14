import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export type EntityType = "task" | "decision" | "project";

export interface Document {
  id: string;
  file_name: string;
  file_path: string;
  file_type: string | null;
  file_size: number | null;
  entity_type: EntityType;
  entity_id: string;
  uploaded_by: string | null;
  created_at: string;
}

export function useDocuments(entityType: EntityType, entityId: string | null) {
  return useQuery({
    queryKey: ["documents", entityType, entityId],
    queryFn: async () => {
      if (!entityId) return [];
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("entity_type", entityType)
        .eq("entity_id", entityId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as Document[];
    },
    enabled: !!entityId,
  });
}

export function useDocumentCount(entityType: EntityType, entityId: string | null) {
  return useQuery({
    queryKey: ["documents", "count", entityType, entityId],
    queryFn: async () => {
      if (!entityId) return 0;
      const { count, error } = await supabase
        .from("documents")
        .select("*", { count: "exact", head: true })
        .eq("entity_type", entityType)
        .eq("entity_id", entityId);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!entityId,
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      file,
      entityType,
      entityId,
    }: {
      file: File;
      entityType: EntityType;
      entityId: string;
    }) => {
      // Upload file to storage
      const fileExt = file.name.split(".").pop();
      const filePath = `${user?.id}/${entityType}/${entityId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create document record
      const { data, error } = await supabase
        .from("documents")
        .insert({
          file_name: file.name,
          file_path: filePath,
          file_type: fileExt || null,
          file_size: file.size,
          entity_type: entityType,
          entity_id: entityId,
          uploaded_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["documents", variables.entityType, variables.entityId] });
      queryClient.invalidateQueries({ queryKey: ["documents", "count", variables.entityType, variables.entityId] });
      toast({ title: "הקובץ הועלה בהצלחה" });
    },
    onError: (error) => {
      toast({ title: "שגיאה בהעלאת הקובץ", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, filePath, entityType, entityId }: { id: string; filePath: string; entityType: EntityType; entityId: string }) => {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("documents")
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete record
      const { error } = await supabase.from("documents").delete().eq("id", id);
      if (error) throw error;

      return { entityType, entityId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["documents", data.entityType, data.entityId] });
      queryClient.invalidateQueries({ queryKey: ["documents", "count", data.entityType, data.entityId] });
      toast({ title: "הקובץ נמחק בהצלחה" });
    },
    onError: (error) => {
      toast({ title: "שגיאה במחיקת הקובץ", description: error.message, variant: "destructive" });
    },
  });
}

export function useDownloadDocument() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ filePath, fileName }: { filePath: string; fileName: string }) => {
      const { data, error } = await supabase.storage
        .from("documents")
        .download(filePath);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    onError: (error) => {
      toast({ title: "שגיאה בהורדת הקובץ", description: error.message, variant: "destructive" });
    },
  });
}
