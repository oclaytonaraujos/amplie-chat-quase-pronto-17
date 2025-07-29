-- Corrigir constraint de status da tabela conversas para incluir 'em-atendimento'
ALTER TABLE public.conversas 
DROP CONSTRAINT IF EXISTS conversas_status_check;

ALTER TABLE public.conversas 
ADD CONSTRAINT conversas_status_check 
CHECK (status IN ('ativo', 'pendente', 'finalizado', 'transferido', 'em-atendimento'));