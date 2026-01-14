import { useState } from "react";
import { Plus, FileText, Search } from "lucide-react";
import { DashboardLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProcedures, useDeleteProcedure, Procedure } from "@/hooks/useProcedures";
import { useDecisions, useDeleteDecision, Decision } from "@/hooks/useDecisions";
import { ProcedureCard, ProcedureFormDialog, ProcedureDetailsDialog } from "@/components/procedures";
import { DecisionFormDialog } from "@/components/decisions";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function Procedures() {
  const [searchQuery, setSearchQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [decisionFormOpen, setDecisionFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProcedure, setSelectedProcedure] = useState<Procedure | null>(null);
  const [selectedDecision, setSelectedDecision] = useState<Decision | null>(null);
  const [deleteDecisionDialogOpen, setDeleteDecisionDialogOpen] = useState(false);

  const { data: procedures = [], isLoading } = useProcedures();
  const { data: allDecisions = [] } = useDecisions();
  const deleteProcedure = useDeleteProcedure();
  const deleteDecision = useDeleteDecision();

  const filteredProcedures = procedures.filter(
    (p) =>
      p.title.includes(searchQuery) ||
      p.description?.includes(searchQuery) ||
      p.category?.includes(searchQuery)
  );

  const getDecisionsCount = (procedureId: string) => 
    allDecisions.filter((d) => d.procedure_id === procedureId).length;

  const handleEdit = (procedure: Procedure) => {
    setSelectedProcedure(procedure);
    setFormOpen(true);
  };

  const handleDelete = (procedure: Procedure) => {
    setSelectedProcedure(procedure);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedProcedure) {
      await deleteProcedure.mutateAsync(selectedProcedure.id);
      setDeleteDialogOpen(false);
      setSelectedProcedure(null);
    }
  };

  const handleProcedureClick = (procedure: Procedure) => {
    setSelectedProcedure(procedure);
    setDetailsOpen(true);
  };

  const handleAddDecision = () => {
    setSelectedDecision(null);
    setDecisionFormOpen(true);
  };

  const handleEditDecision = (decision: Decision) => {
    setSelectedDecision(decision);
    setDecisionFormOpen(true);
  };

  const handleDeleteDecision = (decision: Decision) => {
    setSelectedDecision(decision);
    setDeleteDecisionDialogOpen(true);
  };

  const confirmDeleteDecision = async () => {
    if (selectedDecision) {
      await deleteDecision.mutateAsync(selectedDecision.id);
      setDeleteDecisionDialogOpen(false);
      setSelectedDecision(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => { setSelectedProcedure(null); setFormOpen(true); }} 
            className="w-10 h-10 rounded-xl bg-secondary/80 border border-border/50 flex items-center justify-center hover:bg-primary/20 hover:border-primary/30 hover:shadow-md transition-all duration-300"
            title="נוהל חדש"
          >
            <Plus className="w-5 h-5 text-muted-foreground" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">נהלים</h1>
              <p className="text-sm text-muted-foreground">ניהול נהלים והחלטות משויכות</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="חיפוש נהלים..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10 bg-secondary/50"
          />
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">טוען...</div>
        ) : filteredProcedures.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="text-lg font-medium text-muted-foreground">
              {searchQuery ? "לא נמצאו נהלים" : "אין נהלים עדיין"}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {searchQuery ? "נסה לחפש משהו אחר" : "צור נוהל חדש כדי להתחיל"}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredProcedures.map((procedure) => (
              <ProcedureCard
                key={procedure.id}
                procedure={procedure}
                decisionsCount={getDecisionsCount(procedure.id)}
                onEdit={() => handleEdit(procedure)}
                onDelete={() => handleDelete(procedure)}
                onClick={() => handleProcedureClick(procedure)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <ProcedureFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        procedure={selectedProcedure}
      />

      <ProcedureDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        procedure={selectedProcedure}
        onAddDecision={handleAddDecision}
        onEditDecision={handleEditDecision}
        onDeleteDecision={handleDeleteDecision}
      />

      <DecisionFormDialog
        open={decisionFormOpen}
        onOpenChange={setDecisionFormOpen}
        decision={selectedDecision}
        defaultProcedureId={selectedProcedure?.id}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="glass-card">
          <AlertDialogHeader>
            <AlertDialogTitle>מחיקת נוהל</AlertDialogTitle>
            <AlertDialogDescription>
              האם אתה בטוח שברצונך למחוק את הנוהל "{selectedProcedure?.title}"?
              החלטות משויכות לא יימחקו.
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

      <AlertDialog open={deleteDecisionDialogOpen} onOpenChange={setDeleteDecisionDialogOpen}>
        <AlertDialogContent className="glass-card">
          <AlertDialogHeader>
            <AlertDialogTitle>מחיקת החלטה</AlertDialogTitle>
            <AlertDialogDescription>
              האם אתה בטוח שברצונך למחוק את ההחלטה "{selectedDecision?.title}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteDecision} className="bg-destructive text-destructive-foreground">
              מחק
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
