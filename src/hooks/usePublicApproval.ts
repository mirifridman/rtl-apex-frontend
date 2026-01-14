import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PublicApprovalData {
  request_id: string;
  task_id: string;
  task_title: string;
  task_topic: string | null;
  task_description: string | null;
  task_priority: string;
  task_deadline: string | null;
  request_status: 'pending' | 'approved' | 'rejected' | 'expired';
  requested_by_name: string;
  requested_at: string;
  expires_at: string;
  message: string | null;
}

export function useApprovalByToken(token: string | null) {
  return useQuery({
    queryKey: ['approval-by-token', token],
    queryFn: async () => {
      if (!token) return null;

      const { data, error } = await supabase
        .rpc('get_approval_request_by_token', { p_token: token });

      if (error) {
        console.error('Error fetching approval by token:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error('Approval request not found');
      }

      return data[0] as PublicApprovalData;
    },
    enabled: !!token,
    retry: false,
  });
}

export function useRespondToApproval() {
  return useMutation({
    mutationFn: async ({
      token,
      approved,
      note,
    }: {
      token: string;
      approved: boolean;
      note?: string;
    }) => {
      const { data, error } = await supabase
        .rpc('approve_task_by_token', {
          p_token: token,
          p_approved: approved,
          p_note: note || null,
        });

      if (error) {
        console.error('Error responding to approval:', error);
        throw error;
      }

      const result = data as { success: boolean; error?: string; approved?: boolean; task_id?: string };
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to process approval');
      }

      return result;
    },
  });
}
