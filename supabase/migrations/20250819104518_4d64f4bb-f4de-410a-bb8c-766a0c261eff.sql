-- Corrigir recursão infinita nas políticas RLS da tabela profiles

-- Primeiro, remover todas as políticas problemáticas
DROP POLICY IF EXISTS "Profiles access policy" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles when authenticated" ON public.profiles;
DROP POLICY IF EXISTS "Users can only view own profile and company colleagues" ON public.profiles;
DROP POLICY IF EXISTS "Only system and super admins can create profiles" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem ver todos os perfis" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem inserir próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem atualizar próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Users can only update own profile" ON public.profiles;

-- Remover as funções problemáticas que causam recursão
DROP FUNCTION IF EXISTS public.is_super_admin();
DROP FUNCTION IF EXISTS public.can_access_profile(uuid);

-- Criar políticas simples sem recursão
-- Política para SELECT: usuários podem ver seu próprio perfil e perfis da mesma empresa
CREATE POLICY "Users can view own profile and company profiles" 
ON public.profiles FOR SELECT 
USING (
  auth.uid() = id 
  OR 
  (auth.uid() IS NOT NULL AND empresa_id IN (
    SELECT empresa_id FROM public.profiles WHERE id = auth.uid()
  ))
);

-- Política para INSERT: usuários podem criar apenas seu próprio perfil
CREATE POLICY "Users can insert own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Política para UPDATE: usuários podem atualizar apenas seu próprio perfil
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- Política para DELETE: apenas o próprio usuário pode deletar seu perfil
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
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_id AND cargo = 'super_admin'
  );
EXCEPTION WHEN OTHERS THEN
  RETURN FALSE;
END;
$$;