import { useState } from "react";
import { Plus, Gavel, Search, Filter } from "lucide-react";
import { DashboardLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDecisions, useDeleteDecision, Decision } from "@/hooks/useDecisions";
import { useProcedures } from "@/hooks/useProcedures";
import { DecisionCard, DecisionFormDialog } from "@/components/decisions";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function Decisions() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterProcedureId, setFilterProcedureId] = useState<string>("");
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDecision, setSelectedDecision] = useState<Decision | null>(null);

  const { data: decisions = [], isLoading } = useDecisions();
  const { data: procedures = [] } = useProcedures();
  const deleteDecision = useDeleteDecision();

  const filteredDecisions = decisions.filter((d) => {
    const matchesSearch =
      d.title.includes(searchQuery) ||
      d.description?.includes(searchQuery) ||
      d.source_meeting?.includes(searchQuery);
    
    const matchesProcedure = !filterProcedureId || filterProcedureId === "all" || 
      (filterProcedureId === "none" ? !d.procedure_id : d.procedure_id === filterProcedureId);

    return matchesSearch && matchesProcedure;
  });

  const getProcedure = (procedureId: string | null) =>
    procedureId ? procedures.find((p) => p.id === procedureId) : null;

  const handleEdit = (decision: Decision) => {
    setSelectedDecision(decision);
    setFormOpen(true);
  };

  const handleDelete = (decision: Decision) => {
    setSelectedDecision(decision);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedDecision) {
      await deleteDecision.mutateAsync(selectedDecision.id);
      setDeleteDialogOpen(false);
      setSelectedDecision(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => { setSelectedDecision(null); setFormOpen(true); }} 
            className="w-10 h-10 rounded-xl bg-secondary/80 border border-border/50 flex items-center justify-center hover:bg-primary/20 hover:border-primary/30 hover:shadow-md transition-all duration-300"
            title="החלטה חדשה"
          >
            <Plus className="w-5 h-5 text-muted-foreground" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-accent/10">
              <Gavel className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">החלטות</h1>
              <p className="text-sm text-muted-foreground">כל ההחלטות הניהוליות במערכת</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="חיפוש החלטות..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10 bg-secondary/50"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={filterProcedureId} onValueChange={setFilterProcedureId}>
              <SelectTrigger className="w-[200px] bg-secondary/50">
                <SelectValue placeholder="סינון לפי נוהל" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">הכל</SelectItem>
                <SelectItem value="none">ללא נוהל</SelectItem>
                {procedures.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">טוען...</div>
        ) : filteredDecisions.length === 0 ? (
          <div className="text-center py-12">
            <Gavel className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="text-lg font-medium text-muted-foreground">
              {searchQuery || filterProcedureId ? "לא נמצאו החלטות" : "אין החלטות עדיין"}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {searchQuery || filterProcedureId ? "נסה לשנות את הסינון" : "צור החלטה חדשה כדי להתחיל"}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredDecisions.map((decision, index) => (
              <div key={decision.id} style={{ animationDelay: `${index * 50}ms` }}>
                <DecisionCard
                  decision={decision}
                  procedure={getProcedure(decision.procedure_id)}
                  onEdit={() => handleEdit(decision)}
                  onDelete={() => handleDelete(decision)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <DecisionFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        decision={selectedDecision}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="glass-card">
          <AlertDialogHeader>
            <AlertDialogTitle>מחיקת החלטה</AlertDialogTitle>
            <AlertDialogDescription>
              האם אתה בטוח שברצונך למחוק את ההחלטה "{selectedDecision?.title}"?
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
