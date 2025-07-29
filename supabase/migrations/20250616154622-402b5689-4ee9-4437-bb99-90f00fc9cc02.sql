
-- Remover políticas existentes da tabela empresas
DROP POLICY IF EXISTS "Usuários podem ver própria empresa" ON public.empresas;

-- Criar novas políticas para empresas
-- Super admins podem ver todas as empresas
CREATE POLICY "Super admins podem ver todas as empresas" ON public.empresas 
  FOR SELECT TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND cargo = 'super_admin'
    )
    OR 
    id = (SELECT empresa_id FROM public.profiles WHERE id = auth.uid())
  );

-- Super admins podem criar empresas
CREATE POLICY "Super admins podem criar empresas" ON public.empresas 
  FOR INSERT TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND cargo = 'super_admin'
    )
  );

-- Super admins podem atualizar empresas
CREATE POLICY "Super admins podem atualizar empresas" ON public.empresas 
  FOR UPDATE TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND cargo = 'super_admin'
    )
  );

-- Super admins podem deletar empresas
CREATE POLICY "Super admins podem deletar empresas" ON public.empresas 
  FOR DELETE TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND cargo = 'super_admin'
    )
  );
