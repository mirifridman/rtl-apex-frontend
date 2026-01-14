-- Create helper functions for new roles
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin') OR public.has_role(_user_id, 'ceo')
$$;

CREATE OR REPLACE FUNCTION public.is_manager(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_admin(_user_id) OR public.has_role(_user_id, 'manager')
$$;

CREATE OR REPLACE FUNCTION public.is_editor(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_manager(_user_id) OR public.has_role(_user_id, 'editor')
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role::text FROM public.user_roles WHERE user_id = _user_id ORDER BY 
      CASE role 
        WHEN 'ceo' THEN 1 
        WHEN 'admin' THEN 2 
        WHEN 'manager' THEN 3 
        WHEN 'editor' THEN 4 
        WHEN 'team_member' THEN 5
        WHEN 'viewer' THEN 6 
      END 
      LIMIT 1),
    'viewer'
  )
$$;

-- Update profiles RLS to allow users to update their theme_preference
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Add policy for admins to view all profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (is_admin(auth.uid()));

-- Add policy for admins to manage user_roles
DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;
CREATE POLICY "Admins can manage user roles"
ON public.user_roles
FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));