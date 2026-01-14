import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PermissionSettings {
  id: string;
  role: string;
  can_view_tasks: boolean;
  can_create_tasks: boolean;
  can_edit_tasks: boolean;
  can_delete_tasks: boolean;
  can_view_projects: boolean;
  can_create_projects: boolean;
  can_edit_projects: boolean;
  can_delete_projects: boolean;
  can_view_team: boolean;
  can_manage_team: boolean;
  can_view_procedures: boolean;
  can_manage_procedures: boolean;
  can_view_decisions: boolean;
  can_manage_decisions: boolean;
  can_view_security_docs: boolean;
  can_manage_security_docs: boolean;
  can_manage_users: boolean;
  can_manage_permissions: boolean;
  created_at: string;
  updated_at: string;
}

export type PermissionKey = Exclude<keyof PermissionSettings, 'id' | 'role' | 'created_at' | 'updated_at'>;

export interface PermissionSettingsUpdate {
  [key: string]: boolean;
}

// Default permissions for each role
const defaultPermissionsByRole: Record<string, Partial<Record<PermissionKey, boolean>>> = {
  ceo: {
    can_view_tasks: true,
    can_create_tasks: true,
    can_edit_tasks: true,
    can_delete_tasks: true,
    can_view_projects: true,
    can_create_projects: true,
    can_edit_projects: true,
    can_delete_projects: true,
    can_view_team: true,
    can_manage_team: true,
    can_view_procedures: true,
    can_manage_procedures: true,
    can_view_decisions: true,
    can_manage_decisions: true,
    can_view_security_docs: true,
    can_manage_security_docs: true,
    can_manage_users: true,
    can_manage_permissions: true,
  },
  admin: {
    can_view_tasks: true,
    can_create_tasks: true,
    can_edit_tasks: true,
    can_delete_tasks: true,
    can_view_projects: true,
    can_create_projects: true,
    can_edit_projects: true,
    can_delete_projects: true,
    can_view_team: true,
    can_manage_team: true,
    can_view_procedures: true,
    can_manage_procedures: true,
    can_view_decisions: true,
    can_manage_decisions: true,
    can_view_security_docs: true,
    can_manage_security_docs: true,
    can_manage_users: true,
    can_manage_permissions: true,
  },
  manager: {
    can_view_tasks: true,
    can_create_tasks: true,
    can_edit_tasks: true,
    can_delete_tasks: true,
    can_view_projects: true,
    can_create_projects: true,
    can_edit_projects: true,
    can_delete_projects: false,
    can_view_team: true,
    can_manage_team: true,
    can_view_procedures: true,
    can_manage_procedures: true,
    can_view_decisions: true,
    can_manage_decisions: true,
    can_view_security_docs: true,
    can_manage_security_docs: false,
    can_manage_users: false,
    can_manage_permissions: false,
  },
  editor: {
    can_view_tasks: true,
    can_create_tasks: true,
    can_edit_tasks: true,
    can_delete_tasks: false,
    can_view_projects: true,
    can_create_projects: true,
    can_edit_projects: true,
    can_delete_projects: false,
    can_view_team: true,
    can_manage_team: false,
    can_view_procedures: true,
    can_manage_procedures: false,
    can_view_decisions: true,
    can_manage_decisions: false,
    can_view_security_docs: true,
    can_manage_security_docs: false,
    can_manage_users: false,
    can_manage_permissions: false,
  },
  team_member: {
    can_view_tasks: true,
    can_create_tasks: true,
    can_edit_tasks: true,
    can_delete_tasks: false,
    can_view_projects: true,
    can_create_projects: false,
    can_edit_projects: false,
    can_delete_projects: false,
    can_view_team: true,
    can_manage_team: false,
    can_view_procedures: true,
    can_manage_procedures: false,
    can_view_decisions: true,
    can_manage_decisions: false,
    can_view_security_docs: false,
    can_manage_security_docs: false,
    can_manage_users: false,
    can_manage_permissions: false,
  },
  viewer: {
    can_view_tasks: true,
    can_create_tasks: false,
    can_edit_tasks: false,
    can_delete_tasks: false,
    can_view_projects: true,
    can_create_projects: false,
    can_edit_projects: false,
    can_delete_projects: false,
    can_view_team: true,
    can_manage_team: false,
    can_view_procedures: true,
    can_manage_procedures: false,
    can_view_decisions: true,
    can_manage_decisions: false,
    can_view_security_docs: false,
    can_manage_security_docs: false,
    can_manage_users: false,
    can_manage_permissions: false,
  },
};

export function usePermissionSettings() {
  const queryClient = useQueryClient();

  const { data: allPermissions, isLoading: isLoadingAll } = useQuery({
    queryKey: ['permission-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('permission_settings')
        .select('*')
        .order('role');

      if (error) {
        console.error('Error fetching permission settings:', error);
        // Return default permissions if table doesn't exist
        return Object.entries(defaultPermissionsByRole).map(([role, perms]) => ({
          id: role,
          role,
          ...perms,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })) as PermissionSettings[];
      }

      return data as PermissionSettings[];
    },
  });

  const getPermissionsForRole = (role: string): PermissionSettings | null => {
    if (!allPermissions) {
      // Return defaults for the role
      const defaults = defaultPermissionsByRole[role];
      if (defaults) {
        return {
          id: role,
          role,
          ...defaults,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as PermissionSettings;
      }
      return null;
    }
    return allPermissions.find(p => p.role === role) || null;
  };

  const updatePermissions = useMutation({
    mutationFn: async ({ role, updates }: { role: string; updates: PermissionSettingsUpdate }) => {
      const { data, error } = await supabase
        .from('permission_settings')
        .upsert({
          role,
          ...updates,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'role',
        })
        .select()
        .single();

      if (error) {
        console.error('Error updating permissions:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permission-settings'] });
    },
  });

  const resetToDefault = useMutation({
    mutationFn: async (role: string) => {
      const defaults = defaultPermissionsByRole[role];
      if (!defaults) throw new Error(`No default permissions for role: ${role}`);

      const { data, error } = await supabase
        .from('permission_settings')
        .upsert({
          role,
          ...defaults,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'role',
        })
        .select()
        .single();

      if (error) {
        console.error('Error resetting permissions:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permission-settings'] });
    },
  });

  return {
    allPermissions: allPermissions || [],
    isLoading: isLoadingAll,
    getPermissionsForRole,
    updatePermissions,
    resetToDefault,
    defaultPermissionsByRole,
  };
}
