import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { usePermissionSettings } from "./usePermissionSettings";

export type UserRole = 'admin' | 'manager' | 'editor' | 'viewer' | 'ceo' | 'team_member';

interface Permissions {
  role: UserRole;
  isLoading: boolean;
  isAdmin: boolean;
  // Tasks
  canViewTasks: boolean;
  canCreateTasks: boolean;
  canEditTasks: boolean;
  canDeleteTasks: boolean;
  // Projects
  canViewProjects: boolean;
  canCreateProjects: boolean;
  canEditProjects: boolean;
  canDeleteProjects: boolean;
  // Team
  canViewTeam: boolean;
  canManageTeam: boolean;
  // Procedures
  canViewProcedures: boolean;
  canManageProcedures: boolean;
  // Decisions
  canViewDecisions: boolean;
  canManageDecisions: boolean;
  // Security Documents
  canViewSecurityDocs: boolean;
  canManageSecurityDocs: boolean;
  // User Management
  canManageUsers: boolean;
  canManagePermissions: boolean;
  // Legacy compatibility
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export function usePermissions(): Permissions {
  const { user } = useAuth();
  const { getPermissionsForRole, isLoading: permissionsLoading } = usePermissionSettings();

  const { data: roleData, isLoading: roleLoading } = useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async () => {
      if (!user?.id) return 'viewer';
      
      const { data, error } = await supabase
        .rpc('get_user_role', { _user_id: user.id });
      
      if (error) {
        console.error('Error fetching user role:', error);
        return 'viewer';
      }
      
      return (data as UserRole) || 'viewer';
    },
    enabled: !!user?.id,
  });

  const role = roleData || 'viewer';
  const isLoading = roleLoading || permissionsLoading;

  // Get permissions from permission_settings table
  const permissions = getPermissionsForRole(role);

  // Check if user is admin/ceo
  const isAdmin = role === 'admin' || role === 'ceo';

  // If we have custom permissions from the database, use them
  // Otherwise fall back to role-based defaults
  if (permissions) {
    return {
      role,
      isLoading,
      isAdmin,
      // Tasks
      canViewTasks: permissions.can_view_tasks ?? true,
      canCreateTasks: permissions.can_create_tasks ?? isAdmin,
      canEditTasks: permissions.can_edit_tasks ?? isAdmin,
      canDeleteTasks: permissions.can_delete_tasks ?? isAdmin,
      // Projects
      canViewProjects: permissions.can_view_projects ?? true,
      canCreateProjects: permissions.can_create_projects ?? isAdmin,
      canEditProjects: permissions.can_edit_projects ?? isAdmin,
      canDeleteProjects: permissions.can_delete_projects ?? isAdmin,
      // Team
      canViewTeam: permissions.can_view_team ?? true,
      canManageTeam: permissions.can_manage_team ?? isAdmin,
      // Procedures
      canViewProcedures: permissions.can_view_procedures ?? true,
      canManageProcedures: permissions.can_manage_procedures ?? isAdmin,
      // Decisions
      canViewDecisions: permissions.can_view_decisions ?? true,
      canManageDecisions: permissions.can_manage_decisions ?? isAdmin,
      // Security Documents
      canViewSecurityDocs: permissions.can_view_security_docs ?? isAdmin,
      canManageSecurityDocs: permissions.can_manage_security_docs ?? isAdmin,
      // User Management
      canManageUsers: permissions.can_manage_users ?? isAdmin,
      canManagePermissions: permissions.can_manage_permissions ?? isAdmin,
      // Legacy compatibility
      canCreate: permissions.can_create_tasks ?? isAdmin,
      canEdit: permissions.can_edit_tasks ?? isAdmin,
      canDelete: permissions.can_delete_tasks ?? isAdmin,
    };
  }

  // Fallback to role-based permissions
  const isManager = isAdmin || role === 'manager';
  const isEditor = isManager || role === 'editor';

  return {
    role,
    isLoading,
    isAdmin,
    // Tasks
    canViewTasks: true,
    canCreateTasks: isEditor,
    canEditTasks: isEditor,
    canDeleteTasks: isManager,
    // Projects
    canViewProjects: true,
    canCreateProjects: isEditor,
    canEditProjects: isEditor,
    canDeleteProjects: isManager,
    // Team
    canViewTeam: true,
    canManageTeam: isManager,
    // Procedures
    canViewProcedures: true,
    canManageProcedures: isManager,
    // Decisions
    canViewDecisions: true,
    canManageDecisions: isManager,
    // Security Documents
    canViewSecurityDocs: isManager,
    canManageSecurityDocs: isAdmin,
    // User Management
    canManageUsers: isAdmin,
    canManagePermissions: isAdmin,
    // Legacy compatibility
    canCreate: isEditor,
    canEdit: isEditor,
    canDelete: isManager,
  };
}
