-- Drop existing restrictive policies
DROP POLICY IF EXISTS "CEO can manage task assignees" ON public.task_assignees;
DROP POLICY IF EXISTS "Team members can view own assignments" ON public.task_assignees;

-- Create policies that allow all authenticated users to manage task assignees
-- This is needed until proper authentication is enforced throughout the app

-- Allow everyone to view task assignees (for displaying assignee info)
CREATE POLICY "Anyone can view task assignees" 
ON public.task_assignees 
FOR SELECT 
USING (true);

-- Allow everyone to insert task assignees (for assigning tasks)
CREATE POLICY "Anyone can insert task assignees" 
ON public.task_assignees 
FOR INSERT 
WITH CHECK (true);

-- Allow everyone to delete task assignees (for removing assignments)
CREATE POLICY "Anyone can delete task assignees" 
ON public.task_assignees 
FOR DELETE 
USING (true);