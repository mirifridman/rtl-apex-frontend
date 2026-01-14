-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('ceo', 'team_member');

-- Create enum for task status
CREATE TYPE public.task_status AS ENUM ('new', 'approved', 'in_progress', 'done');

-- Create enum for task priority
CREATE TYPE public.task_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table for permissions
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Create employees table for team members
CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tasks table
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status task_status NOT NULL DEFAULT 'new',
  priority task_priority NOT NULL DEFAULT 'medium',
  deadline TIMESTAMP WITH TIME ZONE,
  assigned_to UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to check if user is CEO
CREATE OR REPLACE FUNCTION public.is_ceo(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'ceo')
$$;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "CEO can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.is_ceo(auth.uid()));

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- User roles policies (only CEO can manage roles)
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "CEO can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.is_ceo(auth.uid()));

CREATE POLICY "CEO can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.is_ceo(auth.uid()));

-- Employees policies
CREATE POLICY "All authenticated users can view employees"
  ON public.employees FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "CEO can manage employees"
  ON public.employees FOR ALL
  TO authenticated
  USING (public.is_ceo(auth.uid()));

-- Tasks policies
CREATE POLICY "CEO can view all tasks"
  ON public.tasks FOR SELECT
  TO authenticated
  USING (public.is_ceo(auth.uid()));

CREATE POLICY "Team members can view assigned tasks"
  ON public.tasks FOR SELECT
  TO authenticated
  USING (
    assigned_to IN (
      SELECT id FROM public.employees WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "CEO can manage all tasks"
  ON public.tasks FOR ALL
  TO authenticated
  USING (public.is_ceo(auth.uid()));

CREATE POLICY "Team members can update assigned tasks"
  ON public.tasks FOR UPDATE
  TO authenticated
  USING (
    assigned_to IN (
      SELECT id FROM public.employees WHERE user_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, COALESCE(new.raw_user_meta_data ->> 'full_name', new.email));
  RETURN new;
END;
$$;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();