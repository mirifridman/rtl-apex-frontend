-- Create junction table for multiple task assignees
CREATE TABLE public.task_assignees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(task_id, employee_id)
);

-- Enable RLS
ALTER TABLE public.task_assignees ENABLE ROW LEVEL SECURITY;

-- CEO can manage all task assignees
CREATE POLICY "CEO can manage task assignees"
ON public.task_assignees
FOR ALL
USING (is_ceo(auth.uid()))
WITH CHECK (is_ceo(auth.uid()));

-- Team members can view their own assignments
CREATE POLICY "Team members can view own assignments"
ON public.task_assignees
FOR SELECT
USING (employee_id IN (
    SELECT id FROM public.employees WHERE user_id = auth.uid()
));

-- Create index for faster lookups
CREATE INDEX idx_task_assignees_task_id ON public.task_assignees(task_id);
CREATE INDEX idx_task_assignees_employee_id ON public.task_assignees(employee_id);