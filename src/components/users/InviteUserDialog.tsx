import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserPlus, Mail, User } from "lucide-react";
import { z } from "zod";

const inviteSchema = z.object({
  email: z.string().trim().email("כתובת אימייל לא תקינה"),
  full_name: z.string().trim().min(2, "שם חייב להכיל לפחות 2 תווים"),
  role: z.enum(["admin", "manager", "editor", "viewer", "team_member"]),
});

interface InviteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteUserDialog({ open, onOpenChange }: InviteUserDialogProps) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<string>("viewer");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const inviteMutation = useMutation({
    mutationFn: async (data: { email: string; full_name: string; role: string }) => {
      const { data: response, error } = await supabase.functions.invoke("invite-user", {
        body: data,
      });

      if (error) throw error;
      if (response?.error) throw new Error(response.error);
      return response;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["users-with-roles"] });
      toast({
        title: "משתמש נוסף בהצלחה",
        description: data?.message || "הזמנה נשלחה לאימייל של המשתמש",
      });
      handleClose();
    },
    onError: (error: Error) => {
      toast({
        title: "שגיאה",
        description: error.message || "לא ניתן להוסיף משתמש",
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    setEmail("");
    setFullName("");
    setRole("viewer");
    setErrors({});
    onOpenChange(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = inviteSchema.safeParse({
      email: email.trim(),
      full_name: fullName.trim(),
      role,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    inviteMutation.mutate({
      email: result.data.email,
      full_name: result.data.full_name,
      role: result.data.role,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            הוספת משתמש חדש
          </DialogTitle>
          <DialogDescription>
            הזן את פרטי המשתמש. הזמנה תישלח לאימייל שלו עם קישור להגדרת סיסמה.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="full_name" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              שם מלא
            </Label>
            <Input
              id="full_name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="ישראל ישראלי"
              disabled={inviteMutation.isPending}
            />
            {errors.full_name && (
              <p className="text-sm text-destructive">{errors.full_name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              כתובת אימייל
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              dir="ltr"
              disabled={inviteMutation.isPending}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">תפקיד</Label>
            <Select value={role} onValueChange={setRole} disabled={inviteMutation.isPending}>
              <SelectTrigger id="role">
                <SelectValue placeholder="בחר תפקיד" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">מנהל מערכת</SelectItem>
                <SelectItem value="manager">מנהל</SelectItem>
                <SelectItem value="editor">עורך</SelectItem>
                <SelectItem value="viewer">צופה</SelectItem>
                <SelectItem value="team_member">חבר צוות</SelectItem>
              </SelectContent>
            </Select>
            {errors.role && (
              <p className="text-sm text-destructive">{errors.role}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={inviteMutation.isPending}
            >
              ביטול
            </Button>
            <Button type="submit" disabled={inviteMutation.isPending}>
              {inviteMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin ml-2" />
                  שולח הזמנה...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 ml-2" />
                  הוסף ושלח הזמנה
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
