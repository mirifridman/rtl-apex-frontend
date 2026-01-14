-- Allow all inserts to decisions table (for n8n automation)
CREATE POLICY "Allow all inserts" 
ON public.decisions 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);