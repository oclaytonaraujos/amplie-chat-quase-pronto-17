-- Adicionar campo status na tabela contatos se não existir
ALTER TABLE public.contatos 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'ativo'::text 
CHECK (status IN ('ativo', 'inativo', 'bloqueado'));

-- Atualizar contatos existentes que não têm status
UPDATE public.contatos 
SET status = 'ativo' 
WHERE status IS NULL;