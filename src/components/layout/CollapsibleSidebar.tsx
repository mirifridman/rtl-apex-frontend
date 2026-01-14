import { useState, useEffect } from "react";
import { 
  ClipboardList, 
  Clock, 
  Users, 
  Settings, 
  LayoutDashboard,
  ChevronRight,
  LogOut,
  Sparkles,
  Menu,
  X,
  FileText,
  Gavel,
  Shield,
  FolderKanban,
  Lock,
  Zap,
  User,
  Key
} from "lucide-react";
import migdalLogo from "@/assets/migdal-logo.png";
import { NavLink } from "@/components/NavLink";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { usePendingTasks } from "@/hooks/useTasks";
import { usePermissions } from "@/hooks/usePermissions";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";

interface CollapsibleSidebarProps {
  className?: string;
}

const navItems = [
  { title: "סקירה כללית", href: "/", icon: LayoutDashboard, exact: true },
  { title: "ממתין לאישור", href: "/pending", icon: Clock, badge: true },
  { title: "משימות", href: "/tasks", icon: ClipboardList },
  { title: "פרויקטים", href: "/projects", icon: FolderKanban },
  { title: "נהלים", href: "/procedures", icon: FileText },
  { title: "החלטות", href: "/decisions", icon: Gavel },
  { title: "צוות", href: "/team", icon: Users },
  { title: "הגדרות", href: "/settings", icon: Settings },
];

const adminItems = [
  { title: "אבטחת מידע", href: "/security", icon: Lock },
  { title: "ניהול משתמשים", href: "/users", icon: Shield },
  { title: "ניהול הרשאות", href: "/permissions", icon: Key },
];

export function CollapsibleSidebar({ className }: CollapsibleSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { user, signOut } = useAuth();
  const { data: pendingTasks = [] } = usePendingTasks();
  const { canManageUsers, canManagePermissions, canViewSecurityDocs } = usePermissions();
  
  const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "משתמש";
  const userEmail = user?.email || "";
  const userInitial = userName.charAt(0);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
    }
  }, [isOpen]);

  // Filter admin items based on permissions
  const visibleAdminItems = adminItems.filter(item => {
    if (item.href === '/security') return canViewSecurityDocs;
    if (item.href === '/users') return canManageUsers;
    if (item.href === '/permissions') return canManagePermissions;
    return false;
  });

  return (
    <>
      {/* Overlay when sidebar is open */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-40 transition-all duration-500"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Toggle Button - Always visible on the right */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed top-4 right-4 z-50",
          "w-14 h-14 rounded-2xl",
          "glass-card flex items-center justify-center",
          "text-foreground hover:text-primary",
          "transition-all duration-500",
          "breathe-glow hover:scale-110 magnetic-btn",
          "border border-primary/20",
          isOpen && "opacity-0 pointer-events-none scale-90"
        )}
        aria-label={isOpen ? "סגור תפריט" : "פתח תפריט"}
      >
        <Menu className="w-6 h-6" />
        <Zap className="absolute -top-1 -right-1 w-4 h-4 text-primary animate-pulse" />
      </button>

      {/* Sidebar Panel */}
      <aside
        className={cn(
          "fixed top-0 right-0 h-full z-50",
          "w-80 glass-sidebar",
          "flex flex-col",
          "transition-all duration-500 ease-out",
          isOpen ? "translate-x-0" : "translate-x-full",
          className
        )}
      >
        {/* Decorative top line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] data-stream" />

        {/* Header with close button */}
        <div className={cn(
          "p-6 border-b border-border relative overflow-hidden",
          mounted && isOpen && "animate-fade-in"
        )}>
          {/* Holographic effect */}
          <div className="absolute inset-0 holo-shimmer opacity-50" />
          
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-14 h-14 rounded-2xl overflow-hidden flex items-center justify-center",
                "bg-white/10 border border-white/20",
                "transition-all duration-500 hover:scale-110",
                "breathe-glow"
              )}>
                <img src={migdalLogo} alt="מגדלור" className="w-12 h-12 object-contain" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-bold text-xl text-foreground">מטה מנכ״ל</h1>
                  <Sparkles className="w-5 h-5 text-accent electric-pulse" />
                </div>
                <p className="text-sm text-muted-foreground">מגדלור</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                "text-muted-foreground hover:text-foreground",
                "hover:bg-secondary transition-all duration-300",
                "hover:rotate-90 hover:scale-110"
              )}
              aria-label="סגור תפריט"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item, index) => (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.exact}
              onClick={() => setIsOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-4 rounded-2xl",
                "text-muted-foreground hover:text-foreground",
                "hover:bg-secondary/80 transition-all duration-300",
                "group relative border border-transparent",
                "ripple-effect magnetic-btn",
                mounted && isOpen && "animate-fade-in",
                `stagger-${index + 1}`
              )}
              activeClassName="bg-primary/15 text-primary font-semibold glow-primary border-primary/30 neon-border"
            >
              <div className="relative">
                <item.icon className="w-5 h-5 shrink-0 transition-all duration-300 group-hover:scale-110" />
                <div className="absolute inset-0 bg-primary/20 rounded-full scale-0 group-hover:scale-150 opacity-0 group-hover:opacity-100 transition-all duration-500" />
              </div>
              <span className="flex-1 text-sm font-medium">{item.title}</span>
              {item.badge && pendingTasks.length > 0 && (
                <span className={cn(
                  "px-3 py-1.5 text-xs font-bold rounded-full",
                  "bg-warning/20 text-warning border border-warning/30",
                  "glow-warning animate-pulse-glow"
                )}>
                  {pendingTasks.length}
                </span>
              )}
              <ChevronRight className={cn(
                "w-4 h-4 opacity-0 translate-x-2",
                "group-hover:opacity-60 group-hover:translate-x-0",
                "transition-all duration-300"
              )} />
            </NavLink>
          ))}
          
          {/* Admin-only links */}
          {visibleAdminItems.length > 0 && (
            <>
              <div className="my-4 h-[1px] bg-gradient-to-r from-transparent via-border to-transparent" />
              <p className="px-4 text-xs font-semibold text-muted-foreground mb-2">ניהול</p>
              {visibleAdminItems.map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-4 rounded-2xl",
                    "text-muted-foreground hover:text-foreground",
                    "hover:bg-secondary/80 transition-all duration-300",
                    "group relative border border-transparent",
                    "ripple-effect magnetic-btn"
                  )}
                  activeClassName="bg-primary/15 text-primary font-semibold glow-primary border-primary/30 neon-border"
                >
                  <item.icon className="w-5 h-5 shrink-0 transition-all duration-300 group-hover:scale-110" />
                  <span className="flex-1 text-sm font-medium">{item.title}</span>
                  <ChevronRight className="w-4 h-4 opacity-0 translate-x-2 group-hover:opacity-60 group-hover:translate-x-0 transition-all duration-300" />
                </NavLink>
              ))}
            </>
          )}
        </nav>

        {/* User Section */}
        <div className={cn(
          "p-4 border-t border-border space-y-4",
          mounted && isOpen && "animate-fade-in stagger-8"
        )}>
          <div className="flex items-center justify-between px-2">
            <ThemeToggle />
          </div>
          
          {/* Profile Link */}
          <NavLink
            to="/profile"
            onClick={() => setIsOpen(false)}
            className={cn(
              "flex items-center gap-3 px-4 py-4 rounded-2xl glass-card",
              "border border-white/10 transition-all duration-300",
              "hover:border-primary/30 float-3d group"
            )}
            activeClassName="border-primary/30 glow-primary"
          >
            <div className={cn(
              "w-12 h-12 rounded-full gradient-primary flex items-center justify-center",
              "breathe-glow border-2 border-white/20 transition-transform duration-300",
              "group-hover:scale-105"
            )}>
              <span className="text-lg font-bold text-primary-foreground">{userInitial}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{userName}</p>
              <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
            </div>
            <User className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </NavLink>
          
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "w-full justify-start rounded-xl",
              "text-muted-foreground hover:text-destructive hover:bg-destructive/10",
              "transition-all duration-300 magnetic-btn"
            )}
            onClick={signOut}
          >
            <LogOut className="w-4 h-4 ml-2" />
            התנתק
          </Button>
        </div>

        {/* Decorative bottom line */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      </aside>
    </>
  );
}
