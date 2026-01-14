import { 
  ClipboardList, 
  Clock, 
  Users, 
  Settings, 
  LayoutDashboard,
  ChevronLeft,
  LogOut,
  Sparkles,
  Zap,
  FileText,
  Gavel
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { usePendingTasks } from "@/hooks/useTasks";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  className?: string;
}

const navItems = [
  { 
    title: "סקירה כללית", 
    href: "/", 
    icon: LayoutDashboard,
    exact: true
  },
  { 
    title: "ממתין לאישור", 
    href: "/pending", 
    icon: Clock,
    badge: true
  },
  { 
    title: "משימות", 
    href: "/tasks", 
    icon: ClipboardList 
  },
  { 
    title: "נהלים", 
    href: "/procedures", 
    icon: FileText 
  },
  { 
    title: "החלטות", 
    href: "/decisions", 
    icon: Gavel 
  },
  { 
    title: "צוות", 
    href: "/team", 
    icon: Users 
  },
  { 
    title: "הגדרות", 
    href: "/settings", 
    icon: Settings 
  },
];

export function AppSidebar({ className }: SidebarProps) {
  const { user, signOut } = useAuth();
  const { data: pendingTasks = [] } = usePendingTasks();
  
  const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "משתמש";
  const userEmail = user?.email || "";
  const userInitial = userName.charAt(0);

  return (
    <aside
      className={cn(
        "w-72 h-[calc(100vh-2rem)] glass-sidebar rounded-3xl",
        "flex flex-col sticky top-4",
        className
      )}
    >
      {/* Logo / Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center glow-primary">
            <Zap className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg text-foreground">משרד המנכ״ל</h1>
              <Sparkles className="w-4 h-4 text-accent" />
            </div>
            <p className="text-sm text-muted-foreground">ניהול משימות ונהלים</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.exact}
            className={cn(
              "flex items-center gap-3 px-4 py-3.5 rounded-2xl",
              "text-muted-foreground hover:text-foreground",
              "hover:bg-secondary transition-all duration-300",
              "group relative border border-transparent"
            )}
            activeClassName="bg-primary/15 text-primary font-semibold glow-primary border-primary/20"
          >
            <item.icon className="w-5 h-5 shrink-0" />
            <span className="flex-1 text-sm">{item.title}</span>
            {item.badge && pendingTasks.length > 0 && (
              <span className="px-2.5 py-1 text-xs font-bold bg-warning/20 text-warning rounded-full glow-warning border border-warning/30">
                {pendingTasks.length}
              </span>
            )}
            <ChevronLeft className="w-4 h-4 opacity-0 translate-x-2 group-hover:opacity-60 group-hover:translate-x-0 transition-all duration-300" />
          </NavLink>
        ))}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-border space-y-3">
        <div className="flex items-center gap-3 px-4 py-4 rounded-2xl glass-card">
          <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center glow-primary">
            <span className="text-sm font-bold text-primary-foreground">{userInitial}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{userName}</p>
            <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl"
          onClick={signOut}
        >
          <LogOut className="w-4 h-4 ml-2" />
          התנתק
        </Button>
      </div>
    </aside>
  );
}
