import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Employee {
  id: string;
  name: string;
  email: string | null;
  avatarUrl: string | null;
  userId: string | null;
  role: string | null;
  phone: string | null;
  telegramChatId: string | null;
  isActive: boolean;
}

export interface CreateEmployeeData {
  name: string;
  email?: string;
  role?: string;
  phone?: string;
  telegramChatId?: string;
  avatarUrl?: string;
}

export interface UpdateEmployeeData {
  name?: string;
  email?: string;
  role?: string;
  phone?: string;
  telegramChatId?: string;
  avatarUrl?: string;
  isActive?: boolean;
}

export function useEmployees() {
  return useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .order("name");

      if (error) throw error;

      return data.map((emp): Employee => ({
        id: emp.id,
        name: emp.name,
        email: emp.email,
        avatarUrl: emp.avatar_url,
        userId: emp.user_id,
        role: emp.role,
        phone: emp.phone,
        telegramChatId: emp.telegram_chat_id,
        isActive: emp.is_active,
      }));
    },
    enabled: true,
  });
}

export function useActiveEmployees() {
  return useQuery({
    queryKey: ["employees", "active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;

      return data.map((emp): Employee => ({
        id: emp.id,
        name: emp.name,
        email: emp.email,
        avatarUrl: emp.avatar_url,
        userId: emp.user_id,
        role: emp.role,
        phone: emp.phone,
        telegramChatId: emp.telegram_chat_id,
        isActive: emp.is_active,
      }));
    },
    enabled: true,
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateEmployeeData) => {
      const { data: employee, error } = await supabase
        .from("employees")
        .insert({
          name: data.name,
          email: data.email || null,
          role: data.role || null,
          phone: data.phone || null,
          telegram_chat_id: data.telegramChatId || null,
          avatar_url: data.avatarUrl || null,
        })
        .select()
        .single();

      if (error) throw error;
      return employee;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ employeeId, updates }: { employeeId: string; updates: UpdateEmployeeData }) => {
      const updateData: Record<string, unknown> = {};
      
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.email !== undefined) updateData.email = updates.email || null;
      if (updates.role !== undefined) updateData.role = updates.role || null;
      if (updates.phone !== undefined) updateData.phone = updates.phone || null;
      if (updates.telegramChatId !== undefined) updateData.telegram_chat_id = updates.telegramChatId || null;
      if (updates.avatarUrl !== undefined) updateData.avatar_url = updates.avatarUrl || null;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

      const { data: employee, error } = await supabase
        .from("employees")
        .update(updateData)
        .eq("id", employeeId)
        .select()
        .single();

      if (error) throw error;
      return employee;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (employeeId: string) => {
      const { error } = await supabase
        .from("employees")
        .delete()
        .eq("id", employeeId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });
}

export function useEmployeeTaskCount(employeeId: string) {
  return useQuery({
    queryKey: ["employee-task-count", employeeId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("task_assignees")
        .select("task_id, tasks!inner(status)", { count: "exact" })
        .eq("employee_id", employeeId)
        .neq("tasks.status", "done");

      if (error) throw error;
      return count || 0;
    },
    enabled: !!employeeId,
  });
}
