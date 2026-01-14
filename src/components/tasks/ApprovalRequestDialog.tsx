import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, Mail, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEmployees } from "@/hooks/useEmployees";
import { useSendApprovalRequest } from "@/hooks/useApprovalRequests";
import { useToast } from "@/hooks/use-toast";

interface ApprovalRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: string;
  taskTitle: string;
}

export function ApprovalRequestDialog({
  open,
  onOpenChange,
  taskId,
  taskTitle,
}: ApprovalRequestDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const { toast } = useToast();

  const { data: employees = [], isLoading: employeesLoading } = useEmployees();
  const sendRequest = useSendApprovalRequest();

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSend = async () => {
    if (!selectedEmployeeId) {
      toast({
        title: "שגיאה",
        description: "נא לבחור חבר צוות",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await sendRequest.mutateAsync({
        taskId,
        employeeId: selectedEmployeeId,
        message: message || undefined,
      });

      toast({
        title: "הבקשה נשלחה",
        description: "קישור האישור נשלח בהצלחה",
      });

      // Copy magic link to clipboard
      if (result.magicLink) {
        navigator.clipboard.writeText(result.magicLink);
        toast({
          title: "הקישור הועתק",
          description: "קישור האישור הועתק ללוח",
        });
      }

      onOpenChange(false);
      setSelectedEmployeeId(null);
      setMessage("");
      setSearchQuery("");
    } catch (error: any) {
      toast({
        title: "שגיאה",
        description: error.message || "לא ניתן לשלוח את הבקשה",
        variant: "destructive",
      });
    }
  };

  const selectedEmployee = employees.find((e) => e.id === selectedEmployeeId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] glass-card" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">בקשת אישור מחבר צוות</DialogTitle>
          <DialogDescription>
            בחר חבר צוות לשליחת בקשת אישור עבור: <strong>{taskTitle}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="חיפוש לפי שם או אימייל..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10 bg-secondary/50"
            />
          </div>

          {/* Employee List */}
          <ScrollArea className="h-[200px] rounded-xl border border-border p-2">
            {employeesLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : filteredEmployees.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                לא נמצאו חברי צוות
              </div>
            ) : (
              <div className="space-y-1">
                {filteredEmployees.map((employee) => {
                  const isSelected = selectedEmployeeId === employee.id;
                  const initials = employee.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2);

                  return (
                    <label
                      key={employee.id}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl cursor-pointer",
                        "hover:bg-accent/50 transition-all duration-200",
                        isSelected && "bg-primary/15 border border-primary/30"
                      )}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() =>
                          setSelectedEmployeeId(isSelected ? null : employee.id)
                        }
                        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                      <Avatar className="w-10 h-10 border-2 border-background">
                        <AvatarImage src={employee.avatarUrl || undefined} />
                        <AvatarFallback className="bg-primary/20 text-primary font-bold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground">{employee.name}</p>
                        {employee.email && (
                          <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {employee.email}
                          </p>
                        )}
                      </div>
                      {employee.role && (
                        <Badge variant="outline" className="text-xs">
                          {employee.role}
                        </Badge>
                      )}
                    </label>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          {/* Selected Employee */}
          {selectedEmployee && (
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
              <p className="text-sm text-primary font-medium">
                נבחר: {selectedEmployee.name}
              </p>
            </div>
          )}

          {/* Message */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">הודעה לנמען (אופציונלי)</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="הוסף הודעה אישית..."
              className="bg-secondary/50 min-h-[80px]"
            />
          </div>

          {/* Info Note */}
          <div className="flex items-start gap-2 p-3 rounded-xl bg-warning/10 border border-warning/20">
            <Clock className="w-4 h-4 text-warning mt-0.5 shrink-0" />
            <p className="text-xs text-warning">
              הבקשה תהיה בתוקף למשך 7 ימים. לאחר מכן יהיה צורך לשלוח בקשה חדשה.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            ביטול
          </Button>
          <Button
            onClick={handleSend}
            disabled={!selectedEmployeeId || sendRequest.isPending}
            className="gradient-primary text-primary-foreground"
          >
            {sendRequest.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin ml-2" />
                שולח...
              </>
            ) : (
              "שלח בקשת אישור"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
