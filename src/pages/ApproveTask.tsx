import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useApprovalByToken, useRespondToApproval } from "@/hooks/usePublicApproval";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Calendar, 
  AlertTriangle,
  Clock,
  User,
  FileText,
  LogIn
} from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { cn } from "@/lib/utils";
import migdalLogo from "@/assets/migdal-logo.png";

const priorityLabels: Record<string, string> = {
  low: "נמוכה",
  medium: "בינונית",
  high: "גבוהה",
  urgent: "דחוף",
};

const priorityStyles: Record<string, string> = {
  low: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  urgent: "bg-red-500/20 text-red-400 border-red-500/30",
};

export default function ApproveTaskPage() {
  const { token } = useParams<{ token: string }>();
  const [note, setNote] = useState("");
  const [responded, setResponded] = useState<'approved' | 'rejected' | null>(null);

  const { data: approval, isLoading, error } = useApprovalByToken(token || null);
  const respondMutation = useRespondToApproval();

  const handleApprove = async () => {
    if (!token) return;
    try {
      await respondMutation.mutateAsync({
        token,
        approved: true,
        note: note || undefined,
      });
      setResponded('approved');
    } catch (error) {
      console.error('Approval error:', error);
    }
  };

  const handleReject = async () => {
    if (!token) return;
    try {
      await respondMutation.mutateAsync({
        token,
        approved: false,
        note: note || undefined,
      });
      setResponded('rejected');
    } catch (error) {
      console.error('Rejection error:', error);
    }
  };

  // Check if expired
  const isExpired = approval && new Date(approval.expires_at) < new Date();
  const isAlreadyProcessed = approval && approval.request_status !== 'pending';

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">טוען את בקשת האישור...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !approval) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full glass-card rounded-3xl p-8 text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-destructive/20 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">בקשה לא נמצאה</h1>
          <p className="text-muted-foreground">
            הקישור אינו תקף או שהבקשה כבר טופלה.
          </p>
          <Link to="/auth">
            <Button className="w-full">
              <LogIn className="w-4 h-4 ml-2" />
              התחבר למערכת
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Expired state
  if (isExpired || approval.request_status === 'expired') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full glass-card rounded-3xl p-8 text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-warning/20 flex items-center justify-center">
            <Clock className="w-8 h-8 text-warning" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">פג תוקף הבקשה</h1>
          <p className="text-muted-foreground">
            תוקף בקשת האישור פג. נא ליצור קשר עם השולח כדי לקבל בקשה חדשה.
          </p>
          <Link to="/auth">
            <Button className="w-full">
              <LogIn className="w-4 h-4 ml-2" />
              התחבר למערכת
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Already processed state
  if (isAlreadyProcessed) {
    const wasApproved = approval.request_status === 'approved';
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full glass-card rounded-3xl p-8 text-center space-y-6">
          <div className={cn(
            "w-16 h-16 mx-auto rounded-full flex items-center justify-center",
            wasApproved ? "bg-success/20" : "bg-destructive/20"
          )}>
            {wasApproved ? (
              <CheckCircle className="w-8 h-8 text-success" />
            ) : (
              <XCircle className="w-8 h-8 text-destructive" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            {wasApproved ? "המשימה אושרה" : "המשימה נדחתה"}
          </h1>
          <p className="text-muted-foreground">
            בקשה זו כבר טופלה.
          </p>
          <Link to="/auth">
            <Button className="w-full">
              <LogIn className="w-4 h-4 ml-2" />
              התחבר למערכת
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Success state after responding
  if (responded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full glass-card rounded-3xl p-8 text-center space-y-6 animate-fade-in">
          <div className={cn(
            "w-20 h-20 mx-auto rounded-full flex items-center justify-center breathe-glow",
            responded === 'approved' ? "bg-success/20" : "bg-destructive/20"
          )}>
            {responded === 'approved' ? (
              <CheckCircle className="w-10 h-10 text-success" />
            ) : (
              <XCircle className="w-10 h-10 text-destructive" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            {responded === 'approved' ? "המשימה אושרה בהצלחה!" : "המשימה נדחתה"}
          </h1>
          <div className="space-y-2">
            <p className="text-lg font-medium text-foreground">{approval.task_title}</p>
            <p className="text-sm text-muted-foreground">
              {format(new Date(), "d בMMMM yyyy, HH:mm", { locale: he })}
            </p>
          </div>
          <Link to="/auth">
            <Button className="w-full gradient-primary text-primary-foreground">
              <LogIn className="w-4 h-4 ml-2" />
              התחבר למערכת
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Main approval form
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 hex-pattern opacity-30" />
        <div className="absolute top-[10%] left-[20%] w-2 h-2 rounded-full bg-primary/40 particle-float" />
        <div className="absolute top-[30%] right-[15%] w-3 h-3 rounded-full bg-accent/30 particle-float" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-[20%] left-[10%] w-2.5 h-2.5 rounded-full bg-success/35 particle-float" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative max-w-2xl mx-auto p-4 sm:p-8">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white/10 border border-white/20 flex items-center justify-center breathe-glow">
            <img src={migdalLogo} alt="מגדלור" className="w-12 h-12 object-contain" />
          </div>
        </div>

        {/* Main Card */}
        <div className="glass-card rounded-3xl p-8 space-y-8 slide-up-reveal">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-foreground">בקשת אישור משימה</h1>
            <p className="text-muted-foreground">
              נשלח על ידי <span className="text-foreground font-medium">{approval.requested_by_name}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              בתאריך {format(new Date(approval.requested_at), "d בMMMM yyyy, HH:mm", { locale: he })}
            </p>
          </div>

          {/* Task Details */}
          <div className="space-y-4 p-6 rounded-2xl bg-secondary/30 border border-border">
            {approval.task_topic && (
              <p className="text-xs font-semibold text-primary uppercase tracking-wide">
                {approval.task_topic}
              </p>
            )}
            
            <h2 className="text-xl font-bold text-foreground">{approval.task_title}</h2>
            
            {approval.task_description && (
              <p className="text-muted-foreground leading-relaxed">
                {approval.task_description}
              </p>
            )}

            <div className="flex flex-wrap gap-3 pt-2">
              <Badge className={cn("border", priorityStyles[approval.task_priority] || priorityStyles.medium)}>
                עדיפות: {priorityLabels[approval.task_priority] || "בינונית"}
              </Badge>
              
              {approval.task_deadline && (
                <Badge variant="outline" className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {format(new Date(approval.task_deadline), "d בMMMM yyyy", { locale: he })}
                </Badge>
              )}
            </div>
          </div>

          {/* Message from sender */}
          {approval.message && (
            <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
              <p className="text-sm text-primary font-medium mb-1">הודעה מהשולח:</p>
              <p className="text-foreground">"{approval.message}"</p>
            </div>
          )}

          {/* Note input */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">הערה (אופציונלי)</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="הוסף הערה לאישור או דחייה..."
              className="bg-secondary/50 min-h-[100px]"
            />
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              size="lg"
              className="h-14 text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={handleReject}
              disabled={respondMutation.isPending}
            >
              {respondMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <XCircle className="w-5 h-5 ml-2" />
                  דחה משימה
                </>
              )}
            </Button>
            
            <Button
              size="lg"
              className="h-14 gradient-success text-success-foreground glow-success"
              onClick={handleApprove}
              disabled={respondMutation.isPending}
            >
              {respondMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 ml-2" />
                  אשר משימה
                </>
              )}
            </Button>
          </div>

          {/* Expiry Note */}
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>
              תוקף הבקשה: {format(new Date(approval.expires_at), "d בMMMM yyyy, HH:mm", { locale: he })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
