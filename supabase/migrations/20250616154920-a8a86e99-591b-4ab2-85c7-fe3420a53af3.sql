
-- Habilitar RLS na tabela profiles se não estiver habilitado
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes para evitar conflitos
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Super admins podem ver todos os perfis
CREATE POLICY "Super admins podem ver todos os perfis" ON public.profiles 
  FOR SELECT TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.cargo = 'super_admin'
    )
    OR 
    id = auth.uid()
  );

-- Super admins podem criar perfis
CREATE POLICY "Super admins podem criar perfis" ON public.profiles 
  FOR INSERT TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.cargo = 'super_admin'
    )
    OR 
    id = auth.uid()
  );

-- Super admins podem atualizar perfis
CREATE POLICY "Super admins podem atualizar perfis" ON public.profiles 
  FOR UPDATE TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.cargo = 'super_admin'
    )
    OR 
    id = auth.uid()
  );

-- Super admins podem deletar perfis
CREATE POLICY "Super admins podem deletar perfis" ON public.profiles 
  FOR DELETE TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.cargo = 'super_admin'
    )
  );

-- Adicionar campos de limite WhatsApp na tabela empresas se não existir
ALTER TABLE public.empresas 
ADD COLUMN IF NOT EXISTS limite_whatsapp_conexoes INTEGER DEFAULT 1;
