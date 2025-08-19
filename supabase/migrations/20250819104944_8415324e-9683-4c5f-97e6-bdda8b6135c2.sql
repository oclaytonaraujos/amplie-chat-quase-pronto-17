-- Corrigir políticas básicas para permitir acesso 
-- Focar nas tabelas principais primeiro

-- 1. Políticas para contatos (substituir as antigas)
DROP POLICY IF EXISTS "Users can view company contacts simple" ON public.contatos;
CREATE POLICY "Users can view company contacts simple"
ON public.contatos FOR SELECT
USING (
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.empresa_id = contatos.empresa_id
  )
);

-- 2. Políticas para conversas
DROP POLICY IF EXISTS "Users can view company conversations simple" ON public.conversas;  
CREATE POLICY "Users can view company conversations simple"  
ON public.conversas FOR SELECT
USING (
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.empresa_id = conversas.empresa_id
  )
);

-- 3. Políticas para empresas 
DROP POLICY IF EXISTS "Users can view own company simple" ON public.empresas;
CREATE POLICY "Users can view own company simple"
ON public.empresas FOR SELECT  
USING (
  auth.uid() IS NOT NULL AND
  id IN (SELECT empresa_id FROM profiles WHERE id = auth.uid())
);

-- 4. Políticas para setores
DROP POLICY IF EXISTS "Users can view company setores simple" ON public.setores;
CREATE POLICY "Users can view company setores simple"
ON public.setores FOR SELECT
USING (
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.empresa_id = setores.empresa_id
  )
);

-- 5. Criar função segura para verificar super admin sem recursão
CREATE OR REPLACE FUNCTION public.is_user_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND cargo = 'super_admin'
  );
$$;