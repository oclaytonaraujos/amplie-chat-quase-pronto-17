-- Função para assumir conversa atomicamente (evita condições de corrida)
CREATE OR REPLACE FUNCTION public.assumir_conversa_atomico(
  p_conversa_id UUID,
  p_agente_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Tentar atualizar a conversa apenas se não tiver agente
  UPDATE public.conversas 
  SET agente_id = p_agente_id, 
      status = 'ativo',
      updated_at = NOW()
  WHERE id = p_conversa_id 
    AND agente_id IS NULL;
  
  -- Retornar true se conseguiu atualizar
  RETURN FOUND;
END;
$$;

-- Função para incrementar atendimentos do setor
CREATE OR REPLACE FUNCTION public.increment_setor_atendimentos(setor_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.setores 
  SET atendimentos_ativos = atendimentos_ativos + 1
  WHERE id = setor_id;
END;
$$;

-- Função para decrementar atendimentos do setor  
CREATE OR REPLACE FUNCTION public.decrement_setor_atendimentos(setor_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.setores 
  SET atendimentos_ativos = GREATEST(atendimentos_ativos - 1, 0)
  WHERE id = setor_id;
END;
$$;