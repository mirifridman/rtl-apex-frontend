-- Add 'partially_done' to task_status enum
ALTER TYPE task_status ADD VALUE 'partially_done';

-- Create task_notes table for notes/comments on tasks
CREATE TABLE public.task_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.task_notes ENABLE ROW LEVEL SECURITY;

-- RLS policies - CEO can do everything
CREATE POLICY "CEO can manage task notes"
ON public.task_notes
FOR ALL
USING (is_ceo(auth.uid()))
WITH CHECK (is_ceo(auth.uid()));

-- Team members can view notes on their assigned tasks
CREATE POLICY "Team members can view notes on assigned tasks"
ON public.task_notes
FOR SELECT
USING (
  task_id IN (
    SELECT t.id FROM tasks t
    WHERE t.assigned_to IN (
      SELECT e.id FROM employees e WHERE e.user_id = auth.uid()
    )
  )
);

-- Team members can add notes to their assigned tasks
CREATE POLICY "Team members can add notes to assigned tasks"
ON public.task_notes
FOR INSERT
WITH CHECK (
  task_id IN (
    SELECT t.id FROM tasks t
    WHERE t.assigned_to IN (
      SELECT e.id FROM employees e WHERE e.user_id = auth.uid()
    )
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_task_notes_updated_at
BEFORE UPDATE ON public.task_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for task_notes
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_notes;