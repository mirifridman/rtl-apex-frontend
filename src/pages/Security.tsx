import { useState, useMemo } from "react";
import { Plus, Shield, Search, Filter, AlertTriangle } from "lucide-react";
import { DashboardLayout } from "@/components/layout";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useSecurityDocuments, useDeleteSecurityDocument, SecurityDocument, SecurityDocumentCategory } from "@/hooks/useSecurityDocuments";
import { usePermissions } from "@/hooks/usePermissions";
import { SecurityDocumentCard, SecurityDocumentFormDialog } from "@/components/security";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { isPast } from "date-fns";
import { Navigate } from "react-router-dom";

export default function Security() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<SecurityDocument | null>(null);

  const { data: documents = [], isLoading } = useSecurityDocuments();
  const deleteDocument = useDeleteSecurityDocument();
  const { canManageUsers, canEdit } = usePermissions();

  // Only allow admins and managers
  if (!canManageUsers && !canEdit) {
    return <Navigate to="/" replace />;
  }

  const documentsNeedingReview = documents.filter(
    d => d.review_date && isPast(new Date(d.review_date)) && d.status === "active"
  );

  const filteredDocuments = useMemo(() => {
    return documents.filter((d) => {
      const matchesSearch = d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = !filterCategory || filterCategory === "all" || d.category === filterCategory;
      const matchesStatus = !filterStatus || filterStatus === "all" || d.status === filterStatus;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [documents, searchQuery, filterCategory, filterStatus]);

  // Group by category
  const groupedDocuments = useMemo(() => {
    const groups: Record<string, SecurityDocument[]> = {
      policy: [],
      procedure: [],
      form: [],
      approval: [],
    };

    filteredDocuments.forEach(doc => {
      groups[doc.category].push(doc);
    });

    return groups;
  }, [filteredDocuments]);

  const handleEdit = (document: SecurityDocument) => {
    setSelectedDocument(document);
    setFormOpen(true);
  };

  const handleDelete = (document: SecurityDocument) => {
    setSelectedDocument(document);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedDocument) {
      await deleteDocument.mutateAsync({ 
        id: selectedDocument.id, 
        filePath: selectedDocument.file_path 
      });
      setDeleteDialogOpen(false);
      setSelectedDocument(null);
    }
  };

  const categoryLabels: Record<SecurityDocumentCategory, string> = {
    policy: "מדיניות",
    procedure: "נהלים",
    form: "טפסים",
    approval: "אישורים",
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => { setSelectedDocument(null); setFormOpen(true); }} 
            className="w-10 h-10 rounded-xl bg-secondary/80 border border-border/50 flex items-center justify-center hover:bg-primary/20 hover:border-primary/30 hover:shadow-md transition-all duration-300"
            title="מסמך חדש"
          >
            <Plus className="w-5 h-5 text-muted-foreground" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">אבטחת מידע</h1>
              <p className="text-sm text-muted-foreground">מאגר מסמכי אבטחת מידע</p>
            </div>
          </div>
        </div>

        {/* Alert for documents needing review */}
        {documentsNeedingReview.length > 0 && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/30">
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-destructive">
                {documentsNeedingReview.length} מסמכים דורשים עדכון
              </p>
              <p className="text-sm text-muted-foreground">
                {documentsNeedingReview.map(d => d.title).join(", ")}
              </p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="חיפוש מסמכים..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10 bg-secondary/50"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[150px] bg-secondary/50">
                <SelectValue placeholder="קטגוריה" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">הכל</SelectItem>
                <SelectItem value="policy">מדיניות</SelectItem>
                <SelectItem value="procedure">נוהל</SelectItem>
                <SelectItem value="form">טופס</SelectItem>
                <SelectItem value="approval">אישור</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px] bg-secondary/50">
                <SelectValue placeholder="סטטוס" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">הכל</SelectItem>
                <SelectItem value="draft">טיוטה</SelectItem>
                <SelectItem value="active">פעיל</SelectItem>
                <SelectItem value="archived">בארכיון</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">טוען...</div>
        ) : filteredDocuments.length === 0 ? (
          <div className="text-center py-12">
            <Shield className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="text-lg font-medium text-muted-foreground">
              {searchQuery || filterCategory || filterStatus ? "לא נמצאו מסמכים" : "אין מסמכים עדיין"}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {searchQuery || filterCategory || filterStatus ? "נסה לשנות את הסינון" : "צור מסמך חדש כדי להתחיל"}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedDocuments).map(([category, docs]) => {
              if (docs.length === 0) return null;
              return (
                <div key={category}>
                  <div className="flex items-center gap-2 mb-4">
                    <h2 className="text-lg font-bold text-foreground">
                      {categoryLabels[category as SecurityDocumentCategory]}
                    </h2>
                    <Badge variant="secondary">{docs.length}</Badge>
                  </div>
                  <div className="flex flex-col gap-3">
                    {docs.map((doc, index) => (
                      <div key={doc.id} style={{ animationDelay: `${index * 50}ms` }}>
                        <SecurityDocumentCard
                          document={doc}
                          onEdit={() => handleEdit(doc)}
                          onDelete={() => handleDelete(doc)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <SecurityDocumentFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        document={selectedDocument}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="glass-card">
          <AlertDialogHeader>
            <AlertDialogTitle>מחיקת מסמך</AlertDialogTitle>
            <AlertDialogDescription>
              האם אתה בטוח שברצונך למחוק את המסמך "{selectedDocument?.title}"?
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
