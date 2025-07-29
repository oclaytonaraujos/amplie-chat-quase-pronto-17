
-- Primeiro, vamos corrigir a constraint de status que está causando problema
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_status_check;

-- Recriar a constraint de status com valores corretos
ALTER TABLE public.profiles ADD CONSTRAINT profiles_status_check 
CHECK (status IN ('online', 'ausente', 'offline'));

-- Garantir que todos os registros tenham status válido
UPDATE public.profiles 
SET status = 'online' 
WHERE status NOT IN ('online', 'ausente', 'offline') OR status IS NULL;

-- Verificar se a coluna papel existe, se não, remover referências antigas
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='profiles' AND column_name='papel') THEN
        ALTER TABLE public.profiles DROP COLUMN papel;
    END IF;
END $$;

-- Garantir que a constraint de cargo está correta
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_cargo_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_cargo_check 
CHECK (cargo IN ('super_admin', 'admin', 'agente', 'usuario', 'supervisor'));

-- Corrigir a chave estrangeira se necessário
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
