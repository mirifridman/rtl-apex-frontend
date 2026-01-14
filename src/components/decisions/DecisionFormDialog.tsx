import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Decision, DecisionStatus, useCreateDecision, useUpdateDecision } from "@/hooks/useDecisions";
import { Procedure, useCreateProcedure, useProcedures } from "@/hooks/useProcedures";

interface DecisionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  decision?: Decision | null;
  defaultProcedureId?: string | null;
}

const statuses: { value: DecisionStatus; label: string }[] = [
  { value: "active", label: "פעילה" },
  { value: "cancelled", label: "בוטלה" },
  { value: "replaced", label: "הוחלפה" },
];

export function DecisionFormDialog({ open, onOpenChange, decision, defaultProcedureId }: DecisionFormDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [decisionDate, setDecisionDate] = useState<Date>(new Date());
  const [sourceMeeting, setSourceMeeting] = useState("");
  const [procedureId, setProcedureId] = useState<string>("");
  const [status, setStatus] = useState<DecisionStatus>("active");
  const [showNewProcedure, setShowNewProcedure] = useState(false);
  const [newProcedureTitle, setNewProcedureTitle] = useState("");

  const { data: procedures = [] } = useProcedures();
  const createDecision = useCreateDecision();
  const updateDecision = useUpdateDecision();
  const createProcedure = useCreateProcedure();

  useEffect(() => {
    if (decision) {
      setTitle(decision.title);
      setDescription(decision.description || "");
      setDecisionDate(new Date(decision.decision_date));
      setSourceMeeting(decision.source_meeting || "");
      setProcedureId(decision.procedure_id || "");
      setStatus(decision.status);
    } else {
      setTitle("");
      setDescription("");
      setDecisionDate(new Date());
      setSourceMeeting("");
      setProcedureId(defaultProcedureId || "");
      setStatus("active");
    }
    setShowNewProcedure(false);
    setNewProcedureTitle("");
  }, [decision, open, defaultProcedureId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let finalProcedureId = procedureId;
    
    // Create new procedure if needed
    if (showNewProcedure && newProcedureTitle) {
      const newProc = await createProcedure.mutateAsync({ 
        title: newProcedureTitle, 
        status: "active" 
      });
      finalProcedureId = newProc.id;
    }
    
    const data = {
      title,
      description: description || null,
      decision_date: format(decisionDate, "yyyy-MM-dd"),
      source_meeting: sourceMeeting || null,
      procedure_id: (finalProcedureId && finalProcedureId !== "none") ? finalProcedureId : null,
      status,
    };

    if (decision) {
      await updateDecision.mutateAsync({ id: decision.id, ...data });
    } else {
      await createDecision.mutateAsync(data);
    }
    
    onOpenChange(false);
  };

  const isLoading = createDecision.isPending || updateDecision.isPending || createProcedure.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {decision ? "עריכת החלטה" : "החלטה חדשה"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">תמצית ההחלטה *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="לדוגמה: אישור תקציב שיווק Q1"
              required
              className="bg-secondary/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">פירוט ההחלטה</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="פירוט מלא של ההחלטה..."
              rows={3}
              className="bg-secondary/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>תאריך ההחלטה</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-right bg-secondary/50",
                      !decisionDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="ml-2 h-4 w-4" />
                    {format(decisionDate, "dd/MM/yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={decisionDate}
                    onSelect={(d) => d && setDecisionDate(d)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>סטטוס</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as DecisionStatus)}>
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

          <div className="space-y-2">
            <Label htmlFor="sourceMeeting">מאיזו ישיבה (אופציונלי)</Label>
            <Input
              id="sourceMeeting"
              value={sourceMeeting}
              onChange={(e) => setSourceMeeting(e.target.value)}
              placeholder="לדוגמה: ישיבת הנהלה 15/01/2026"
              className="bg-secondary/50"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>שיוך לנוהל</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-primary text-xs"
                onClick={() => setShowNewProcedure(!showNewProcedure)}
              >
                <Plus className="w-3 h-3 ml-1" />
                נוהל חדש
              </Button>
            </div>
            {showNewProcedure ? (
              <Input
                value={newProcedureTitle}
                onChange={(e) => setNewProcedureTitle(e.target.value)}
                placeholder="שם הנוהל החדש..."
                className="bg-secondary/50"
              />
            ) : (
              <Select value={procedureId} onValueChange={setProcedureId}>
                <SelectTrigger className="bg-secondary/50">
                  <SelectValue placeholder="בחר נוהל (אופציונלי)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">ללא שיוך</SelectItem>
                  {procedures.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              ביטול
            </Button>
            <Button type="submit" disabled={!title || isLoading} className="gradient-primary">
              {isLoading ? "שומר..." : decision ? "עדכן" : "צור החלטה"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
