import { useState } from "react";
import { Filter, Users, Calendar, Flag, Clock, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TaskPriority, TaskStatus, Employee } from "./PendingTaskCard";

export type FilterType = "employee" | "priority" | "status" | "deadline" | "created";
export type SortDirection = "asc" | "desc";

export interface ActiveFilter {
  type: FilterType;
  value: string;
  label: string;
}

export interface FilterOptions {
  employees: Employee[];
  onFilterChange: (filters: ActiveFilter[]) => void;
  onSortChange: (sortBy: string, direction: SortDirection) => void;
  activeFilters: ActiveFilter[];
  sortBy: string;
  sortDirection: SortDirection;
}

const priorityLabels: Record<TaskPriority, string> = {
  low: "נמוכה",
  medium: "בינונית",
  high: "גבוהה",
  urgent: "דחוף",
};

const statusLabels: Record<TaskStatus, string> = {
  new: "חדשה",
  approved: "מאושרת",
  in_progress: "בעבודה",
  partially_done: "הושלם חלקית",
  stuck: "תקוע",
  done: "הושלמה",
};

const deadlineOptions = [
  { value: "overdue", label: "באיחור" },
  { value: "today", label: "היום" },
  { value: "week", label: "השבוע" },
  { value: "month", label: "החודש" },
  { value: "no_deadline", label: "ללא דד-ליין" },
];

const sortOptions = [
  { value: "created_at", label: "תאריך הקמה", icon: Clock },
  { value: "deadline", label: "דד-ליין", icon: Calendar },
  { value: "priority", label: "עדיפות", icon: Flag },
];

export function TaskFilters({
  employees,
  onFilterChange,
  onSortChange,
  activeFilters,
  sortBy,
  sortDirection,
}: FilterOptions) {
  const addFilter = (type: FilterType, value: string, label: string) => {
    // Check if filter already exists
    const exists = activeFilters.some(f => f.type === type && f.value === value);
    if (!exists) {
      onFilterChange([...activeFilters, { type, value, label }]);
    }
  };

  const removeFilter = (type: FilterType, value: string) => {
    onFilterChange(activeFilters.filter(f => !(f.type === type && f.value === value)));
  };

  const clearAllFilters = () => {
    onFilterChange([]);
  };

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      onSortChange(field, sortDirection === "asc" ? "desc" : "asc");
    } else {
      onSortChange(field, "desc");
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter Buttons Row */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="w-4 h-4" />
          <span className="font-medium">פילוח:</span>
        </div>

        {/* Employee Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 rounded-full glass-card">
              <Users className="w-4 h-4" />
              עובד
              <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="bg-background border-border z-50 min-w-[180px]">
            <DropdownMenuLabel>בחר עובד</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {employees.length === 0 ? (
              <DropdownMenuItem disabled>אין עובדים</DropdownMenuItem>
            ) : (
              employees.map((emp) => (
                <DropdownMenuItem
                  key={emp.id}
                  onClick={() => addFilter("employee", emp.id, emp.name)}
                  className="cursor-pointer"
                >
                  <Users className="w-4 h-4 ml-2" />
                  {emp.name}
                </DropdownMenuItem>
              ))
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => addFilter("employee", "unassigned", "לא משויך")}
              className="cursor-pointer text-warning"
            >
              <Users className="w-4 h-4 ml-2" />
              לא משויך
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Priority Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 rounded-full glass-card">
              <Flag className="w-4 h-4" />
              עדיפות
              <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="bg-background border-border z-50">
            <DropdownMenuLabel>בחר עדיפות</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {(Object.keys(priorityLabels) as TaskPriority[]).map((priority) => (
              <DropdownMenuItem
                key={priority}
                onClick={() => addFilter("priority", priority, priorityLabels[priority])}
                className="cursor-pointer"
              >
                <Badge variant="outline" className={cn("text-xs", `priority-${priority}`)}>
                  {priorityLabels[priority]}
                </Badge>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Status Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 rounded-full glass-card">
              <Clock className="w-4 h-4" />
              סטטוס
              <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="bg-background border-border z-50">
            <DropdownMenuLabel>בחר סטטוס</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {(Object.keys(statusLabels) as TaskStatus[]).map((status) => (
              <DropdownMenuItem
                key={status}
                onClick={() => addFilter("status", status, statusLabels[status])}
                className="cursor-pointer"
              >
                <Badge variant="outline" className={cn("text-xs", `status-${status}`)}>
                  {statusLabels[status]}
                </Badge>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Deadline Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 rounded-full glass-card">
              <Calendar className="w-4 h-4" />
              דד-ליין
              <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="bg-background border-border z-50">
            <DropdownMenuLabel>סנן לפי דד-ליין</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {deadlineOptions.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => addFilter("deadline", option.value, option.label)}
                className="cursor-pointer"
              >
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Sort Options */}
        <div className="h-6 w-px bg-border mx-2" />
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-medium">מיון:</span>
        </div>

        {sortOptions.map((option) => (
          <Button
            key={option.value}
            variant={sortBy === option.value ? "default" : "outline"}
            size="sm"
            className={cn(
              "gap-2 rounded-full",
              sortBy !== option.value && "glass-card"
            )}
            onClick={() => toggleSort(option.value)}
          >
            <option.icon className="w-4 h-4" />
            {option.label}
            {sortBy === option.value && (
              <span className="text-xs">
                {sortDirection === "asc" ? "↑" : "↓"}
              </span>
            )}
          </Button>
        ))}
      </div>

      {/* Active Filters Display */}
      {activeFilters.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">מסננים פעילים:</span>
          {activeFilters.map((filter) => {
            // Determine the badge style based on filter type
            let badgeClass = "bg-primary/20 text-primary border border-primary/30";
            if (filter.type === "status") {
              badgeClass = `status-${filter.value}`;
            } else if (filter.type === "priority") {
              badgeClass = `priority-${filter.value}`;
            }
            
            return (
              <Badge
                key={`${filter.type}-${filter.value}`}
                variant="secondary"
                className={cn("gap-1.5 pr-2 pl-1 py-1 rounded-full", badgeClass)}
              >
                {filter.label}
                <button
                  onClick={() => removeFilter(filter.type, filter.value)}
                  className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            );
          })}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-xs text-muted-foreground hover:text-destructive"
          >
            נקה הכל
          </Button>
        </div>
      )}
    </div>
  );
}
