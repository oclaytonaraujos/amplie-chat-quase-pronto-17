-- Completar otimizações e corrigir avisos de segurança

-- 6. Habilitar realtime para atualizações em tempo real
ALTER TABLE public.conversas REPLICA IDENTITY FULL;
ALTER TABLE public.mensagens REPLICA IDENTITY FULL;
ALTER TABLE public.contatos REPLICA IDENTITY FULL;

-- 7. Trigger para atualizar timestamp da conversa quando mensagem é criada
CREATE OR REPLACE FUNCTION public.atualizar_conversa_timestamp()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE public.conversas 
  SET updated_at = now() 
  WHERE id = NEW.conversa_id;
  RETURN NEW;
END;
$$;

-- Criar trigger se não existir
DROP TRIGGER IF EXISTS trigger_atualizar_conversa_timestamp ON public.mensagens;
CREATE TRIGGER trigger_atualizar_conversa_timestamp
  AFTER INSERT ON public.mensagens
  FOR EACH ROW EXECUTE FUNCTION public.atualizar_conversa_timestamp();

-- 8. Função para finalizar atendimento - corrigida
CREATE OR REPLACE FUNCTION public.finalizar_atendimento(
  p_conversa_id uuid,
  p_agente_id uuid
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  row_count integer;
BEGIN
  -- Finalizar apenas se o agente for o responsável pela conversa
  UPDATE public.conversas 
  SET 
    status = 'finalizado',
    updated_at = now()
  WHERE id = p_conversa_id 
    AND agente_id = p_agente_id;
  
  GET DIAGNOSTICS row_count = ROW_COUNT;
  RETURN row_count > 0;
END;
$$;

-- 9. Corrigir search_path das funções existentes que estavam com aviso
CREATE OR REPLACE FUNCTION public.assumir_conversa(
  p_conversa_id uuid,
  p_agente_id uuid
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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
SET search_path = 'public'
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