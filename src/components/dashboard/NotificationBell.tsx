import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";

interface NotificationBellProps {
  count: number;
  className?: string;
  onClick?: () => void;
}

export function NotificationBell({ count, className, onClick }: NotificationBellProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative p-3 rounded-2xl glass-card border border-white/10",
        "hover:border-primary/50 hover:glow-primary transition-all duration-300",
        "group",
        className
      )}
    >
      <Bell className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
      
      {count > 0 && (
        <span className="absolute -top-1 -left-1 min-w-[20px] h-5 px-1.5 rounded-full gradient-destructive text-xs font-bold text-white flex items-center justify-center animate-pulse-soft">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}
