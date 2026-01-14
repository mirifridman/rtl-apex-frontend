import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  Search, 
  Shield, 
  Loader2, 
  UserPlus, 
  MoreVertical,
  Eye,
  Trash2,
  UserCheck,
  UserX,
  CheckCircle,
  XCircle
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InviteUserDialog } from "@/components/users";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { usePermissions } from "@/hooks/usePermissions";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

type UserRole = 'admin' | 'manager' | 'editor' | 'viewer' | 'ceo' | 'team_member';

interface UserWithRole {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

const roleLabels: Record<UserRole, string> = {
  admin: 'מנהל מערכת',
  manager: 'מנהל',
  editor: 'עורך',
  viewer: 'צופה',
  ceo: 'מנכ"ל',
  team_member: 'חבר צוות',
};

const roleBadgeClasses: Record<UserRole, string> = {
  admin: 'bg-destructive/20 text-destructive border-destructive/30',
  manager: 'bg-warning/20 text-warning border-warning/30',
  editor: 'bg-primary/20 text-primary border-primary/30',
  viewer: 'bg-muted text-muted-foreground border-border',
  ceo: 'bg-accent/20 text-accent border-accent/30',
  team_member: 'bg-success/20 text-success border-success/30',
};

export default function UserManagementPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { canManageUsers, isLoading: permissionsLoading } = usePermissions();
  const navigate = useNavigate();

  // Redirect if user doesn't have permission
  useEffect(() => {
    if (!permissionsLoading && !canManageUsers) {
      toast({
        title: "אין הרשאה",
        description: "אין לך הרשאה לצפות בדף זה",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [canManageUsers, permissionsLoading, navigate, toast]);

  // Fetch users with their roles
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users-with-roles'],
    queryFn: async () => {
      // Get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, created_at')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Get roles for each user
      const usersWithRoles: UserWithRole[] = await Promise.all(
        profiles.map(async (profile) => {
          const { data: roleData } = await supabase
            .rpc('get_user_role', { _user_id: profile.id });

          // Try to get email - this might fail without admin access
          let email = 'לא זמין';
          try {
            // Get email from user_roles or other sources if available
            const { data: userData } = await supabase
              .from('employees')
              .select('email')
              .eq('user_id', profile.id)
              .maybeSingle();
            
            if (userData?.email) {
              email = userData.email;
            }
          } catch (e) {
            // Ignore email fetch errors
          }

          // Check if user is active (default to true if column doesn't exist)
          let isActive = true;
          try {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('is_active')
              .eq('id', profile.id)
              .maybeSingle();
            
            if (profileData && typeof (profileData as any).is_active === 'boolean') {
              isActive = (profileData as any).is_active;
            }
          } catch (e) {
            // Default to active if column doesn't exist
          }

          return {
            id: profile.id,
            full_name: profile.full_name,
            email,
            role: (roleData as UserRole) || 'viewer',
            is_active: isActive,
            created_at: profile.created_at,
          };
        })
      );

      return usersWithRoles;
    },
    enabled: canManageUsers,
  });

  // Update user role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: UserRole }) => {
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (existingRole) {
        const { error } = await supabase
          .from('user_roles')
          .update({ role: newRole })
          .eq('user_id', userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: newRole });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
      toast({
        title: "התפקיד עודכן",
        description: "תפקיד המשתמש עודכן בהצלחה",
      });
    },
    onError: (error) => {
      toast({
        title: "שגיאה",
        description: "לא ניתן לעדכן את התפקיד",
        variant: "destructive",
      });
      console.error('Error updating role:', error);
    },
  });

  // Toggle user status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: isActive } as any)
        .eq('id', userId);
      
      if (error) throw error;
    },
    onSuccess: (_, { isActive }) => {
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
      toast({
        title: isActive ? "המשתמש הופעל" : "המשתמש הושעה",
        description: isActive ? "המשתמש יכול כעת להתחבר למערכת" : "המשתמש לא יוכל להתחבר למערכת",
      });
    },
    onError: () => {
      toast({
        title: "שגיאה",
        description: "לא ניתן לעדכן את סטטוס המשתמש",
        variant: "destructive",
      });
    },
  });

  // Delete user mutation (remove from user_roles, doesn't delete auth user)
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      // Delete from user_roles
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);
      
      // Mark as inactive
      await supabase
        .from('profiles')
        .update({ is_active: false } as any)
        .eq('id', userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
      toast({
        title: "המשתמש הוסר",
        description: "המשתמש הוסר מהמערכת בהצלחה",
      });
      setDeleteDialogOpen(false);
      setSelectedUser(null);
    },
    onError: () => {
      toast({
        title: "שגיאה",
        description: "לא ניתן להסיר את המשתמש",
        variant: "destructive",
      });
    },
  });

  // Filter users
  const filteredUsers = users.filter((user) => {
    const matchesSearch = 
      user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && user.is_active) ||
      (statusFilter === "inactive" && !user.is_active);
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Stats
  const activeCount = users.filter(u => u.is_active).length;
  const inactiveCount = users.filter(u => !u.is_active).length;

  if (permissionsLoading || !canManageUsers) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">ניהול משתמשים</h1>
              <p className="text-sm text-muted-foreground">ניהול הרשאות ותפקידים</p>
            </div>
          </div>
          <Button onClick={() => setInviteDialogOpen(true)} className="magnetic-btn">
            <UserPlus className="w-4 h-4 ml-2" />
            הוסף משתמש
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="glass-card rounded-2xl p-4 text-center">
            <Users className="w-6 h-6 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold text-foreground">{users.length}</p>
            <p className="text-xs text-muted-foreground">סה״כ משתמשים</p>
          </div>
          <div className="glass-card rounded-2xl p-4 text-center">
            <UserCheck className="w-6 h-6 mx-auto mb-2 text-success" />
            <p className="text-2xl font-bold text-success">{activeCount}</p>
            <p className="text-xs text-muted-foreground">פעילים</p>
          </div>
          <div className="glass-card rounded-2xl p-4 text-center">
            <UserX className="w-6 h-6 mx-auto mb-2 text-destructive" />
            <p className="text-2xl font-bold text-destructive">{inactiveCount}</p>
            <p className="text-xs text-muted-foreground">מושעים</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="חיפוש לפי שם או אימייל..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="כל התפקידים" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל התפקידים</SelectItem>
              <SelectItem value="ceo">מנכ"ל</SelectItem>
              <SelectItem value="admin">מנהל מערכת</SelectItem>
              <SelectItem value="manager">מנהל</SelectItem>
              <SelectItem value="editor">עורך</SelectItem>
              <SelectItem value="team_member">חבר צוות</SelectItem>
              <SelectItem value="viewer">צופה</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="כל הסטטוסים" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל הסטטוסים</SelectItem>
              <SelectItem value="active">פעילים</SelectItem>
              <SelectItem value="inactive">מושעים</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Users Table */}
        <div className="glass-card rounded-2xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">שם</TableHead>
                <TableHead className="text-right">אימייל</TableHead>
                <TableHead className="text-right">תפקיד</TableHead>
                <TableHead className="text-right">סטטוס</TableHead>
                <TableHead className="text-right">תאריך הצטרפות</TableHead>
                <TableHead className="text-right w-[100px]">פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    לא נמצאו משתמשים
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id} className={cn(!user.is_active && "opacity-60")}>
                    <TableCell className="font-medium">{user.full_name}</TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell>
                      <Select
                        value={user.role}
                        onValueChange={(newRole) => 
                          updateRoleMutation.mutate({ userId: user.id, newRole: newRole as UserRole })
                        }
                        disabled={updateRoleMutation.isPending}
                      >
                        <SelectTrigger className="w-[130px] h-8">
                          <Badge className={cn("w-full justify-center", roleBadgeClasses[user.role])}>
                            {roleLabels[user.role]}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ceo">מנכ"ל</SelectItem>
                          <SelectItem value="admin">מנהל מערכת</SelectItem>
                          <SelectItem value="manager">מנהל</SelectItem>
                          <SelectItem value="editor">עורך</SelectItem>
                          <SelectItem value="team_member">חבר צוות</SelectItem>
                          <SelectItem value="viewer">צופה</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {user.is_active ? (
                          <CheckCircle className="w-4 h-4 text-success" />
                        ) : (
                          <XCircle className="w-4 h-4 text-destructive" />
                        )}
                        <span className={user.is_active ? "text-success" : "text-destructive"}>
                          {user.is_active ? "פעיל" : "מושעה"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(user.created_at), 'dd/MM/yyyy', { locale: he })}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setSelectedUser(user);
                            setDetailsDialogOpen(true);
                          }}>
                            <Eye className="w-4 h-4 ml-2" />
                            צפה בפרטים
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => 
                            toggleStatusMutation.mutate({ 
                              userId: user.id, 
                              isActive: !user.is_active 
                            })
                          }>
                            {user.is_active ? (
                              <>
                                <UserX className="w-4 h-4 ml-2" />
                                השעה משתמש
                              </>
                            ) : (
                              <>
                                <UserCheck className="w-4 h-4 ml-2" />
                                הפעל משתמש
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => {
                              setSelectedUser(user);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4 ml-2" />
                            מחק משתמש
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* User Details Dialog */}
        <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
          <DialogContent className="glass-card">
            <DialogHeader>
              <DialogTitle>פרטי משתמש</DialogTitle>
              <DialogDescription>מידע מפורט על המשתמש</DialogDescription>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center">
                    <span className="text-2xl font-bold text-primary-foreground">
                      {selectedUser.full_name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{selectedUser.full_name}</h3>
                    <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">תפקיד</p>
                    <Badge className={roleBadgeClasses[selectedUser.role]}>
                      {roleLabels[selectedUser.role]}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground">סטטוס</p>
                    <p className={selectedUser.is_active ? "text-success" : "text-destructive"}>
                      {selectedUser.is_active ? "פעיל" : "מושעה"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">תאריך הצטרפות</p>
                    <p>{format(new Date(selectedUser.created_at), 'dd/MM/yyyy HH:mm', { locale: he })}</p>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setDetailsDialogOpen(false)}>
                סגור
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>האם אתה בטוח?</AlertDialogTitle>
              <AlertDialogDescription>
                פעולה זו תסיר את המשתמש "{selectedUser?.full_name}" מהמערכת.
                לא ניתן לבטל פעולה זו.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>ביטול</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive hover:bg-destructive/90"
                onClick={() => selectedUser && deleteUserMutation.mutate(selectedUser.id)}
              >
                {deleteUserMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin ml-2" />
                ) : (
                  <Trash2 className="w-4 h-4 ml-2" />
                )}
                מחק
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Invite Dialog */}
        <InviteUserDialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen} />
      </div>
    </DashboardLayout>
  );
}
