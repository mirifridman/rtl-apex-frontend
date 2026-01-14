import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export type SecurityDocumentStatus = "draft" | "active" | "archived";
export type SecurityDocumentCategory = "policy" | "procedure" | "form" | "approval";

export interface SecurityDocument {
  id: string;
  title: string;
  description: string | null;
  category: SecurityDocumentCategory;
  file_path: string | null;
  version: string | null;
  effective_date: string | null;
  review_date: string | null;
  status: SecurityDocumentStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SecurityDocumentInsert {
  title: string;
  description?: string | null;
  category?: SecurityDocumentCategory;
  file_path?: string | null;
  version?: string | null;
  effective_date?: string | null;
  review_date?: string | null;
  status?: SecurityDocumentStatus;
}

export function useSecurityDocuments(category?: SecurityDocumentCategory) {
  return useQuery({
    queryKey: ["securityDocuments", category],
    queryFn: async () => {
      let query = supabase
        .from("security_documents")
        .select("*")
        .order("created_at", { ascending: false });

      if (category) {
        query = query.eq("category", category);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as SecurityDocument[];
    },
  });
}

export function useSecurityDocument(id: string | null) {
  return useQuery({
    queryKey: ["securityDocuments", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("security_documents")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data as SecurityDocument | null;
    },
    enabled: !!id,
  });
}

export function useCreateSecurityDocument() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ file, ...doc }: SecurityDocumentInsert & { file?: File }) => {
      let filePath = doc.file_path;

      // Upload file if provided
      if (file) {
        const fileExt = file.name.split(".").pop();
        filePath = `security/${user?.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("documents")
          .upload(filePath, file);

        if (uploadError) throw uploadError;
      }

      const { data, error } = await supabase
        .from("security_documents")
        .insert({ ...doc, file_path: filePath, created_by: user?.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["securityDocuments"] });
      toast({ title: "המסמך נוצר בהצלחה" });
    },
    onError: (error) => {
      toast({ title: "שגיאה ביצירת המסמך", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdateSecurityDocument() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, file, ...updates }: Partial<SecurityDocument> & { id: string; file?: File }) => {
      let filePath = updates.file_path;

      // Upload new file if provided
      if (file) {
        const fileExt = file.name.split(".").pop();
        filePath = `security/${user?.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("documents")
          .upload(filePath, file);

        if (uploadError) throw uploadError;
      }

      const { data, error } = await supabase
        .from("security_documents")
        .update({ ...updates, file_path: filePath })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["securityDocuments"] });
      toast({ title: "המסמך עודכן בהצלחה" });
    },
    onError: (error) => {
      toast({ title: "שגיאה בעדכון המסמך", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeleteSecurityDocument() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, filePath }: { id: string; filePath?: string | null }) => {
      // Delete file from storage if exists
      if (filePath) {
        await supabase.storage.from("documents").remove([filePath]);
      }

      const { error } = await supabase.from("security_documents").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["securityDocuments"] });
      toast({ title: "המסמך נמחק בהצלחה" });
    },
    onError: (error) => {
      toast({ title: "שגיאה במחיקת המסמך", description: error.message, variant: "destructive" });
    },
  });
}

export function useDownloadSecurityDocument() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ filePath, fileName }: { filePath: string; fileName: string }) => {
      const { data, error } = await supabase.storage
        .from("documents")
        .download(filePath);

      if (error) throw error;

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
