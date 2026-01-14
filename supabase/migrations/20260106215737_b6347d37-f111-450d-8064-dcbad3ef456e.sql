-- Add topic field to tasks table
ALTER TABLE public.tasks ADD COLUMN topic TEXT;

-- Enable realtime for task_assignees
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_assignees;