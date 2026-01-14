import { FileText, Edit, Trash2, ChevronLeft, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Procedure } from "@/hooks/useProcedures";

interface ProcedureCardProps {
  procedure: Procedure;
  decisionsCount: number;
  onEdit: () => void;
  onDelete: () => void;
  onClick: () => void;
}

const statusConfig = {
  draft: { label: "טיוטה", className: "bg-muted/50 text-muted-foreground border-muted" },
  active: { label: "פעיל", className: "bg-success/20 text-success border-success/30" },
  cancelled: { label: "בוטל", className: "bg-destructive/20 text-destructive border-destructive/30" },
};

const categoryColors: Record<string, string> = {
  "כספים": "bg-amber-500/20 text-amber-400 border-amber-500/30",
  "משאבי אנוש": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "תפעול": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  "משפטי": "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "שיווק": "bg-pink-500/20 text-pink-400 border-pink-500/30",
};

export function ProcedureCard({ procedure, decisionsCount, onEdit, onDelete, onClick }: ProcedureCardProps) {
  const statusInfo = statusConfig[procedure.status];
  const categoryClass = procedure.category ? categoryColors[procedure.category] || "bg-secondary text-secondary-foreground" : null;

  return (
    <Card 
      className="glass-card hover:border-primary/30 transition-all duration-300 cursor-pointer group"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 glow-primary">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                {procedure.title}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className={cn("text-xs", statusInfo.className)}>
                  {statusInfo.label}
                </Badge>
                {categoryClass && (
                  <Badge variant="outline" className={cn("text-xs", categoryClass)}>
                    {procedure.category}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-muted-foreground hover:text-primary"
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {procedure.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
            {procedure.description}
          </p>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertCircle className="w-4 h-4" />
            <span>{decisionsCount} החלטות משויכות</span>
          </div>
          <ChevronLeft className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:-translate-x-1 transition-all" />
        </div>
      </CardContent>
    </Card>
  );
}
