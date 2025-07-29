-- Adicionar colunas numero e descricao na tabela evolution_api_config
ALTER TABLE public.evolution_api_config 
ADD COLUMN IF NOT EXISTS numero TEXT,
ADD COLUMN IF NOT EXISTS descricao TEXT;