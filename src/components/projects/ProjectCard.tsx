import { FolderKanban, Calendar, User, Edit, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Project } from "@/hooks/useProjects";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { DocumentsPopover } from "@/components/documents";
import { useDocumentCount } from "@/hooks/useDocuments";
import { CircularProgress } from "@/components/ui/circular-progress";

interface ProjectCardProps {
  project: Project;
  progress?: number;
  onEdit: () => void;
  onDelete: () => void;
  onClick: () => void;
}

const statusConfig = {
  planning: { label: "תכנון", className: "bg-muted/50 text-muted-foreground border-muted" },
  active: { label: "פעיל", className: "bg-success/20 text-success border-success/30" },
  on_hold: { label: "מושהה", className: "bg-warning/20 text-warning border-warning/30" },
  completed: { label: "הושלם", className: "bg-primary/20 text-primary border-primary/30" },
};

const priorityConfig = {
  low: { label: "נמוכה", className: "priority-low" },
  medium: { label: "בינונית", className: "priority-medium" },
  high: { label: "גבוהה", className: "priority-high" },
};

export function ProjectCard({ project, progress = 0, onEdit, onDelete, onClick }: ProjectCardProps) {
  const statusInfo = statusConfig[project.status];
  const priorityInfo = priorityConfig[project.priority];
  const { data: docCount = 0 } = useDocumentCount("project", project.id);

  return (
    <div 
      onClick={onClick}
      className="group flex items-center gap-4 p-4 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/40 hover:bg-card/80 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 animate-fade-in cursor-pointer"
    >
      {/* Progress Circle */}
      <div className="shrink-0">
        <CircularProgress value={progress} size={56} strokeWidth={4}>
          <span className="text-xs font-bold">{progress}%</span>
        </CircularProgress>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
            {project.title}
          </h3>
          <Badge variant="outline" className={cn("text-xs shrink-0", statusInfo.className)}>
            {statusInfo.label}
          </Badge>
          <Badge variant="outline" className={cn("text-xs shrink-0", priorityInfo.className)}>
            {priorityInfo.label}
          </Badge>
        </div>
        {project.description && (
          <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
            {project.description}
          </p>
        )}
      </div>

      {/* Meta Info */}
      <div className="hidden sm:flex items-center gap-4 text-sm text-muted-foreground shrink-0">
        {project.start_date && (
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            <span className="whitespace-nowrap">
              {format(new Date(project.start_date), "dd/MM/yy", { locale: he })}
              {project.due_date && ` - ${format(new Date(project.due_date), "dd/MM/yy", { locale: he })}`}
            </span>
          </div>
        )}
        <DocumentsPopover entityType="project" entityId={project.id} count={docCount} />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
        >
          <Edit className="w-4 h-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
