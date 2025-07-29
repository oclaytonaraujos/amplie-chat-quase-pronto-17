
-- Corrigir políticas RLS para super_admin ter acesso total

-- Remover políticas existentes problemáticas
DROP POLICY IF EXISTS "Super admins podem ver todos os perfis" ON public.profiles;
DROP POLICY IF EXISTS "Super admins podem criar perfis" ON public.profiles;
DROP POLICY IF EXISTS "Super admins podem atualizar perfis" ON public.profiles;
DROP POLICY IF EXISTS "Super admins podem deletar perfis" ON public.profiles;

-- Criar políticas corretas para profiles
CREATE POLICY "Super admins acesso total profiles" ON public.profiles 
  FOR ALL TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.cargo = 'super_admin'
    )
    OR 
    id = auth.uid()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.cargo = 'super_admin'
    )
    OR 
    id = auth.uid()
  );

-- Habilitar RLS em todas as tabelas principais se não estiver habilitado
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contatos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.setores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transferencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zapi_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planos ENABLE ROW LEVEL SECURITY;

-- Políticas para contatos
DROP POLICY IF EXISTS "Super admins acesso contatos" ON public.contatos;
CREATE POLICY "Super admins acesso contatos" ON public.contatos 
  FOR ALL TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND cargo = 'super_admin'
    )
    OR 
    empresa_id = (SELECT empresa_id FROM public.profiles WHERE id = auth.uid())
  );

-- Políticas para conversas
DROP POLICY IF EXISTS "Super admins acesso conversas" ON public.conversas;
CREATE POLICY "Super admins acesso conversas" ON public.conversas 
  FOR ALL TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND cargo = 'super_admin'
    )
    OR 
    empresa_id = (SELECT empresa_id FROM public.profiles WHERE id = auth.uid())
  );

-- Políticas para mensagens
DROP POLICY IF EXISTS "Super admins acesso mensagens" ON public.mensagens;
CREATE POLICY "Super admins acesso mensagens" ON public.mensagens 
  FOR ALL TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND cargo = 'super_admin'
    )
    OR 
    EXISTS (
      SELECT 1 FROM public.conversas c
      WHERE c.id = conversa_id 
      AND c.empresa_id = (SELECT empresa_id FROM public.profiles WHERE id = auth.uid())
    )
  );

-- Políticas para setores
DROP POLICY IF EXISTS "Super admins acesso setores" ON public.setores;
CREATE POLICY "Super admins acesso setores" ON public.setores 
  FOR ALL TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND cargo = 'super_admin'
    )
    OR 
    empresa_id = (SELECT empresa_id FROM public.profiles WHERE id = auth.uid())
  );

-- Políticas para transferencias
DROP POLICY IF EXISTS "Super admins acesso transferencias" ON public.transferencias;
CREATE POLICY "Super admins acesso transferencias" ON public.transferencias 
  FOR ALL TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND cargo = 'super_admin'
    )
    OR 
    EXISTS (
      SELECT 1 FROM public.conversas c
      WHERE c.id = conversa_id 
      AND c.empresa_id = (SELECT empresa_id FROM public.profiles WHERE id = auth.uid())
    )
  );

-- Políticas para whatsapp_connections
DROP POLICY IF EXISTS "Super admins acesso whatsapp" ON public.whatsapp_connections;
CREATE POLICY "Super admins acesso whatsapp" ON public.whatsapp_connections 
  FOR ALL TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND cargo = 'super_admin'
    )
    OR 
    empresa_id = (SELECT empresa_id FROM public.profiles WHERE id = auth.uid())
  );

-- Políticas para zapi_config
DROP POLICY IF EXISTS "Super admins acesso zapi" ON public.zapi_config;
CREATE POLICY "Super admins acesso zapi" ON public.zapi_config 
  FOR ALL TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND cargo = 'super_admin'
    )
    OR 
    empresa_id = (SELECT empresa_id FROM public.profiles WHERE id = auth.uid())
  );

-- Políticas para planos (super admin pode ver todos)
DROP POLICY IF EXISTS "Super admins acesso planos" ON public.planos;
CREATE POLICY "Super admins acesso planos" ON public.planos 
  FOR ALL TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND cargo = 'super_admin'
    )
  );
