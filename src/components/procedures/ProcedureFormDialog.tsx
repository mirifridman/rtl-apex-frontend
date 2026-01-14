import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Procedure, ProcedureStatus, useCreateProcedure, useUpdateProcedure } from "@/hooks/useProcedures";

interface ProcedureFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  procedure?: Procedure | null;
}

const categories = ["כספים", "משאבי אנוש", "תפעול", "משפטי", "שיווק", "אחר"];
const statuses: { value: ProcedureStatus; label: string }[] = [
  { value: "draft", label: "טיוטה" },
  { value: "active", label: "פעיל" },
  { value: "cancelled", label: "בוטל" },
];

export function ProcedureFormDialog({ open, onOpenChange, procedure }: ProcedureFormDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState<ProcedureStatus>("draft");

  const createProcedure = useCreateProcedure();
  const updateProcedure = useUpdateProcedure();

  useEffect(() => {
    if (procedure) {
      setTitle(procedure.title);
      setDescription(procedure.description || "");
      setCategory(procedure.category || "");
      setStatus(procedure.status);
    } else {
      setTitle("");
      setDescription("");
      setCategory("");
      setStatus("draft");
    }
  }, [procedure, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      title,
      description: description || null,
      category: category || null,
      status,
    };

    if (procedure) {
      await updateProcedure.mutateAsync({ id: procedure.id, ...data });
    } else {
      await createProcedure.mutateAsync(data);
    }
    
    onOpenChange(false);
  };

  const isLoading = createProcedure.isPending || updateProcedure.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {procedure ? "עריכת נוהל" : "נוהל חדש"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">שם הנוהל *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="לדוגמה: נוהל אישור הוצאות"
              required
              className="bg-secondary/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">תיאור</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="תיאור מפורט של הנוהל..."
              rows={3}
              className="bg-secondary/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>קטגוריה</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="bg-secondary/50">
                  <SelectValue placeholder="בחר קטגוריה" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>סטטוס</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as ProcedureStatus)}>
                <SelectTrigger className="bg-secondary/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              ביטול
            </Button>
            <Button type="submit" disabled={!title || isLoading} className="gradient-primary">
              {isLoading ? "שומר..." : procedure ? "עדכן" : "צור נוהל"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
