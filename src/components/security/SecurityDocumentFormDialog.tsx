import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, Loader2, Upload, FileText } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { 
  SecurityDocument, 
  SecurityDocumentStatus, 
  SecurityDocumentCategory,
  useCreateSecurityDocument, 
  useUpdateSecurityDocument 
} from "@/hooks/useSecurityDocuments";

interface SecurityDocumentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document?: SecurityDocument | null;
}

const statusOptions: { value: SecurityDocumentStatus; label: string }[] = [
  { value: "draft", label: "טיוטה" },
  { value: "active", label: "פעיל" },
  { value: "archived", label: "בארכיון" },
];

const categoryOptions: { value: SecurityDocumentCategory; label: string }[] = [
  { value: "policy", label: "מדיניות" },
  { value: "procedure", label: "נוהל" },
  { value: "form", label: "טופס" },
  { value: "approval", label: "אישור" },
];

const statusStyles: Record<SecurityDocumentStatus, string> = {
  draft: "bg-muted/50 text-muted-foreground border-muted",
  active: "bg-success/20 text-success border-success/30",
  archived: "bg-secondary/50 text-secondary-foreground border-secondary",
};

const categoryStyles: Record<SecurityDocumentCategory, string> = {
  policy: "bg-primary/20 text-primary border-primary/30",
  procedure: "bg-accent/20 text-accent border-accent/30",
  form: "bg-warning/20 text-warning border-warning/30",
  approval: "bg-success/20 text-success border-success/30",
};

export function SecurityDocumentFormDialog({ open, onOpenChange, document }: SecurityDocumentFormDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<SecurityDocumentCategory>("policy");
  const [status, setStatus] = useState<SecurityDocumentStatus>("draft");
  const [version, setVersion] = useState("");
  const [effectiveDate, setEffectiveDate] = useState<Date | undefined>();
  const [reviewDate, setReviewDate] = useState<Date | undefined>();
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createDocument = useCreateSecurityDocument();
  const updateDocument = useUpdateSecurityDocument();
  const isEditing = !!document;

  useEffect(() => {
    if (document) {
      setTitle(document.title);
      setDescription(document.description || "");
      setCategory(document.category);
      setStatus(document.status);
      setVersion(document.version || "");
      setEffectiveDate(document.effective_date ? new Date(document.effective_date) : undefined);
      setReviewDate(document.review_date ? new Date(document.review_date) : undefined);
      setFile(null);
    } else {
      setTitle("");
      setDescription("");
      setCategory("policy");
      setStatus("draft");
      setVersion("");
      setEffectiveDate(undefined);
      setReviewDate(undefined);
      setFile(null);
    }
  }, [document, open]);

  const handleSubmit = async () => {
    const data = {
      title,
      description: description || null,
      category,
      status,
      version: version || null,
      effective_date: effectiveDate?.toISOString().split("T")[0] || null,
      review_date: reviewDate?.toISOString().split("T")[0] || null,
      file: file || undefined,
    };

    if (isEditing) {
      await updateDocument.mutateAsync({ id: document.id, ...data });
    } else {
      await createDocument.mutateAsync(data);
    }
    onOpenChange(false);
  };

  const isPending = createDocument.isPending || updateDocument.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] glass-card border-border max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {isEditing ? "עריכת מסמך" : "מסמך חדש"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">שם המסמך</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="הזן שם מסמך..."
              className="bg-secondary/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">תיאור</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="תיאור המסמך..."
              className="bg-secondary/50 min-h-[60px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>קטגוריה</Label>
              <div className="flex flex-wrap gap-2">
                {categoryOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setCategory(opt.value)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-bold border transition-all",
                      category === opt.value
                        ? categoryStyles[opt.value]
                        : "bg-secondary/50 border-border text-muted-foreground hover:bg-secondary"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>סטטוס</Label>
              <div className="flex flex-wrap gap-2">
                {statusOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setStatus(opt.value)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-bold border transition-all",
                      status === opt.value
                        ? statusStyles[opt.value]
                        : "bg-secondary/50 border-border text-muted-foreground hover:bg-secondary"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="version">גרסה</Label>
            <Input
              id="version"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="לדוגמה: 1.0"
              className="bg-secondary/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>תאריך תחילת תוקף</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-right bg-secondary/50",
                      !effectiveDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="ml-2 h-4 w-4" />
                    {effectiveDate ? format(effectiveDate, "PPP", { locale: he }) : "בחר תאריך"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={effectiveDate}
                    onSelect={setEffectiveDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>תאריך בדיקה הבא</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-right bg-secondary/50",
                      !reviewDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="ml-2 h-4 w-4" />
                    {reviewDate ? format(reviewDate, "PPP", { locale: he }) : "בחר תאריך"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={reviewDate}
                    onSelect={setReviewDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label>קובץ</Label>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <Button
              variant="outline"
              className="w-full justify-start bg-secondary/50"
              onClick={() => fileInputRef.current?.click()}
            >
              {file ? (
                <>
                  <FileText className="w-4 h-4 ml-2" />
                  {file.name}
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 ml-2" />
                  {document?.file_path ? "החלף קובץ" : "העלה קובץ"}
                </>
              )}
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            ביטול
          </Button>
          <Button onClick={handleSubmit} disabled={!title.trim() || isPending}>
            {isPending && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
            {isEditing ? "שמור" : "צור מסמך"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
