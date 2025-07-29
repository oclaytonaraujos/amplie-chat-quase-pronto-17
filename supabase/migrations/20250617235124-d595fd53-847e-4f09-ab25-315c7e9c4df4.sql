
-- Criar tabela de setores no Supabase (caso não exista uma versão adequada)
-- Verificar se a tabela 'setores' já existe e tem a estrutura adequada
-- Se não, criar uma nova estrutura

-- Atualizar a tabela setores para ter a estrutura adequada
ALTER TABLE public.setores 
ADD COLUMN IF NOT EXISTS capacidade_maxima integer DEFAULT 10,
ADD COLUMN IF NOT EXISTS agentes_ativos integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS atendimentos_ativos integer DEFAULT 0;

-- Habilitar RLS na tabela setores
ALTER TABLE public.setores ENABLE ROW LEVEL SECURITY;

-- Criar políticas de RLS para setores
-- Usuários podem visualizar setores da sua empresa
CREATE POLICY "Users can view company sectors" 
  ON public.setores 
  FOR SELECT 
  USING (
    empresa_id IN (
      SELECT empresa_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Usuários podem inserir setores da sua empresa
CREATE POLICY "Users can create company sectors" 
  ON public.setores 
  FOR INSERT 
  WITH CHECK (
    empresa_id IN (
      SELECT empresa_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Usuários podem atualizar setores da sua empresa
CREATE POLICY "Users can update company sectors" 
  ON public.setores 
  FOR UPDATE 
  USING (
    empresa_id IN (
      SELECT empresa_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Usuários podem deletar setores da sua empresa
CREATE POLICY "Users can delete company sectors" 
  ON public.setores 
  FOR DELETE 
  USING (
    empresa_id IN (
      SELECT empresa_id FROM public.profiles WHERE id = auth.uid()
    )
  );
