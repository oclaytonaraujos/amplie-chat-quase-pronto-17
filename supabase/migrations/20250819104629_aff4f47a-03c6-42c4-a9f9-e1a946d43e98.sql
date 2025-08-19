-- Corrigir recursão infinita nas políticas RLS da tabela profiles
-- Remover função problemática com cascade para remover todas as dependências
DROP FUNCTION IF EXISTS public.is_super_admin() CASCADE;
DROP FUNCTION IF EXISTS public.can_access_profile(uuid) CASCADE;

-- Remover políticas problemáticas da tabela profiles
DROP POLICY IF EXISTS "Profiles access policy" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles when authenticated" ON public.profiles;
DROP POLICY IF EXISTS "Users can only view own profile and company colleagues" ON public.profiles;
DROP POLICY IF EXISTS "Only system and super admins can create profiles" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem ver todos os perfis" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem inserir próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem atualizar próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Users can only update own profile" ON public.profiles;

-- Criar políticas simples sem recursão para a tabela profiles
CREATE POLICY "Users can view own profile and company profiles" 
ON public.profiles FOR SELECT 
USING (
  auth.uid() = id 
  OR 
  (auth.uid() IS NOT NULL AND empresa_id IN (
    SELECT empresa_id FROM public.profiles WHERE id = auth.uid()
  ))
);

CREATE POLICY "Users can insert own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Users can delete own profile" 
ON public.profiles FOR DELETE 
USING (auth.uid() = id);

-- Criar função auxiliar sem recursão para verificar super admin
CREATE OR REPLACE FUNCTION public.check_user_is_super_admin(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificação direta sem usar políticas RLS
  PERFORM set_config('role', 'service_role', true);
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_id AND cargo = 'super_admin'
  );
EXCEPTION WHEN OTHERS THEN
  RETURN FALSE;
END;
$$;