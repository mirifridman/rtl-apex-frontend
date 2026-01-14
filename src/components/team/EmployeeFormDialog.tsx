import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Trash2 } from "lucide-react";
import type { Employee, CreateEmployeeData, UpdateEmployeeData } from "@/hooks/useEmployees";

interface EmployeeFormDialogProps {
  employee: Employee | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: CreateEmployeeData | { employeeId: string; updates: UpdateEmployeeData }) => void;
  onDelete?: (employeeId: string) => void;
  isSaving: boolean;
  isDeleting?: boolean;
}

export function EmployeeFormDialog({
  employee,
  open,
  onOpenChange,
  onSave,
  onDelete,
  isSaving,
  isDeleting,
}: EmployeeFormDialogProps) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [telegramChatId, setTelegramChatId] = useState("");
  const [isActive, setIsActive] = useState(true);

  const isEditing = !!employee;

  useEffect(() => {
    if (employee) {
      setName(employee.name);
      setRole(employee.role || "");
      setEmail(employee.email || "");
      setPhone(employee.phone || "");
      setTelegramChatId(employee.telegramChatId || "");
      setIsActive(employee.isActive);
    } else {
      setName("");
      setRole("");
      setEmail("");
      setPhone("");
      setTelegramChatId("");
      setIsActive(true);
    }
  }, [employee, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) return;

    if (isEditing && employee) {
      onSave({
        employeeId: employee.id,
        updates: {
          name: name.trim(),
          role: role.trim() || undefined,
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          telegramChatId: telegramChatId.trim() || undefined,
          isActive,
        },
      });
    } else {
      onSave({
        name: name.trim(),
        role: role.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        telegramChatId: telegramChatId.trim() || undefined,
      });
    }
  };

  const handleDelete = () => {
    if (employee && onDelete) {
      onDelete(employee.id);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {isEditing ? "עריכת עובד" : "הוספת עובד חדש"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">שם מלא *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ישראל ישראלי"
              required
              className="glass-card"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">תפקיד</Label>
            <Input
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="מנהל פרויקטים"
              className="glass-card"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">מייל</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              dir="ltr"
              className="glass-card"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">טלפון נייד</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="972501234567"
              dir="ltr"
              className="glass-card"
            />
            <p className="text-xs text-muted-foreground">פורמט: 972501234567</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="telegram">מזהה טלגרם (Chat ID)</Label>
            <Input
              id="telegram"
              value={telegramChatId}
              onChange={(e) => setTelegramChatId(e.target.value)}
              placeholder="123456789"
              dir="ltr"
              className="glass-card"
            />
          </div>

          {isEditing && (
            <div className="flex items-center justify-between py-2">
              <Label htmlFor="is-active" className="cursor-pointer">עובד פעיל</Label>
              <Switch
                id="is-active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
          )}

          <DialogFooter className="flex gap-2 pt-4">
            {isEditing && onDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
                className="ml-auto"
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 ml-2" />
                    מחק
                  </>
                )}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl"
            >
              ביטול
            </Button>
            <Button
              type="submit"
              disabled={isSaving || !name.trim()}
              className="gradient-primary glow-primary rounded-xl"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isEditing ? (
                "שמור"
              ) : (
                "הוסף"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
