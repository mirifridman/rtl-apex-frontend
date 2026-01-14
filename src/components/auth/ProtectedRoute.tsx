import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  // ⛔ חשוב: כל עוד Supabase לא סיים – לא מפנים לשום מקום
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  // ⛔ רק אחרי ש-loading נגמר – בודקים user
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}
