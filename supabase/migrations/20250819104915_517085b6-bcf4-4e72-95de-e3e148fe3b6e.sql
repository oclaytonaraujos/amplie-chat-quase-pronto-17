-- Corrigir tabelas com RLS habilitado mas sem políticas
-- Criar políticas simplificadas para tabelas que perderam as políticas

-- 1. Políticas para setores_sistema (se existir a tabela)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'setores_sistema') THEN
    DROP POLICY IF EXISTS "Users can manage company setores_sistema" ON public.setores_sistema;
    CREATE POLICY "Users can manage company setores_sistema"
    ON public.setores_sistema FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.id = auth.uid() 
        AND p.empresa_id IN (SELECT empresa_id FROM empresas WHERE id = setores_sistema.empresa_id)
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.id = auth.uid() 
        AND p.empresa_id IN (SELECT empresa_id FROM empresas WHERE id = setores_sistema.empresa_id)
      )
    );
  END IF;
END $$;

-- 2. Políticas para contatos 
DROP POLICY IF EXISTS "Users can view company contacts simple" ON public.contatos;
CREATE POLICY "Users can view company contacts simple"
ON public.contatos FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.empresa_id = contatos.empresa_id
  )
);

-- 3. Políticas para conversas
DROP POLICY IF EXISTS "Users can view company conversations simple" ON public.conversas;
CREATE POLICY "Users can view company conversations simple"  
ON public.conversas FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.empresa_id = conversas.empresa_id
  )
);

-- 4. Políticas para empresas 
DROP POLICY IF EXISTS "Users can view own company simple" ON public.empresas;
CREATE POLICY "Users can view own company simple"
ON public.empresas FOR SELECT  
USING (
  id IN (SELECT empresa_id FROM profiles WHERE id = auth.uid())
);

-- 5. Verificar se existe tabela mensagens e criar política
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'mensagens') THEN
    DROP POLICY IF EXISTS "Users can view company messages simple" ON public.mensagens;
    CREATE POLICY "Users can view company messages simple"
    ON public.mensagens FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM conversas c
        JOIN profiles p ON p.empresa_id = c.empresa_id
        WHERE c.id = mensagens.conversa_id 
        AND p.id = auth.uid()
      )
    );
  END IF;
END $$;

-- 6. Políticas para setores
DROP POLICY IF EXISTS "Users can view company setores simple" ON public.setores;
CREATE POLICY "Users can view company setores simple"
ON public.setores FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.empresa_id = setores.empresa_id
  )
);

-- 7. Verificar se existe tabela transferencias e criar política
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transferencias') THEN
    DROP POLICY IF EXISTS "Users can view company transfers simple" ON public.transferencias;
    CREATE POLICY "Users can view company transfers simple"
    ON public.transferencias FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM conversas c
        JOIN profiles p ON p.empresa_id = c.empresa_id
        WHERE c.id = transferencias.conversa_id 
        AND p.id = auth.uid()
      )
    );
  END IF;
END $$;