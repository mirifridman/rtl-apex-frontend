import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ClipboardList, Mail, Loader2, ArrowRight, CheckCircle } from "lucide-react";
import { z } from "zod";

const emailSchema = z.string().email("כתובת אימייל לא תקינה");

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      emailSchema.parse(email);
    } catch (e) {
      if (e instanceof z.ZodError) {
        setError(e.errors[0].message);
        return;
      }
    }
    
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) {
        toast({
          title: "שגיאה",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setSent(true);
        toast({
          title: "נשלח בהצלחה",
          description: "בדוק את תיבת הדואר שלך לקישור איפוס הסיסמה",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8 text-center">
          <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-success" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground">בדוק את המייל שלך</h1>
          <p className="text-muted-foreground">
            שלחנו לך קישור לאיפוס הסיסמה לכתובת {email}
          </p>
          <Link to="/auth">
            <Button variant="outline" className="mt-4">
              <ArrowRight className="w-4 h-4 ml-2" />
              חזור לדף ההתחברות
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto shadow-card">
            <ClipboardList className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="mt-6 text-2xl font-semibold text-foreground">
            שכחת סיסמה?
          </h1>
          <p className="mt-2 text-muted-foreground">
            הזן את כתובת האימייל שלך ונשלח לך קישור לאיפוס הסיסמה
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">אימייל</Label>
            <div className="relative">
              <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="name@company.co.il"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pr-10"
                disabled={loading}
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin ml-2" />
                שולח...
              </>
            ) : (
              "שלח קישור איפוס"
            )}
          </Button>
        </form>

        {/* Back to login */}
        <div className="text-center">
          <Link to="/auth" className="text-sm text-primary hover:underline inline-flex items-center gap-2">
            <ArrowRight className="w-4 h-4" />
            חזור לדף ההתחברות
          </Link>
        </div>
      </div>
    </div>
  );
}
