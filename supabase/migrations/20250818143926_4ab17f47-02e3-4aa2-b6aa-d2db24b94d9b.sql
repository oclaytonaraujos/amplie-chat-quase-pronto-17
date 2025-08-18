-- CORREÇÃO CRÍTICA: Restringir acesso público à tabela profiles
-- Remove políticas muito permissivas existentes
DROP POLICY IF EXISTS "Super admins podem ver todas as empresas" ON public.profiles;
DROP POLICY IF EXISTS "Super admins acesso empresas" ON public.profiles;

-- Política restritiva para visualização de perfis
CREATE POLICY "Users can only view own profile and company colleagues" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() = id OR 
  (
    empresa_id = (SELECT empresa_id FROM profiles WHERE id = auth.uid()) AND 
    auth.uid() IS NOT NULL
  )
);

-- Política para atualização de perfis (apenas próprio perfil)
CREATE POLICY "Users can only update own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

-- Super admins podem ver tudo mas apenas quando autenticados
CREATE POLICY "Super admins can view all profiles when authenticated" 
ON public.profiles 
FOR SELECT 
USING (
  is_super_admin() AND auth.uid() IS NOT NULL
);

-- Política para criação de perfis (apenas sistema e super admins)
CREATE POLICY "Only system and super admins can create profiles" 
ON public.profiles 
FOR INSERT 
WITH CHECK (
  is_super_admin() OR 
  auth.uid() IS NULL -- Permite criação via trigger do sistema
);

-- Remover exposição desnecessária de dados sensíveis
-- Criar view segura para dados públicos de usuários
CREATE OR REPLACE VIEW public.safe_profiles AS
SELECT 
  id,
  nome,
  cargo,
  setor,
  status,
  CASE 
    WHEN is_super_admin() OR empresa_id = (SELECT empresa_id FROM profiles WHERE id = auth.uid())
    THEN email 
    ELSE NULL 
  END as email,
  empresa_id,
  created_at
FROM public.profiles
WHERE 
  auth.uid() = id OR 
  empresa_id = (SELECT empresa_id FROM profiles WHERE id = auth.uid()) OR
  is_super_admin();

-- Função para obter dados seguros do usuário atual
CREATE OR REPLACE FUNCTION public.get_current_user_safe()
RETURNS TABLE(
  id uuid,
  nome text,
  email text,
  cargo text,
  setor text,
  empresa_id uuid,
  status text
) 
LANGUAGE SQL 
SECURITY DEFINER 
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.nome,
    p.email,
    p.cargo,
    p.setor,
    p.empresa_id,
    p.status
  FROM public.profiles p
  WHERE p.id = auth.uid();
$$;