-- Create project_status enum
CREATE TYPE public.project_status AS ENUM ('planning', 'active', 'on_hold', 'completed');

-- Create project_priority enum
CREATE TYPE public.project_priority AS ENUM ('low', 'medium', 'high');

-- Create security_document_status enum
CREATE TYPE public.security_document_status AS ENUM ('draft', 'active', 'archived');

-- Create security_document_category enum
CREATE TYPE public.security_document_category AS ENUM ('policy', 'procedure', 'form', 'approval');

-- Create projects table
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  status project_status NOT NULL DEFAULT 'planning',
  priority project_priority NOT NULL DEFAULT 'medium',
  start_date date,
  due_date date,
  owner_id uuid REFERENCES public.profiles(id),
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add project_id to tasks table
ALTER TABLE public.tasks ADD COLUMN project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL;

-- Add project_id to decisions table
ALTER TABLE public.decisions ADD COLUMN project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL;

-- Create documents table for file attachments
CREATE TABLE public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_type text,
  file_size integer,
  entity_type text NOT NULL CHECK (entity_type IN ('task', 'decision', 'project')),
  entity_id uuid NOT NULL,
  uploaded_by uuid REFERENCES public.profiles(id),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create security_documents table
CREATE TABLE public.security_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category security_document_category NOT NULL DEFAULT 'policy',
  file_path text,
  version text,
  effective_date date,
  review_date date,
  status security_document_status NOT NULL DEFAULT 'draft',
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_documents ENABLE ROW LEVEL SECURITY;

-- Projects RLS policies
CREATE POLICY "Authenticated users can view projects" ON public.projects FOR SELECT USING (true);
CREATE POLICY "CEO can manage projects" ON public.projects FOR ALL USING (is_ceo(auth.uid())) WITH CHECK (is_ceo(auth.uid()));
CREATE POLICY "Managers can create projects" ON public.projects FOR INSERT WITH CHECK (is_manager(auth.uid()));
CREATE POLICY "Managers can update projects" ON public.projects FOR UPDATE USING (is_manager(auth.uid()));
CREATE POLICY "Managers can delete projects" ON public.projects FOR DELETE USING (is_manager(auth.uid()));

-- Documents RLS policies
CREATE POLICY "Authenticated users can view documents" ON public.documents FOR SELECT USING (true);
CREATE POLICY "Authenticated users can upload documents" ON public.documents FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "CEO can manage documents" ON public.documents FOR ALL USING (is_ceo(auth.uid())) WITH CHECK (is_ceo(auth.uid()));
CREATE POLICY "Uploaders can delete own documents" ON public.documents FOR DELETE USING (uploaded_by = auth.uid());

-- Security documents RLS policies (admin/manager only)
CREATE POLICY "Admins and managers can view security documents" ON public.security_documents FOR SELECT USING (is_manager(auth.uid()));
CREATE POLICY "CEO can manage security documents" ON public.security_documents FOR ALL USING (is_ceo(auth.uid())) WITH CHECK (is_ceo(auth.uid()));
CREATE POLICY "Admins can manage security documents" ON public.security_documents FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

-- Create updated_at triggers
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_security_documents_updated_at BEFORE UPDATE ON public.security_documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create documents storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

-- Storage policies for documents bucket
CREATE POLICY "Authenticated users can upload documents" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can view documents" ON storage.objects FOR SELECT USING (bucket_id = 'documents' AND auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete own uploaded documents" ON storage.objects FOR DELETE USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "CEO can manage all documents" ON storage.objects FOR ALL USING (bucket_id = 'documents' AND is_ceo(auth.uid()));