-- Otimizações para o sistema de atendimento (corrigido)

-- 1. Adicionar índices para melhorar performance das consultas de atendimento
CREATE INDEX IF NOT EXISTS idx_conversas_agente_status ON public.conversas(agente_id, status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversas_empresa_status ON public.conversas(empresa_id, status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversas_status_updated ON public.conversas(status, updated_at DESC);

-- 2. Adicionar índices para mensagens por conversa
CREATE INDEX IF NOT EXISTS idx_mensagens_conversa_created ON public.mensagens(conversa_id, created_at DESC);

-- 3. Adicionar coluna para salvar estado de UI dos painéis nas preferências do usuário
ALTER TABLE public.user_appearance_settings 
ADD COLUMN IF NOT EXISTS atendimento_left_panel_collapsed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS atendimento_right_panel_collapsed boolean DEFAULT false;

-- 4. Função para assumir conversa de forma atômica (evita conflitos) - corrigida
CREATE OR REPLACE FUNCTION public.assumir_conversa(
  p_conversa_id uuid,
  p_agente_id uuid
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  row_count integer;
BEGIN
  -- Tentar assumir a conversa apenas se ela não tiver agente
  UPDATE public.conversas 
  SET 
    agente_id = p_agente_id,
    status = CASE 
      WHEN status = 'pendente' THEN 'em-atendimento'
      ELSE status 
    END,
    updated_at = now()
  WHERE id = p_conversa_id 
    AND (agente_id IS NULL OR agente_id = p_agente_id);
  
  GET DIAGNOSTICS row_count = ROW_COUNT;
  RETURN row_count > 0;
END;
$$;

-- 5. Função para obter atendimentos priorizados por agente
CREATE OR REPLACE FUNCTION public.obter_atendimentos_priorizados(
  p_agente_id uuid,
  p_empresa_id uuid
) RETURNS TABLE(
  id uuid,
  contato_id uuid,
  agente_id uuid,
  status text,
  canal text,
  prioridade text,
  setor text,
  tags text[],
  created_at timestamptz,
  updated_at timestamptz,
  contato_nome text,
  contato_telefone text,
  agente_nome text,
  eh_meu_atendimento boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.contato_id,
    c.agente_id,
    c.status,
    c.canal,
    c.prioridade,
    c.setor,
    c.tags,
    c.created_at,
    c.updated_at,
    ct.nome as contato_nome,
    ct.telefone as contato_telefone,
    p.nome as agente_nome,
    CASE WHEN c.agente_id = p_agente_id THEN true ELSE false END as eh_meu_atendimento
  FROM public.conversas c
  LEFT JOIN public.contatos ct ON ct.id = c.contato_id
  LEFT JOIN public.profiles p ON p.id = c.agente_id
  WHERE c.empresa_id = p_empresa_id
    AND c.status IN ('ativo', 'em-atendimento', 'pendente')
  ORDER BY 
    -- Meus atendimentos primeiro
    CASE WHEN c.agente_id = p_agente_id THEN 0 ELSE 1 END,
    -- Depois por prioridade
    CASE c.prioridade 
      WHEN 'alta' THEN 0 
      WHEN 'media' THEN 1 
      WHEN 'normal' THEN 2 
      WHEN 'baixa' THEN 3 
      ELSE 4 
    END,
    -- Por último, por data de atualização
    c.updated_at DESC;
END;
$$;