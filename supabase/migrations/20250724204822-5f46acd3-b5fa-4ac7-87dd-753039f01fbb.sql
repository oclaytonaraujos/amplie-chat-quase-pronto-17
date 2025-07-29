-- Adicionar coluna para resumo do atendimento na tabela conversas
ALTER TABLE public.conversas 
ADD COLUMN resumo_atendimento TEXT;

-- Adicionar comentário para documentar a coluna
COMMENT ON COLUMN public.conversas.resumo_atendimento IS 'Resumo opcional do atendimento preenchido pelo agente ao finalizar';