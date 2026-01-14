import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type ProcedureStatus = "draft" | "active" | "cancelled";

export interface Procedure {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  status: ProcedureStatus;
  created_at: string;
  updated_at: string;
}

export interface ProcedureInsert {
  title: string;
  description?: string | null;
  category?: string | null;
  status?: ProcedureStatus;
}

export function useProcedures() {
  return useQuery({
    queryKey: ["procedures"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("procedures" as any)
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as Procedure[];
    },
  });
}

export function useProcedure(id: string | null) {
  return useQuery({
    queryKey: ["procedures", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("procedures" as any)
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data as unknown as Procedure | null;
    },
    enabled: !!id,
  });
}

export function useCreateProcedure() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (procedure: ProcedureInsert) => {
      const { data, error } = await supabase
        .from("procedures" as any)
        .insert(procedure as any)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as Procedure;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["procedures"] });
      toast({ title: "הנוהל נוצר בהצלחה" });
    },
    onError: (error) => {
      toast({ title: "שגיאה ביצירת הנוהל", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdateProcedure() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Procedure> & { id: string }) => {
      const { data, error } = await supabase
        .from("procedures" as any)
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["procedures"] });
      toast({ title: "הנוהל עודכן בהצלחה" });
    },
    onError: (error) => {
      toast({ title: "שגיאה בעדכון הנוהל", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeleteProcedure() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("procedures" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["procedures"] });
      toast({ title: "הנוהל נמחק בהצלחה" });
    },
    onError: (error) => {
      toast({ title: "שגיאה במחיקת הנוהל", description: error.message, variant: "destructive" });
    },
  });
}
