import { useState, useMemo } from "react";
import { Plus, FolderKanban, Search, Filter } from "lucide-react";
import { DashboardLayout } from "@/components/layout";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProjects, useDeleteProject, useProjectTasks, Project, ProjectStatus } from "@/hooks/useProjects";
import { ProjectCard, ProjectFormDialog, ProjectDetailsDialog } from "@/components/projects";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

// Hook to get progress for all projects
function useProjectsProgress(projectIds: string[]) {
  return useQuery({
    queryKey: ["projectsProgress", projectIds],
    queryFn: async () => {
      if (projectIds.length === 0) return {};
      
      const { data: tasks } = await supabase
        .from("tasks")
        .select("project_id, status")
        .in("project_id", projectIds);

      const progress: Record<string, number> = {};
      
      projectIds.forEach(id => {
        const projectTasks = tasks?.filter(t => t.project_id === id) || [];
        const completed = projectTasks.filter(t => t.status === "done").length;
        progress[id] = projectTasks.length > 0 ? Math.round((completed / projectTasks.length) * 100) : 0;
      });
      
      return progress;
    },
    enabled: projectIds.length > 0,
  });
}

export default function Projects() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const { data: projects = [], isLoading } = useProjects();
  const deleteProject = useDeleteProject();
  
  const projectIds = projects.map(p => p.id);
  const { data: progressMap = {} } = useProjectsProgress(projectIds);

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesPriority = !filterPriority || filterPriority === "all" || p.priority === filterPriority;
      
      const matchesTab = activeTab === "all" || p.status === activeTab;

      return matchesSearch && matchesPriority && matchesTab;
    });
  }, [projects, searchQuery, filterPriority, activeTab]);

  const handleEdit = (project: Project) => {
    setSelectedProject(project);
    setFormOpen(true);
  };

  const handleDelete = (project: Project) => {
    setSelectedProject(project);
    setDeleteDialogOpen(true);
  };

  const handleViewDetails = (project: Project) => {
    setSelectedProject(project);
    setDetailsOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedProject) {
      await deleteProject.mutateAsync(selectedProject.id);
      setDeleteDialogOpen(false);
      setSelectedProject(null);
    }
  };

  const statusCounts = {
    all: projects.length,
    planning: projects.filter(p => p.status === "planning").length,
    active: projects.filter(p => p.status === "active").length,
    on_hold: projects.filter(p => p.status === "on_hold").length,
    completed: projects.filter(p => p.status === "completed").length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => { setSelectedProject(null); setFormOpen(true); }} 
            className="w-10 h-10 rounded-xl bg-secondary/80 border border-border/50 flex items-center justify-center hover:bg-primary/20 hover:border-primary/30 hover:shadow-md transition-all duration-300"
            title="פרויקט חדש"
          >
            <Plus className="w-5 h-5 text-muted-foreground" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <FolderKanban className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">פרויקטים</h1>
              <p className="text-sm text-muted-foreground">ניהול וצפייה בכל הפרויקטים</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="glass-card p-1 mb-4 h-auto flex-wrap">
            <TabsTrigger value="all" className="rounded-xl">
              הכל ({statusCounts.all})
            </TabsTrigger>
            <TabsTrigger value="planning" className="rounded-xl">
              תכנון ({statusCounts.planning})
            </TabsTrigger>
            <TabsTrigger value="active" className="rounded-xl">
              פעיל ({statusCounts.active})
            </TabsTrigger>
            <TabsTrigger value="on_hold" className="rounded-xl">
              מושהה ({statusCounts.on_hold})
            </TabsTrigger>
            <TabsTrigger value="completed" className="rounded-xl">
              הושלם ({statusCounts.completed})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="חיפוש פרויקטים..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10 bg-secondary/50"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-[150px] bg-secondary/50">
                <SelectValue placeholder="עדיפות" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">הכל</SelectItem>
                <SelectItem value="low">נמוכה</SelectItem>
                <SelectItem value="medium">בינונית</SelectItem>
                <SelectItem value="high">גבוהה</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">טוען...</div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-12">
            <FolderKanban className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="text-lg font-medium text-muted-foreground">
              {searchQuery || filterPriority ? "לא נמצאו פרויקטים" : "אין פרויקטים עדיין"}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {searchQuery || filterPriority ? "נסה לשנות את הסינון" : "צור פרויקט חדש כדי להתחיל"}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredProjects.map((project, index) => (
              <div key={project.id} style={{ animationDelay: `${index * 50}ms` }}>
                <ProjectCard
                  project={project}
                  progress={progressMap[project.id] || 0}
                  onEdit={() => handleEdit(project)}
                  onDelete={() => handleDelete(project)}
                  onClick={() => handleViewDetails(project)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <ProjectFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        project={selectedProject}
      />

      <ProjectDetailsDialog
        project={selectedProject}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="glass-card">
          <AlertDialogHeader>
            <AlertDialogTitle>מחיקת פרויקט</AlertDialogTitle>
            <AlertDialogDescription>
              האם אתה בטוח שברצונך למחוק את הפרויקט "{selectedProject?.title}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              מחק
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
