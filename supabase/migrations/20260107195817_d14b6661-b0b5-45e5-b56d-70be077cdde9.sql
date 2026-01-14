-- Create enum for procedure status
CREATE TYPE public.procedure_status AS ENUM ('draft', 'active', 'cancelled');

-- Create enum for decision status
CREATE TYPE public.decision_status AS ENUM ('active', 'cancelled', 'replaced');

-- Create procedures table
CREATE TABLE public.procedures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  status procedure_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create decisions table
CREATE TABLE public.decisions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  decision_date DATE NOT NULL DEFAULT CURRENT_DATE,
  source_meeting TEXT,
  procedure_id UUID REFERENCES public.procedures(id) ON DELETE SET NULL,
  status decision_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decisions ENABLE ROW LEVEL SECURITY;

-- RLS policies for procedures
CREATE POLICY "CEO can manage procedures" 
ON public.procedures 
FOR ALL 
USING (is_ceo(auth.uid()))
WITH CHECK (is_ceo(auth.uid()));

CREATE POLICY "All authenticated can view active procedures" 
ON public.procedures 
FOR SELECT 
USING (status = 'active' OR is_ceo(auth.uid()));

-- RLS policies for decisions
CREATE POLICY "CEO can manage decisions" 
ON public.decisions 
FOR ALL 
USING (is_ceo(auth.uid()))
WITH CHECK (is_ceo(auth.uid()));

CREATE POLICY "All authenticated can view active decisions" 
ON public.decisions 
FOR SELECT 
USING (status = 'active' OR is_ceo(auth.uid()));

-- Triggers for updated_at
CREATE TRIGGER update_procedures_updated_at
BEFORE UPDATE ON public.procedures
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_decisions_updated_at
BEFORE UPDATE ON public.decisions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.procedures;
ALTER PUBLICATION supabase_realtime ADD TABLE public.decisions;