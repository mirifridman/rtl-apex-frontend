import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface ApprovalRequest {
  id: string;
  task_id: string;
  token: string;
  requested_by: string;
  requested_from: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  message?: string;
  response_note?: string;
  responded_at?: string;
  expires_at: string;
  created_at: string;
  employee?: {
    id: string;
    name: string;
    email: string | null;
  };
  requester_profile?: {
    full_name: string;
  };
}

export function useApprovalRequests(taskId: string | null) {
  return useQuery({
    queryKey: ['approval-requests', taskId],
    queryFn: async () => {
      if (!taskId) return [];

      const { data, error } = await supabase
        .from('task_approval_requests')
        .select(`
          *,
          employee:employees!requested_from (
            id,
            name,
            email
          ),
          requester_profile:profiles!requested_by (
            full_name
          )
        `)
        .eq('task_id', taskId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching approval requests:', error);
        return [];
      }

      return data as ApprovalRequest[];
    },
    enabled: !!taskId,
  });
}

export function useSendApprovalRequest() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      taskId,
      employeeId,
      message,
    }: {
      taskId: string;
      employeeId: string;
      message?: string;
    }) => {
      if (!user) throw new Error('User not authenticated');

      // Generate unique token
      const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '').slice(0, 32);
      
      // Calculate expiry (7 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const { data, error } = await supabase
        .from('task_approval_requests')
        .insert({
          task_id: taskId,
          token,
          requested_by: user.id,
          requested_from: employeeId,
          message,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Get the magic link URL
      const magicLink = `${window.location.origin}/approve/${token}`;

      return {
        ...data,
        magicLink,
      };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['approval-requests', variables.taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useCancelApprovalRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase
        .from('task_approval_requests')
        .update({ status: 'expired' })
        .eq('id', requestId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-requests'] });
    },
  });
}

export function useDirectApproveTask() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      taskId,
      note,
    }: {
      taskId: string;
      note?: string;
    }) => {
      if (!user) throw new Error('User not authenticated');

      // Get employee ID for current user
      const { data: employee } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      const { error } = await supabase
        .from('tasks')
        .update({
          status: 'approved',
          approved_by: employee?.id || null,
          approved_at: new Date().toISOString(),
          approval_note: note,
        })
        .eq('id', taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['taskStats'] });
    },
  });
}
