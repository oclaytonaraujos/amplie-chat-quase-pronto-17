
-- Remover a política problemática que causa recursão infinita
DROP POLICY IF EXISTS "Super admins acesso total profiles" ON public.profiles;

-- Criar função de segurança para verificar se o usuário é super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND cargo = 'super_admin'
  );
EXCEPTION WHEN OTHERS THEN
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Criar função para verificar se o usuário pode acessar seu próprio perfil
CREATE OR REPLACE FUNCTION public.can_access_profile(profile_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Super admin pode acessar qualquer perfil
  IF public.is_super_admin() THEN
    RETURN TRUE;
  END IF;
  
  -- Usuário pode acessar seu próprio perfil
  RETURN profile_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Criar política usando a função
CREATE POLICY "Profiles access policy" ON public.profiles 
  FOR ALL TO authenticated 
  USING (public.can_access_profile(id))
  WITH CHECK (public.can_access_profile(id));

-- Atualizar políticas das outras tabelas para usar a função is_super_admin
DROP POLICY IF EXISTS "Super admins acesso empresas" ON public.empresas;
CREATE POLICY "Super admins acesso empresas" ON public.empresas 
  FOR ALL TO authenticated 
  USING (
    public.is_super_admin()
    OR 
    id = (SELECT empresa_id FROM public.profiles WHERE id = auth.uid())
  );

-- Atualizar política de contatos
DROP POLICY IF EXISTS "Super admins acesso contatos" ON public.contatos;
CREATE POLICY "Super admins acesso contatos" ON public.contatos 
  FOR ALL TO authenticated 
  USING (
    public.is_super_admin()
    OR 
    empresa_id = (SELECT empresa_id FROM public.profiles WHERE id = auth.uid())
  );

-- Atualizar política de conversas
DROP POLICY IF EXISTS "Super admins acesso conversas" ON public.conversas;
CREATE POLICY "Super admins acesso conversas" ON public.conversas 
  FOR ALL TO authenticated 
  USING (
    public.is_super_admin()
    OR 
    empresa_id = (SELECT empresa_id FROM public.profiles WHERE id = auth.uid())
  );

-- Atualizar política de mensagens
DROP POLICY IF EXISTS "Super admins acesso mensagens" ON public.mensagens;
CREATE POLICY "Super admins acesso mensagens" ON public.mensagens 
  FOR ALL TO authenticated 
  USING (
    public.is_super_admin()
    OR 
    EXISTS (
      SELECT 1 FROM public.conversas c
      WHERE c.id = conversa_id 
      AND c.empresa_id = (SELECT empresa_id FROM public.profiles WHERE id = auth.uid())
    )
  );

-- Atualizar política de setores
DROP POLICY IF EXISTS "Super admins acesso setores" ON public.setores;
CREATE POLICY "Super admins acesso setores" ON public.setores 
  FOR ALL TO authenticated 
  USING (
    public.is_super_admin()
    OR 
    empresa_id = (SELECT empresa_id FROM public.profiles WHERE id = auth.uid())
  );

-- Atualizar política de transferencias
DROP POLICY IF EXISTS "Super admins acesso transferencias" ON public.transferencias;
CREATE POLICY "Super admins acesso transferencias" ON public.transferencias 
  FOR ALL TO authenticated 
  USING (
    public.is_super_admin()
    OR 
    EXISTS (
      SELECT 1 FROM public.conversas c
      WHERE c.id = conversa_id 
      AND c.empresa_id = (SELECT empresa_id FROM public.profiles WHERE id = auth.uid())
    )
  );

-- Atualizar política de whatsapp_connections
DROP POLICY IF EXISTS "Super admins acesso whatsapp" ON public.whatsapp_connections;
CREATE POLICY "Super admins acesso whatsapp" ON public.whatsapp_connections 
  FOR ALL TO authenticated 
  USING (
    public.is_super_admin()
    OR 
    empresa_id = (SELECT empresa_id FROM public.profiles WHERE id = auth.uid())
  );

-- Atualizar política de zapi_config
DROP POLICY IF EXISTS "Super admins acesso zapi" ON public.zapi_config;
CREATE POLICY "Super admins acesso zapi" ON public.zapi_config 
  FOR ALL TO authenticated 
  USING (
    public.is_super_admin()
    OR 
    empresa_id = (SELECT empresa_id FROM public.profiles WHERE id = auth.uid())
  );

-- Política de planos permanece a mesma
DROP POLICY IF EXISTS "Super admins acesso planos" ON public.planos;
CREATE POLICY "Super admins acesso planos" ON public.planos 
  FOR ALL TO authenticated 
  USING (public.is_super_admin());
