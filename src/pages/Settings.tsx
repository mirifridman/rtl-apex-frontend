import { DashboardLayout } from "@/components/layout";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <Settings className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">הגדרות</h2>
        <p className="text-muted-foreground text-center max-w-md">
          כאן תוכל להגדיר את המערכת לפי הצרכים שלך. בקרוב...
        </p>
      </div>
    </DashboardLayout>
  );
}
