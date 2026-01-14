import { FileText, Calendar, AlertTriangle, Edit, Trash2, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SecurityDocument, useDownloadSecurityDocument } from "@/hooks/useSecurityDocuments";
import { format, isPast } from "date-fns";
import { he } from "date-fns/locale";

interface SecurityDocumentCardProps {
  document: SecurityDocument;
  onEdit: () => void;
  onDelete: () => void;
}

const statusConfig = {
  draft: { label: "טיוטה", className: "bg-muted/50 text-muted-foreground border-muted" },
  active: { label: "פעיל", className: "bg-success/20 text-success border-success/30" },
  archived: { label: "בארכיון", className: "bg-secondary/50 text-secondary-foreground border-secondary" },
};

const categoryConfig = {
  policy: { label: "מדיניות", className: "bg-primary/20 text-primary border-primary/30" },
  procedure: { label: "נוהל", className: "bg-accent/20 text-accent border-accent/30" },
  form: { label: "טופס", className: "bg-warning/20 text-warning border-warning/30" },
  approval: { label: "אישור", className: "bg-success/20 text-success border-success/30" },
};

export function SecurityDocumentCard({ document, onEdit, onDelete }: SecurityDocumentCardProps) {
  const statusInfo = statusConfig[document.status];
  const categoryInfo = categoryConfig[document.category];
  const downloadDoc = useDownloadSecurityDocument();
  
  const needsReview = document.review_date && isPast(new Date(document.review_date));

  const handleDownload = () => {
    if (document.file_path) {
      downloadDoc.mutate({ 
        filePath: document.file_path, 
        fileName: `${document.title}.${document.file_path.split('.').pop()}` 
      });
    }
  };

  return (
    <div className="group flex items-center gap-4 p-4 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/40 hover:bg-card/80 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 animate-fade-in">
      {/* Icon */}
      <div className={cn(
        "p-2.5 rounded-xl shrink-0",
        needsReview ? "bg-destructive/20" : "bg-primary/10"
      )}>
        {needsReview ? (
          <AlertTriangle className="w-5 h-5 text-destructive" />
        ) : (
          <FileText className="w-5 h-5 text-primary" />
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
            {document.title}
          </h3>
          <Badge variant="outline" className={cn("text-xs shrink-0", categoryInfo.className)}>
            {categoryInfo.label}
          </Badge>
          <Badge variant="outline" className={cn("text-xs shrink-0", statusInfo.className)}>
            {statusInfo.label}
          </Badge>
          {document.version && (
            <Badge variant="outline" className="text-xs shrink-0">
              v{document.version}
            </Badge>
          )}
        </div>
        {document.description && (
          <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
            {document.description}
          </p>
        )}
      </div>

      {/* Meta Info */}
      <div className="hidden sm:flex items-center gap-4 text-sm text-muted-foreground shrink-0">
        {document.effective_date && (
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            <span className="whitespace-nowrap">
              {format(new Date(document.effective_date), "dd/MM/yy", { locale: he })}
            </span>
          </div>
        )}
        {needsReview && (
          <Badge variant="destructive" className="text-xs gap-1">
            <AlertTriangle className="w-3 h-3" />
            דורש עדכון
          </Badge>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        {document.file_path && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
            onClick={handleDownload}
            disabled={downloadDoc.isPending}
          >
            <Download className="w-4 h-4" />
          </Button>
        )}
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
