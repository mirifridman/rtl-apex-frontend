import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/usePermissions";
import { usePermissionSettings, PermissionKey } from "@/hooks/usePermissionSettings";
import { useNavigate } from "react-router-dom";
import { 
  Shield, 
  Loader2,
  Save,
  RotateCcw,
  AlertTriangle,
  ClipboardList,
  FolderKanban,
  Users,
  FileText,
  Gavel,
  Lock,
  UserCog,
  Key
} from "lucide-react";
import { cn } from "@/lib/utils";

const roleLabels: Record<string, string> = {
  ceo: 'מנכ"ל',
  admin: 'מנהל מערכת',
  manager: 'מנהל',
  editor: 'עורך',
  team_member: 'חבר צוות',
  viewer: 'צופה',
};

interface PermissionGroup {
  title: string;
  icon: React.ElementType;
  permissions: {
    key: PermissionKey;
    label: string;
  }[];
}

const permissionGroups: PermissionGroup[] = [
  {
    title: 'משימות',
    icon: ClipboardList,
    permissions: [
      { key: 'can_view_tasks', label: 'צפייה' },
      { key: 'can_create_tasks', label: 'יצירה' },
      { key: 'can_edit_tasks', label: 'עריכה' },
      { key: 'can_delete_tasks', label: 'מחיקה' },
    ],
  },
  {
    title: 'פרויקטים',
    icon: FolderKanban,
    permissions: [
      { key: 'can_view_projects', label: 'צפייה' },
      { key: 'can_create_projects', label: 'יצירה' },
      { key: 'can_edit_projects', label: 'עריכה' },
      { key: 'can_delete_projects', label: 'מחיקה' },
    ],
  },
  {
    title: 'צוות',
    icon: Users,
    permissions: [
      { key: 'can_view_team', label: 'צפייה' },
      { key: 'can_manage_team', label: 'ניהול' },
    ],
  },
  {
    title: 'נהלים',
    icon: FileText,
    permissions: [
      { key: 'can_view_procedures', label: 'צפייה' },
      { key: 'can_manage_procedures', label: 'ניהול' },
    ],
  },
  {
    title: 'החלטות',
    icon: Gavel,
    permissions: [
      { key: 'can_view_decisions', label: 'צפייה' },
      { key: 'can_manage_decisions', label: 'ניהול' },
    ],
  },
  {
    title: 'מסמכי אבטחה',
    icon: Lock,
    permissions: [
      { key: 'can_view_security_docs', label: 'צפייה' },
      { key: 'can_manage_security_docs', label: 'ניהול' },
    ],
  },
  {
    title: 'ניהול משתמשים',
    icon: UserCog,
    permissions: [
      { key: 'can_manage_users', label: 'ניהול משתמשים' },
    ],
  },
  {
    title: 'ניהול הרשאות',
    icon: Key,
    permissions: [
      { key: 'can_manage_permissions', label: 'ניהול הרשאות' },
    ],
  },
];

export default function PermissionsPage() {
  const { canManagePermissions, isLoading: permissionsLoading } = usePermissions();
  const { 
    getPermissionsForRole, 
    updatePermissions, 
    resetToDefault,
    defaultPermissionsByRole,
    isLoading: settingsLoading 
  } = usePermissionSettings();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState<string>('viewer');
  const [localPermissions, setLocalPermissions] = useState<Record<string, boolean>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Redirect if user doesn't have permission
  useEffect(() => {
    if (!permissionsLoading && !canManagePermissions) {
      toast({
        title: "אין הרשאה",
        description: "אין לך הרשאה לצפות בדף זה",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [canManagePermissions, permissionsLoading, navigate, toast]);

  // Load permissions when role changes
  useEffect(() => {
    const perms = getPermissionsForRole(selectedRole);
    if (perms) {
      const permObject: Record<string, boolean> = {};
      permissionGroups.forEach(group => {
        group.permissions.forEach(p => {
          permObject[p.key] = (perms as any)[p.key] ?? false;
        });
      });
      setLocalPermissions(permObject);
      setHasChanges(false);
    }
  }, [selectedRole, getPermissionsForRole]);

  const handlePermissionChange = (key: string, checked: boolean) => {
    setLocalPermissions(prev => ({ ...prev, [key]: checked }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      await updatePermissions.mutateAsync({
        role: selectedRole,
        updates: localPermissions,
      });
      setHasChanges(false);
      toast({
        title: "ההרשאות נשמרו",
        description: `ההרשאות עבור ${roleLabels[selectedRole]} עודכנו בהצלחה`,
      });
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "לא ניתן לשמור את ההרשאות",
        variant: "destructive",
      });
    }
  };

  const handleReset = async () => {
    try {
      await resetToDefault.mutateAsync(selectedRole);
      // Reload permissions from defaults
      const defaults = defaultPermissionsByRole[selectedRole];
      if (defaults) {
        setLocalPermissions(defaults as Record<string, boolean>);
      }
      setHasChanges(false);
      toast({
        title: "ההרשאות אופסו",
        description: `ההרשאות עבור ${roleLabels[selectedRole]} אופסו לברירת המחדל`,
      });
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "לא ניתן לאפס את ההרשאות",
        variant: "destructive",
      });
    }
  };

  const isLoading = permissionsLoading || settingsLoading;

  if (isLoading || !canManagePermissions) {
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
      <div className="max-w-4xl mx-auto space-y-8 p-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">ניהול הרשאות</h1>
            <p className="text-sm text-muted-foreground">הגדר הרשאות לכל תפקיד במערכת</p>
          </div>
        </div>

        {/* Role Selection */}
        <div className="glass-card rounded-3xl p-6 slide-up-reveal">
          <Label className="text-base font-medium mb-3 block">בחר תפקיד</Label>
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger className="w-full max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(roleLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Warning Alert */}
        <Alert className="border-warning/50 bg-warning/10 slide-up-reveal stagger-2">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <AlertTitle className="text-warning">שים לב</AlertTitle>
          <AlertDescription className="text-warning/80">
            שינויים בהרשאות ישפיעו על כל המשתמשים בעלי תפקיד "{roleLabels[selectedRole]}".
          </AlertDescription>
        </Alert>

        {/* Permissions Grid */}
        <div className="grid gap-6 md:grid-cols-2 slide-up-reveal stagger-3">
          {permissionGroups.map((group) => (
            <div key={group.title} className="glass-card rounded-2xl p-6 space-y-4 float-3d">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <group.icon className="w-4 h-4 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">{group.title}</h3>
              </div>
              
              <div className="space-y-3">
                {group.permissions.map((perm) => (
                  <div key={perm.key} className="flex items-center gap-3">
                    <Checkbox
                      id={perm.key}
                      checked={localPermissions[perm.key] ?? false}
                      onCheckedChange={(checked) => 
                        handlePermissionChange(perm.key, checked as boolean)
                      }
                    />
                    <Label 
                      htmlFor={perm.key}
                      className="text-sm cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {perm.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 justify-end slide-up-reveal stagger-4">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={resetToDefault.isPending}
          >
            {resetToDefault.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin ml-2" />
            ) : (
              <RotateCcw className="w-4 h-4 ml-2" />
            )}
            אפס לברירת מחדל
          </Button>
          
          <Button
            onClick={handleSave}
            disabled={!hasChanges || updatePermissions.isPending}
            className={cn(!hasChanges && "opacity-50")}
          >
            {updatePermissions.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin ml-2" />
            ) : (
              <Save className="w-4 h-4 ml-2" />
            )}
            שמור שינויים
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
