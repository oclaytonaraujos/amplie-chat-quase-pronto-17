-- Add finished_at column to conversas table
ALTER TABLE public.conversas 
ADD COLUMN finished_at TIMESTAMP WITH TIME ZONE NULL;

-- Add resumo_atendimento column if it doesn't exist (for storing summary when finishing)
ALTER TABLE public.conversas 
ADD COLUMN IF NOT EXISTS resumo_atendimento TEXT NULL;