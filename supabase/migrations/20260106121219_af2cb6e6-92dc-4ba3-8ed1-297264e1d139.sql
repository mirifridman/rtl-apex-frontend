-- Re-enable RLS on tasks table
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "CEO can view all tasks" ON public.tasks;
DROP POLICY IF EXISTS "CEO can manage all tasks" ON public.tasks;
DROP POLICY IF EXISTS "Team members can view assigned tasks" ON public.tasks;
DROP POLICY IF EXISTS "Team members can update assigned tasks" ON public.tasks;

-- Create permissive policies (PERMISSIVE is the default)
-- CEO can do everything
CREATE POLICY "CEO can do everything" 
ON public.tasks 
FOR ALL 
TO authenticated
USING (is_ceo(auth.uid()))
WITH CHECK (is_ceo(auth.uid()));

-- Team members can view their assigned tasks
CREATE POLICY "Team members can view assigned tasks" 
ON public.tasks 
FOR SELECT 
TO authenticated
USING (
  assigned_to IN (
    SELECT id FROM public.employees WHERE user_id = auth.uid()
  )
);

-- Team members can update their assigned tasks
CREATE POLICY "Team members can update assigned tasks" 
ON public.tasks 
FOR UPDATE 
TO authenticated
USING (
  assigned_to IN (
    SELECT id FROM public.employees WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  assigned_to IN (
    SELECT id FROM public.employees WHERE user_id = auth.uid()
  )
);