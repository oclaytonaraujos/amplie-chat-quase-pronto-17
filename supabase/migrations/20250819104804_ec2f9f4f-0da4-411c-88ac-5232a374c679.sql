-- Corrigir tabelas com RLS habilitado mas sem políticas
-- Verificar e criar políticas para tabelas que precisam

-- Políticas para tabelas que removemos as políticas anteriores
-- Recrear políticas simplificadas para outras tabelas que perderam as políticas

-- 1. Políticas para setores_sistema
CREATE POLICY IF NOT EXISTS "Users can manage company setores_sistema"
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

-- 2. Políticas para contatos 
CREATE POLICY IF NOT EXISTS "Users can view company contacts simple"
ON public.contatos FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.empresa_id = contatos.empresa_id
  )
);

-- 3. Políticas para conversas
CREATE POLICY IF NOT EXISTS "Users can view company conversations simple"  
ON public.conversas FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.empresa_id = conversas.empresa_id
  )
);

-- 4. Políticas para empresas 
CREATE POLICY IF NOT EXISTS "Users can view own company simple"
ON public.empresas FOR SELECT  
USING (
  id IN (SELECT empresa_id FROM profiles WHERE id = auth.uid())
);

-- 5. Políticas para mensagens
CREATE POLICY IF NOT EXISTS "Users can view company messages simple"
ON public.mensagens FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM conversas c
    JOIN profiles p ON p.empresa_id = c.empresa_id
    WHERE c.id = mensagens.conversa_id 
    AND p.id = auth.uid()
  )
);

-- 6. Políticas para setores
CREATE POLICY IF NOT EXISTS "Users can view company setores simple"
ON public.setores FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.empresa_id = setores.empresa_id
  )
);

-- 7. Políticas para transferencias
CREATE POLICY IF NOT EXISTS "Users can view company transfers simple"
ON public.transferencias FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM conversas c
    JOIN profiles p ON p.empresa_id = c.empresa_id
    WHERE c.id = transferencias.conversa_id 
    AND p.id = auth.uid()
  )
);