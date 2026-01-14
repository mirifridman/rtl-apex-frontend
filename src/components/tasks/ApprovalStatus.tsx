import { format } from "date-fns";
import { he } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, Clock, AlertTriangle, Link2, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApprovalRequests, useCancelApprovalRequest } from "@/hooks/useApprovalRequests";
import { useToast } from "@/hooks/use-toast";

interface ApprovalStatusProps {
  taskId: string;
  approvedBy?: {
    id: string;
    name: string;
  } | null;
  approvedAt?: string | null;
  approvalNote?: string | null;
  className?: string;
}

const statusConfig = {
  pending: {
    label: "ממתין לאישור",
    icon: Clock,
    className: "bg-warning/20 text-warning border-warning/30",
  },
  approved: {
    label: "אושר",
    icon: CheckCircle,
    className: "bg-success/20 text-success border-success/30",
  },
  rejected: {
    label: "נדחה",
    icon: XCircle,
    className: "bg-destructive/20 text-destructive border-destructive/30",
  },
  expired: {
    label: "פג תוקף",
    icon: AlertTriangle,
    className: "bg-muted text-muted-foreground border-border",
  },
};

export function ApprovalStatus({
  taskId,
  approvedBy,
  approvedAt,
  approvalNote,
  className,
}: ApprovalStatusProps) {
  const { toast } = useToast();
  const { data: requests = [], isLoading } = useApprovalRequests(taskId);
  const cancelRequest = useCancelApprovalRequest();

  const pendingRequest = requests.find((r) => r.status === "pending");
  const latestRequest = requests[0];

  const copyMagicLink = (token: string) => {
    const link = `${window.location.origin}/approve/${token}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "הקישור הועתק",
      description: "קישור האישור הועתק ללוח",
    });
  };

  const handleCancel = async (requestId: string) => {
    try {
      await cancelRequest.mutateAsync(requestId);
      toast({
        title: "הבקשה בוטלה",
        description: "בקשת האישור בוטלה בהצלחה",
      });
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "לא ניתן לבטל את הבקשה",
        variant: "destructive",
      });
    }
  };

  // If task is already approved
  if (approvedBy && approvedAt) {
    return (
      <div className={cn("p-4 rounded-2xl bg-success/10 border border-success/20 space-y-2", className)}>
        <div className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-success" />
          <span className="font-semibold text-success">המשימה אושרה</span>
        </div>
        <div className="text-sm text-muted-foreground space-y-1">
          <p>אושר ע"י: <span className="text-foreground font-medium">{approvedBy.name}</span></p>
          <p>בתאריך: {format(new Date(approvedAt), "d בMMMM yyyy, HH:mm", { locale: he })}</p>
          {approvalNote && (
            <p className="mt-2 p-2 rounded-lg bg-background/50 text-foreground">
              "{approvalNote}"
            </p>
          )}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center p-4", className)}>
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // If there's a pending request
  if (pendingRequest) {
    const config = statusConfig.pending;
    const isExpired = new Date(pendingRequest.expires_at) < new Date();
    const expiresIn = Math.ceil(
      (new Date(pendingRequest.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    return (
      <div className={cn("p-4 rounded-2xl border space-y-3", isExpired ? "bg-muted/50 border-border" : "bg-warning/10 border-warning/20", className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <config.icon className={cn("w-5 h-5", isExpired ? "text-muted-foreground" : "text-warning")} />
            <span className={cn("font-semibold", isExpired ? "text-muted-foreground" : "text-warning")}>
              {isExpired ? "פג תוקף" : "ממתין לאישור"}
            </span>
          </div>
          <Badge variant="outline" className={config.className}>
            {isExpired ? "פג תוקף" : `${expiresIn} ימים נותרו`}
          </Badge>
        </div>

        <div className="text-sm text-muted-foreground space-y-1">
          <p>
            נשלח אל:{" "}
            <span className="text-foreground font-medium">
              {pendingRequest.employee?.name || "לא ידוע"}
            </span>
          </p>
          <p>
            נשלח בתאריך:{" "}
            {format(new Date(pendingRequest.created_at), "d בMMMM, HH:mm", { locale: he })}
          </p>
          {pendingRequest.message && (
            <p className="mt-2 p-2 rounded-lg bg-background/50 text-foreground text-xs">
              "{pendingRequest.message}"
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => copyMagicLink(pendingRequest.token)}
          >
            <Copy className="w-4 h-4 ml-1" />
            העתק קישור
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:bg-destructive/10"
            onClick={() => handleCancel(pendingRequest.id)}
            disabled={cancelRequest.isPending}
          >
            {cancelRequest.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "בטל"
            )}
          </Button>
        </div>
      </div>
    );
  }

  // If there's a recent completed request
  if (latestRequest && latestRequest.status !== "pending") {
    const config = statusConfig[latestRequest.status as keyof typeof statusConfig];
    const StatusIcon = config.icon;

    return (
      <div className={cn("p-4 rounded-2xl border space-y-2", className, config.className.replace("text-", "border-").split(" ")[0], "bg-opacity-10")}>
        <div className="flex items-center gap-2">
          <StatusIcon className="w-5 h-5" />
          <span className="font-semibold">{config.label}</span>
        </div>
        {latestRequest.employee && (
          <p className="text-sm text-muted-foreground">
            ע"י: {latestRequest.employee.name}
          </p>
        )}
        {latestRequest.responded_at && (
          <p className="text-sm text-muted-foreground">
            בתאריך: {format(new Date(latestRequest.responded_at), "d בMMMM, HH:mm", { locale: he })}
          </p>
        )}
        {latestRequest.response_note && (
          <p className="text-sm p-2 rounded-lg bg-background/50">
            "{latestRequest.response_note}"
          </p>
        )}
      </div>
    );
  }

  // No approval activity
  return (
    <div className={cn("p-4 rounded-2xl bg-muted/30 border border-border text-center", className)}>
      <p className="text-sm text-muted-foreground">לא נשלחה בקשת אישור</p>
    </div>
  );
}
