import { ReactNode } from "react";
import { CollapsibleSidebar } from "./CollapsibleSidebar";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: ReactNode;
  className?: string;
}

export function DashboardLayout({ children, className }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen w-full bg-background">
      <CollapsibleSidebar />
      <main className={cn(
        "min-h-screen",
        "pt-20", // Add top padding to account for the fixed sidebar toggle button
        className
      )}>
        {children}
      </main>
    </div>
  );
}
