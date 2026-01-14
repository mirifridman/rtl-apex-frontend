import { Phone, Mail, MessageCircle, ClipboardList } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Employee } from "@/hooks/useEmployees";

interface EmployeeCardProps {
  employee: Employee;
  taskCount: number;
  onClick: () => void;
}

export function EmployeeCard({ employee, taskCount, onClick }: EmployeeCardProps) {
  const initials = employee.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

  return (
    <Card
      className={cn(
        "glass-card cursor-pointer transition-all duration-300",
        "hover:scale-[1.02] hover:glow-primary",
        !employee.isActive && "opacity-60"
      )}
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="relative">
            <Avatar className="w-14 h-14 border-2 border-primary/30">
              <AvatarImage src={employee.avatarUrl || undefined} alt={employee.name} />
              <AvatarFallback className="gradient-primary text-primary-foreground font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            {/* Active status indicator */}
            <div
              className={cn(
                "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background",
                employee.isActive ? "bg-green-500" : "bg-muted"
              )}
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-bold text-foreground truncate">{employee.name}</h3>
              {taskCount > 0 && (
                <Badge className="bg-primary/20 text-primary border border-primary/30 shrink-0">
                  <ClipboardList className="w-3 h-3 ml-1" />
                  {taskCount}
                </Badge>
              )}
            </div>
            
            {employee.role && (
              <p className="text-sm text-muted-foreground mt-0.5">{employee.role}</p>
            )}

            {/* Contact info */}
            <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
              {employee.phone && (
                <a
                  href={`tel:+${employee.phone}`}
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1 hover:text-primary transition-colors"
                >
                  <Phone className="w-3 h-3" />
                  <span dir="ltr">{formatPhoneDisplay(employee.phone)}</span>
                </a>
              )}
              {employee.email && (
                <a
                  href={`mailto:${employee.email}`}
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1 hover:text-primary transition-colors"
                >
                  <Mail className="w-3 h-3" />
                  <span className="truncate max-w-[120px]">{employee.email}</span>
                </a>
              )}
              {employee.telegramChatId && (
                <span className="flex items-center gap-1 text-accent">
                  <MessageCircle className="w-3 h-3" />
                  <span>טלגרם מחובר</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Status badge */}
        {!employee.isActive && (
          <Badge variant="secondary" className="mt-3 text-xs">
            לא פעיל
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}

function formatPhoneDisplay(phone: string): string {
  // Format: 972501234567 -> +972-50-123-4567
  if (phone.startsWith("972") && phone.length === 12) {
    return `+${phone.slice(0, 3)}-${phone.slice(3, 5)}-${phone.slice(5, 8)}-${phone.slice(8)}`;
  }
  return phone;
}
