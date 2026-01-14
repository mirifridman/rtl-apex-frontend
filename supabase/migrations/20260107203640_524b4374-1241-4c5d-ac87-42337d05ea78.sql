-- Allow all deletes on decisions table
CREATE POLICY "Allow all deletes" 
ON public.decisions 
FOR DELETE 
TO anon, authenticated
USING (true);