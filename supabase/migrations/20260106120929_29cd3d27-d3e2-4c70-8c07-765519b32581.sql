-- Drop existing restrictive policies on tasks
DROP POLICY IF EXISTS "CEO can manage all tasks" ON public.tasks;
DROP POLICY IF EXISTS "CEO can view all tasks" ON public.tasks;
DROP POLICY IF EXISTS "Team members can update assigned tasks" ON public.tasks;
DROP POLICY IF EXISTS "Team members can view assigned tasks" ON public.tasks;

-- Create permissive policies (default behavior - OR logic)
CREATE POLICY "CEO can view all tasks" 
ON public.tasks 
FOR SELECT 
TO authenticated
USING (is_ceo(auth.uid()));

CREATE POLICY "CEO can manage all tasks" 
ON public.tasks 
FOR ALL 
TO authenticated
USING (is_ceo(auth.uid()));

CREATE POLICY "Team members can view assigned tasks" 
ON public.tasks 
FOR SELECT 
TO authenticated
USING (
  assigned_to IN (
    SELECT id FROM public.employees WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Team members can update assigned tasks" 
ON public.tasks 
FOR UPDATE 
TO authenticated
USING (
  assigned_to IN (
    SELECT id FROM public.employees WHERE user_id = auth.uid()
  )
);