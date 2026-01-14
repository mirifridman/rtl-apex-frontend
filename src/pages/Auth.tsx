import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { ClipboardList, Mail, Lock, User, Loader2, Sparkles } from "lucide-react";
import { z } from "zod";
import { cn } from "@/lib/utils";

const emailSchema = z.string().email("כתובת אימייל לא תקינה");
const passwordSchema = z.string().min(8, "הסיסמה חייבת להכיל לפחות 8 תווים");

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [errors, setErrors] = useState<{ 
    email?: string; 
    password?: string; 
    confirmPassword?: string;
    fullName?: string;
  }>({});
  
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  const validateForm = () => {
    const newErrors: { 
      email?: string; 
      password?: string; 
      confirmPassword?: string;
      fullName?: string;
    } = {};
    
    try {
      emailSchema.parse(email);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.email = e.errors[0].message;
      }
    }
    
    try {
      passwordSchema.parse(password);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.password = e.errors[0].message;
      }
    }
    
    if (!isLogin) {
      if (!fullName.trim()) {
        newErrors.fullName = "נא להזין שם מלא";
      }
      
      if (password !== confirmPassword) {
        newErrors.confirmPassword = "הסיסמאות אינן תואמות";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      if (isLogin) {
        const { error } = await signIn(email, password, rememberMe);
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast({
              title: "שגיאת התחברות",
              description: "אימייל או סיסמה שגויים",
              variant: "destructive",
            });
          } else if (error.message.includes("Email not confirmed")) {
            toast({
              title: "אימייל לא אומת",
              description: "נא לאמת את כתובת האימייל לפני ההתחברות",
              variant: "destructive",
            });
          } else {
            toast({
              title: "שגיאה",
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          navigate("/");
        }
      } else {
        const { error } = await signUp(email, password, fullName);
        if (error) {
          if (error.message.includes("User already registered")) {
            toast({
              title: "המשתמש כבר קיים",
              description: "כתובת האימייל כבר רשומה במערכת",
              variant: "destructive",
            });
          } else {
            toast({
              title: "שגיאה",
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "נרשמת בהצלחה!",
            description: "נשלח אליך מייל אימות. אנא אמת את המייל לפני ההתחברות.",
          });
          setIsLogin(true);
          setPassword("");
          setConfirmPassword("");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 hex-pattern opacity-30" />
        <div className="absolute top-[10%] left-[20%] w-2 h-2 rounded-full bg-primary/40 particle-float" />
        <div className="absolute top-[30%] right-[15%] w-3 h-3 rounded-full bg-accent/30 particle-float" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-[20%] left-[10%] w-2.5 h-2.5 rounded-full bg-success/35 particle-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[60%] right-[25%] w-2 h-2 rounded-full bg-warning/40 particle-float" style={{ animationDelay: '3s' }} />
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 relative">
        <div className={cn(
          "w-full max-w-md space-y-8",
          mounted ? "slide-up-reveal" : "opacity-0"
        )}>
          {/* Logo with glow effect */}
          <div className="text-center">
            <div className={cn(
              "w-20 h-20 rounded-3xl gradient-primary flex items-center justify-center mx-auto",
              "breathe-glow transition-all duration-500 hover:scale-110",
              mounted && "zoom-in-blur"
            )}>
              <ClipboardList className="w-10 h-10 text-primary-foreground" />
            </div>
            <h1 className={cn(
              "mt-6 text-3xl font-bold text-foreground",
              mounted && "animate-fade-in stagger-2"
            )}>
              {isLogin ? "ברוכים הבאים" : "הרשמה למערכת"}
            </h1>
            <p className={cn(
              "mt-2 text-muted-foreground",
              mounted && "animate-fade-in stagger-3"
            )}>
              {isLogin ? "התחבר למערכת ניהול המשימות" : "צור חשבון חדש להתחלת העבודה"}
            </p>
          </div>

          {/* Form with glass effect */}
          <form onSubmit={handleSubmit} className={cn(
            "space-y-5 p-8 rounded-3xl glass-card",
            mounted && "animate-fade-in stagger-4"
          )}>
            {!isLogin && (
              <div className="space-y-2 animate-fade-in">
                <Label htmlFor="fullName">שם מלא</Label>
                <div className="relative group">
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="הזן שם מלא"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pr-10 transition-all duration-300 focus:glow-primary"
                    disabled={loading}
                  />
                </div>
                {errors.fullName && (
                  <p className="text-sm text-destructive animate-fade-in">{errors.fullName}</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">אימייל</Label>
              <div className="relative group">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.co.il"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pr-10 transition-all duration-300 focus:glow-primary"
                  disabled={loading}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-destructive animate-fade-in">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">סיסמה</Label>
              <div className="relative group">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <Input
                  id="password"
                  type="password"
                  placeholder={isLogin ? "הזן סיסמה" : "לפחות 8 תווים"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10 transition-all duration-300 focus:glow-primary"
                  disabled={loading}
                />
              </div>
              {errors.password && (
                <p className="text-sm text-destructive animate-fade-in">{errors.password}</p>
              )}
            </div>

            {!isLogin && (
              <div className="space-y-2 animate-fade-in">
                <Label htmlFor="confirmPassword">אישור סיסמה</Label>
                <div className="relative group">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="הזן את הסיסמה שוב"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pr-10 transition-all duration-300 focus:glow-primary"
                    disabled={loading}
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive animate-fade-in">{errors.confirmPassword}</p>
                )}
              </div>
            )}

            {isLogin && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="rememberMe" 
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    className="transition-all duration-300"
                  />
                  <Label htmlFor="rememberMe" className="text-sm cursor-pointer">
                    זכור אותי
                  </Label>
                </div>
                <Link 
                  to="/forgot-password" 
                  className="text-sm text-primary hover:underline transition-all duration-300 hover:text-glow-primary"
                >
                  שכחתי סיסמה
                </Link>
              </div>
            )}

            <Button
              type="submit"
              className={cn(
                "w-full magnetic-btn relative overflow-hidden",
                "bg-gradient-to-r from-primary to-blue-500",
                "hover:from-primary/90 hover:to-blue-500/90",
                "transition-all duration-500"
              )}
              size="lg"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin ml-2" />
                  {isLogin ? "מתחבר..." : "נרשם..."}
                </>
              ) : (
                <>
                  {isLogin ? "התחבר" : "הירשם"}
                  <Sparkles className="w-4 h-4 mr-2 opacity-70" />
                </>
              )}
            </Button>
          </form>

          {/* Toggle */}
          <div className={cn(
            "text-center",
            mounted && "animate-fade-in stagger-5"
          )}>
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setErrors({});
                setPassword("");
                setConfirmPassword("");
              }}
              className="text-sm text-primary hover:underline transition-all duration-300 glitch-hover"
            >
              {isLogin ? "אין לך חשבון? הירשם עכשיו" : "כבר יש לך חשבון? התחבר"}
            </button>
          </div>
        </div>
      </div>

      {/* Left side - Decorative with enhanced animations */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-blue-600 to-primary morph-bg" />
        
        {/* Scan lines effect */}
        <div className="absolute inset-0 cyber-scanline opacity-30" />
        
        {/* Floating elements */}
        <div className="absolute top-[20%] left-[20%] w-4 h-4 rounded-full bg-white/20 particle-float" />
        <div className="absolute top-[40%] right-[30%] w-3 h-3 rounded-full bg-white/15 particle-float" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-[30%] left-[40%] w-5 h-5 rounded-full bg-white/10 particle-float" style={{ animationDelay: '4s' }} />
        
        {/* Content */}
        <div className="relative flex items-center justify-center p-12 w-full">
          <div className={cn(
            "max-w-lg text-center text-primary-foreground",
            mounted && "animate-fade-in"
          )}>
            <h2 className="text-4xl font-bold mb-4 text-glow-primary">משרד המנכ״ל</h2>
            <p className="text-xl opacity-90 leading-relaxed">
              מערכת ניהול משימות מתקדמת לניהול יעיל ומקצועי של כל המשימות במשרד
            </p>
            <div className="mt-12 grid grid-cols-2 gap-6 text-right">
              <div className={cn(
                "bg-primary-foreground/10 rounded-2xl p-6 backdrop-blur-sm",
                "transition-all duration-500 hover:bg-primary-foreground/20 hover:scale-105",
                "border border-white/10 float-3d",
                mounted && "animate-fade-in stagger-6"
              )}>
                <p className="text-3xl font-bold matrix-text">24/7</p>
                <p className="text-sm opacity-80 mt-1">גישה מכל מקום</p>
              </div>
              <div className={cn(
                "bg-primary-foreground/10 rounded-2xl p-6 backdrop-blur-sm",
                "transition-all duration-500 hover:bg-primary-foreground/20 hover:scale-105",
                "border border-white/10 float-3d",
                mounted && "animate-fade-in stagger-7"
              )}>
                <p className="text-3xl font-bold matrix-text">100%</p>
                <p className="text-sm opacity-80 mt-1">מאובטח</p>
              </div>
            </div>

            {/* Tech decoration lines */}
            <div className="mt-16 flex justify-center gap-1">
              {[...Array(5)].map((_, i) => (
                <div 
                  key={i}
                  className="w-8 h-1 bg-white/30 rounded-full"
                  style={{
                    animation: 'pulse-glow 2s ease-in-out infinite',
                    animationDelay: `${i * 0.2}s`
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Corner decorations */}
        <svg className="absolute top-8 left-8 w-24 h-24 text-white/10" viewBox="0 0 100 100">
          <path d="M0 0 L40 0 L40 10 L10 10 L10 40 L0 40 Z" fill="currentColor" />
        </svg>
        <svg className="absolute bottom-8 right-8 w-24 h-24 text-white/10" viewBox="0 0 100 100">
          <path d="M100 100 L60 100 L60 90 L90 90 L90 60 L100 60 Z" fill="currentColor" />
        </svg>
      </div>
    </div>
  );
}
