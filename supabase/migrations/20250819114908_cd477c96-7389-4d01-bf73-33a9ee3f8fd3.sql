-- Fix recursive RLS on profiles and ensure profile auto-creation trigger
-- 1) Helper function to fetch current user's empresa_id without recursion
CREATE OR REPLACE FUNCTION public.current_user_empresa_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.empresa_id
  FROM public.profiles p
  WHERE p.id = auth.uid();
$$;

-- 2) Drop all existing policies on profiles to remove recursive ones
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN (
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
  END LOOP;
END $$;

-- 3) Recreate safe, non-recursive policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Service role full access
CREATE POLICY "Service role can manage profiles"
ON public.profiles
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Super admins - full visibility and management
CREATE POLICY "Super admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.is_user_super_admin());

CREATE POLICY "Super admins can update any profile"
ON public.profiles
FOR UPDATE
USING (public.is_user_super_admin());

CREATE POLICY "Super admins can delete any profile"
ON public.profiles
FOR DELETE
USING (public.is_user_super_admin());

CREATE POLICY "Super admins can insert any profile"
ON public.profiles
FOR INSERT
WITH CHECK (public.is_user_super_admin());

-- Authenticated users: view company profiles (and own)
CREATE POLICY "Users can view company profiles"
ON public.profiles
FOR SELECT
USING (
  id = auth.uid() OR empresa_id = public.current_user_empresa_id()
);

-- Users can insert/update their own profile
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (id = auth.uid());

-- 4) Ensure trigger to auto-create profiles exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
  END IF;
END $$;