import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { supabase } from "@/integrations/supabase/client";
import { 
  User, 
  Lock, 
  Bell, 
  Mail, 
  Palette, 
  Globe, 
  Loader2,
  Save,
  Shield,
  Eye,
  EyeOff
} from "lucide-react";
import { cn } from "@/lib/utils";

const roleLabels: Record<string, string> = {
  admin: 'מנהל מערכת',
  manager: 'מנהל',
  editor: 'עורך',
  viewer: 'צופה',
  ceo: 'מנכ"ל',
  team_member: 'חבר צוות',
};

const roleBadgeClasses: Record<string, string> = {
  admin: 'bg-destructive/20 text-destructive border-destructive/30',
  manager: 'bg-warning/20 text-warning border-warning/30',
  editor: 'bg-primary/20 text-primary border-primary/30',
  viewer: 'bg-muted text-muted-foreground border-border',
  ceo: 'bg-accent/20 text-accent border-accent/30',
  team_member: 'bg-success/20 text-success border-success/30',
};

export default function ProfilePage() {
  const { user } = useAuth();
  const { role, isLoading: permissionsLoading } = usePermissions();
  const { preferences, isLoading: preferencesLoading, updatePreferences } = useUserPreferences();
  const { toast } = useToast();

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Preferences state (local until saved)
  const [localPrefs, setLocalPrefs] = useState({
    stay_logged_in: preferences?.stay_logged_in ?? false,
    email_notifications: preferences?.email_notifications ?? true,
    browser_notifications: preferences?.browser_notifications ?? false,
    theme: preferences?.theme ?? 'dark' as 'dark' | 'light' | 'system',
  });
  const [prefsChanged, setPrefsChanged] = useState(false);

  // Update local prefs when preferences load
  useEffect(() => {
    if (preferences && !preferencesLoading) {
      setLocalPrefs({
        stay_logged_in: preferences.stay_logged_in,
        email_notifications: preferences.email_notifications,
        browser_notifications: preferences.browser_notifications,
        theme: preferences.theme,
      });
    }
  }, [preferences, preferencesLoading]);

  const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "משתמש";
  const userEmail = user?.email || "";
  const userInitial = userName.charAt(0).toUpperCase();

  const handlePrefChange = (key: string, value: boolean | string) => {
    setLocalPrefs(prev => ({ ...prev, [key]: value }));
    setPrefsChanged(true);
  };

  const handleSavePreferences = async () => {
    try {
      await updatePreferences.mutateAsync(localPrefs);
      setPrefsChanged(false);
      toast({
        title: "ההעדפות נשמרו",
        description: "ההעדפות שלך עודכנו בהצלחה",
      });
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "לא ניתן לשמור את ההעדפות",
        variant: "destructive",
      });
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "שגיאה",
        description: "הסיסמאות אינן תואמות",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: "שגיאה",
        description: "הסיסמה חייבת להכיל לפחות 8 תווים",
        variant: "destructive",
      });
      return;
    }

    setPasswordLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast({
        title: "הסיסמה עודכנה",
        description: "הסיסמה שלך שונתה בהצלחה",
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast({
        title: "שגיאה",
        description: error.message || "לא ניתן לעדכן את הסיסמה",
        variant: "destructive",
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  const isLoading = permissionsLoading || preferencesLoading;

  if (isLoading) {
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
            <User className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">הפרופיל שלי</h1>
            <p className="text-sm text-muted-foreground">נהל את החשבון וההעדפות שלך</p>
          </div>
        </div>

        {/* User Info Card */}
        <div className="glass-card rounded-3xl p-8 space-y-6 slide-up-reveal">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center breathe-glow border-4 border-white/20">
              <span className="text-3xl font-bold text-primary-foreground">{userInitial}</span>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-foreground">{userName}</h2>
              <p className="text-muted-foreground">{userEmail}</p>
              <Badge className={cn("mt-2", roleBadgeClasses[role] || roleBadgeClasses.viewer)}>
                <Shield className="w-3 h-3 ml-1" />
                {roleLabels[role] || 'צופה'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Security Section */}
        <div className="glass-card rounded-3xl p-8 space-y-6 slide-up-reveal stagger-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-warning/10">
              <Lock className="w-5 h-5 text-warning" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">אבטחה</h3>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">סיסמה נוכחית</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showPasswords ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="הזן סיסמה נוכחית"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(!showPasswords)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">סיסמה חדשה</Label>
              <Input
                id="newPassword"
                type={showPasswords ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="לפחות 8 תווים"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">אישור סיסמה חדשה</Label>
              <Input
                id="confirmPassword"
                type={showPasswords ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="הזן שוב את הסיסמה החדשה"
              />
            </div>

            <Button 
              onClick={handlePasswordChange}
              disabled={passwordLoading || !newPassword || !confirmPassword}
              className="w-full sm:w-auto"
            >
              {passwordLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin ml-2" />
                  מעדכן...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 ml-2" />
                  עדכן סיסמה
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Preferences Section */}
        <div className="glass-card rounded-3xl p-8 space-y-6 slide-up-reveal stagger-3">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-accent/10">
              <Palette className="w-5 h-5 text-accent" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">העדפות</h3>
          </div>

          <div className="space-y-6">
            {/* Stay Logged In */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">הישאר מחובר</p>
                  <p className="text-sm text-muted-foreground">זכור אותי במכשיר זה</p>
                </div>
              </div>
              <Switch
                checked={localPrefs.stay_logged_in}
                onCheckedChange={(checked) => handlePrefChange('stay_logged_in', checked)}
              />
            </div>

            {/* Email Notifications */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">התראות אימייל</p>
                  <p className="text-sm text-muted-foreground">קבל עדכונים באימייל</p>
                </div>
              </div>
              <Switch
                checked={localPrefs.email_notifications}
                onCheckedChange={(checked) => handlePrefChange('email_notifications', checked)}
              />
            </div>

            {/* Browser Notifications */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">התראות דפדפן</p>
                  <p className="text-sm text-muted-foreground">קבל התראות בדפדפן</p>
                </div>
              </div>
              <Switch
                checked={localPrefs.browser_notifications}
                onCheckedChange={(checked) => handlePrefChange('browser_notifications', checked)}
              />
            </div>

            {/* Theme */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Palette className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">ערכת נושא</p>
                  <p className="text-sm text-muted-foreground">בחר את מראה המערכת</p>
                </div>
              </div>
              <Select
                value={localPrefs.theme}
                onValueChange={(value) => handlePrefChange('theme', value)}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dark">כהה</SelectItem>
                  <SelectItem value="light">בהיר</SelectItem>
                  <SelectItem value="system">מערכת</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {prefsChanged && (
              <Button 
                onClick={handleSavePreferences}
                disabled={updatePreferences.isPending}
                className="w-full sm:w-auto"
              >
                {updatePreferences.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin ml-2" />
                    שומר...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 ml-2" />
                    שמור העדפות
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
