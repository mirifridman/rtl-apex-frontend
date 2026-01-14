import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type DecisionStatus = "active" | "cancelled" | "replaced";

export interface Decision {
  id: string;
  title: string;
  description: string | null;
  decision_date: string;
  source_meeting: string | null;
  procedure_id: string | null;
  status: DecisionStatus;
  created_at: string;
  updated_at: string;
}

export interface DecisionInsert {
  title: string;
  description?: string | null;
  decision_date?: string;
  source_meeting?: string | null;
  procedure_id?: string | null;
  status?: DecisionStatus;
}

export function useDecisions(procedureId?: string | null) {
  return useQuery({
    queryKey: ["decisions", procedureId],
    queryFn: async () => {
      let query = supabase
        .from("decisions" as any)
        .select("*")
        .order("decision_date", { ascending: false });

      if (procedureId) {
        query = query.eq("procedure_id", procedureId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as Decision[];
    },
  });
}

export function useDecision(id: string | null) {
  return useQuery({
    queryKey: ["decisions", "single", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("decisions" as any)
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data as unknown as Decision | null;
    },
    enabled: !!id,
  });
}

export function useCreateDecision() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (decision: DecisionInsert) => {
      const { data, error } = await supabase
        .from("decisions" as any)
        .insert(decision as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["decisions"] });
      toast({ title: "ההחלטה נוצרה בהצלחה" });
    },
    onError: (error) => {
      toast({ title: "שגיאה ביצירת ההחלטה", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdateDecision() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Decision> & { id: string }) => {
      const { data, error } = await supabase
        .from("decisions" as any)
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["decisions"] });
      toast({ title: "ההחלטה עודכנה בהצלחה" });
    },
    onError: (error) => {
      toast({ title: "שגיאה בעדכון ההחלטה", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeleteDecision() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("decisions" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["decisions"] });
      toast({ title: "ההחלטה נמחקה בהצלחה" });
    },
    onError: (error) => {
      toast({ title: "שגיאה במחיקת ההחלטה", description: error.message, variant: "destructive" });
    },
  });
}
