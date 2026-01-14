import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ClipboardList, Lock, Loader2, CheckCircle } from "lucide-react";
import { z } from "zod";

const passwordSchema = z.string().min(8, "הסיסמה חייבת להכיל לפחות 8 תווים");

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check if we have a valid session from the reset link
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "קישור לא תקין",
          description: "הקישור פג תוקף או לא תקין. נסה לבקש קישור חדש.",
          variant: "destructive",
        });
        navigate("/forgot-password");
      }
    };
    checkSession();
  }, [navigate, toast]);

  const validateForm = () => {
    const newErrors: { password?: string; confirmPassword?: string } = {};
    
    try {
      passwordSchema.parse(password);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.password = e.errors[0].message;
      }
    }
    
    if (password !== confirmPassword) {
      newErrors.confirmPassword = "הסיסמאות אינן תואמות";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });
      
      if (error) {
        toast({
          title: "שגיאה",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setSuccess(true);
        toast({
          title: "הסיסמה עודכנה",
          description: "הסיסמה שלך עודכנה בהצלחה",
        });
        
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          navigate("/");
        }, 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8 text-center">
          <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-success" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground">הסיסמה עודכנה בהצלחה!</h1>
          <p className="text-muted-foreground">
            מעביר אותך לדאשבורד...
          </p>
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
            הגדר סיסמה חדשה
          </h1>
          <p className="mt-2 text-muted-foreground">
            בחר סיסמה חזקה בעלת לפחות 8 תווים
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="password">סיסמה חדשה</Label>
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="הזן סיסמה חדשה"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10"
                disabled={loading}
              />
            </div>
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">אישור סיסמה</Label>
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type="password"
                placeholder="הזן את הסיסמה שוב"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pr-10"
                disabled={loading}
              />
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">{errors.confirmPassword}</p>
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
                מעדכן...
              </>
            ) : (
              "עדכן סיסמה"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
