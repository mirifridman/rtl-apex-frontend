import { Gavel, Edit, Trash2, Calendar, Users } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Decision } from "@/hooks/useDecisions";
import { Procedure } from "@/hooks/useProcedures";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { DocumentsPopover } from "@/components/documents";
import { useDocumentCount } from "@/hooks/useDocuments";

interface DecisionCardProps {
  decision: Decision;
  procedure?: Procedure | null;
  onEdit: () => void;
  onDelete: () => void;
}

const statusConfig = {
  active: { label: "פעילה", className: "bg-success/20 text-success border-success/30" },
  cancelled: { label: "בוטלה", className: "bg-destructive/20 text-destructive border-destructive/30" },
  replaced: { label: "הוחלפה", className: "bg-warning/20 text-warning border-warning/30" },
};

export function DecisionCard({ decision, procedure, onEdit, onDelete }: DecisionCardProps) {
  const statusInfo = statusConfig[decision.status];
  const { data: docCount = 0 } = useDocumentCount("decision", decision.id);

  return (
    <div className="group flex items-center gap-4 p-4 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/40 hover:bg-card/80 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 animate-fade-in">
      {/* Icon */}
      <div className="p-2.5 rounded-xl bg-accent/10 shrink-0">
        <Gavel className="w-5 h-5 text-accent" />
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
            {decision.title}
          </h3>
          <Badge variant="outline" className={cn("text-xs shrink-0", statusInfo.className)}>
            {statusInfo.label}
          </Badge>
          {procedure && (
            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30 shrink-0">
              {procedure.title}
            </Badge>
          )}
        </div>
        {decision.description && (
          <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
            {decision.description}
          </p>
        )}
      </div>

      {/* Meta Info */}
      <div className="hidden sm:flex items-center gap-4 text-sm text-muted-foreground shrink-0">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-4 h-4" />
          <span className="whitespace-nowrap">{format(new Date(decision.decision_date), "dd/MM/yyyy", { locale: he })}</span>
        </div>
        {decision.source_meeting && (
          <div className="flex items-center gap-1.5 max-w-[120px]">
            <Users className="w-4 h-4 shrink-0" />
            <span className="truncate">{decision.source_meeting}</span>
          </div>
        )}
        <DocumentsPopover entityType="decision" entityId={decision.id} count={docCount} />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
          onClick={onEdit}
        >
          <Edit className="w-4 h-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={onDelete}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
