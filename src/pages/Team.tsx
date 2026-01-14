import { useState } from "react";
import { DashboardLayout } from "@/components/layout";
import { EmployeeCard, EmployeeFormDialog, EmployeeTasksDialog } from "@/components/team";
import { useEmployees, useCreateEmployee, useUpdateEmployee, useDeleteEmployee } from "@/hooks/useEmployees";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Search, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Employee, CreateEmployeeData, UpdateEmployeeData } from "@/hooks/useEmployees";

export default function TeamPage() {
  const { data: employees = [], isLoading } = useEmployees();
  const createEmployee = useCreateEmployee();
  const updateEmployee = useUpdateEmployee();
  const deleteEmployee = useDeleteEmployee();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [tasksDialogOpen, setTasksDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Fetch task counts for all employees
  const { data: taskCounts = {} } = useQuery({
    queryKey: ["employee-task-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_assignees")
        .select(`
          employee_id,
          tasks!inner(status)
        `)
        .neq("tasks.status", "done");

      if (error) throw error;

      const counts: Record<string, number> = {};
      data.forEach((item) => {
        counts[item.employee_id] = (counts[item.employee_id] || 0) + 1;
      });
      return counts;
    },
  });

  // Filter employees by search
  const filteredEmployees = employees.filter((emp) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      emp.name.toLowerCase().includes(query) ||
      emp.role?.toLowerCase().includes(query) ||
      emp.email?.toLowerCase().includes(query)
    );
  });

  // Separate active and inactive
  const activeEmployees = filteredEmployees.filter((e) => e.isActive);
  const inactiveEmployees = filteredEmployees.filter((e) => !e.isActive);

  const handleAddNew = () => {
    setSelectedEmployee(null);
    setIsCreating(true);
    setFormDialogOpen(true);
  };

  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsCreating(false);
    setFormDialogOpen(true);
  };

  const handleViewTasks = (employee: Employee) => {
    setSelectedEmployee(employee);
    setTasksDialogOpen(true);
  };

  const handleSave = (data: CreateEmployeeData | { employeeId: string; updates: UpdateEmployeeData }) => {
    if ("employeeId" in data) {
      // Update
      updateEmployee.mutate(data, {
        onSuccess: () => {
          toast({ title: "העובד עודכן בהצלחה" });
          setFormDialogOpen(false);
        },
        onError: () => {
          toast({ title: "שגיאה בעדכון העובד", variant: "destructive" });
        },
      });
    } else {
      // Create
      createEmployee.mutate(data, {
        onSuccess: () => {
          toast({ title: "העובד נוסף בהצלחה" });
          setFormDialogOpen(false);
        },
        onError: () => {
          toast({ title: "שגיאה בהוספת העובד", variant: "destructive" });
        },
      });
    }
  };

  const handleDelete = (employeeId: string) => {
    deleteEmployee.mutate(employeeId, {
      onSuccess: () => {
        toast({ title: "העובד נמחק בהצלחה" });
        setFormDialogOpen(false);
        setTasksDialogOpen(false);
      },
      onError: () => {
        toast({ title: "שגיאה במחיקת העובד", variant: "destructive" });
      },
    });
  };

  const handleEditFromTasks = () => {
    setTasksDialogOpen(false);
    setIsCreating(false);
    setFormDialogOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center glow-primary">
              <Users className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">ניהול צוות</h1>
              <p className="text-muted-foreground">
                {employees.length} עובדים • {activeEmployees.length} פעילים
              </p>
            </div>
          </div>

          <Button
            onClick={handleAddNew}
            className="gradient-primary glow-primary rounded-2xl"
          >
            <Plus className="w-4 h-4 ml-2" />
            הוסף עובד
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="חיפוש עובדים..."
            className="pr-10 glass-card rounded-2xl"
          />
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              {searchQuery ? "לא נמצאו תוצאות" : "אין עובדים עדיין"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? "נסה לחפש במילים אחרות" : "הוסף עובד חדש כדי להתחיל"}
            </p>
            {!searchQuery && (
              <Button onClick={handleAddNew} className="gradient-primary glow-primary rounded-2xl">
                <Plus className="w-4 h-4 ml-2" />
                הוסף עובד
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {/* Active Employees */}
            {activeEmployees.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-4">
                  עובדים פעילים ({activeEmployees.length})
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {activeEmployees.map((employee) => (
                    <EmployeeCard
                      key={employee.id}
                      employee={employee}
                      taskCount={taskCounts[employee.id] || 0}
                      onClick={() => handleViewTasks(employee)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Inactive Employees */}
            {inactiveEmployees.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-muted-foreground mb-4">
                  לא פעילים ({inactiveEmployees.length})
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {inactiveEmployees.map((employee) => (
                    <EmployeeCard
                      key={employee.id}
                      employee={employee}
                      taskCount={taskCounts[employee.id] || 0}
                      onClick={() => handleViewTasks(employee)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <EmployeeFormDialog
        employee={isCreating ? null : selectedEmployee}
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        onSave={handleSave}
        onDelete={handleDelete}
        isSaving={createEmployee.isPending || updateEmployee.isPending}
        isDeleting={deleteEmployee.isPending}
      />

      <EmployeeTasksDialog
        employee={selectedEmployee}
        open={tasksDialogOpen}
        onOpenChange={setTasksDialogOpen}
        onEditEmployee={handleEditFromTasks}
      />
    </DashboardLayout>
  );
}
