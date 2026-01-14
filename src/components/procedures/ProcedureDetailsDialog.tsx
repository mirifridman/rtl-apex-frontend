import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, Gavel } from "lucide-react";
import { Procedure } from "@/hooks/useProcedures";
import { Decision, useDecisions } from "@/hooks/useDecisions";
import { DecisionCard } from "@/components/decisions/DecisionCard";
import { cn } from "@/lib/utils";

interface ProcedureDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  procedure: Procedure | null;
  onAddDecision: () => void;
  onEditDecision: (decision: Decision) => void;
  onDeleteDecision: (decision: Decision) => void;
}

const statusConfig = {
  draft: { label: "טיוטה", className: "bg-muted/50 text-muted-foreground border-muted" },
  active: { label: "פעיל", className: "bg-success/20 text-success border-success/30" },
  cancelled: { label: "בוטל", className: "bg-destructive/20 text-destructive border-destructive/30" },
};

export function ProcedureDetailsDialog({ 
  open, 
  onOpenChange, 
  procedure,
  onAddDecision,
  onEditDecision,
  onDeleteDecision 
}: ProcedureDetailsDialogProps) {
  const { data: decisions = [] } = useDecisions(procedure?.id);

  if (!procedure) return null;

  const statusInfo = statusConfig[procedure.status];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-primary/10 glow-primary">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl mb-2">{procedure.title}</DialogTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={cn("text-xs", statusInfo.className)}>
                  {statusInfo.label}
                </Badge>
                {procedure.category && (
                  <Badge variant="outline" className="text-xs bg-secondary">
                    {procedure.category}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        {procedure.description && (
          <div className="mt-4 p-4 rounded-xl bg-secondary/30 border border-border">
            <p className="text-sm text-muted-foreground">{procedure.description}</p>
          </div>
        )}

        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Gavel className="w-5 h-5 text-accent" />
              <h3 className="font-semibold">החלטות משויכות</h3>
              <Badge variant="secondary" className="text-xs">{decisions.length}</Badge>
            </div>
            <Button onClick={onAddDecision} size="sm" className="gradient-primary">
              <Plus className="w-4 h-4 ml-1" />
              החלטה חדשה
            </Button>
          </div>

          {decisions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Gavel className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>אין עדיין החלטות משויכות לנוהל זה</p>
            </div>
          ) : (
            <div className="space-y-3">
              {decisions.map((decision) => (
                <DecisionCard
                  key={decision.id}
                  decision={decision}
                  onEdit={() => onEditDecision(decision)}
                  onDelete={() => onDeleteDecision(decision)}
                />
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
