
-- Primeiro, vamos verificar quais são os valores atuais de status que estão causando problema
-- e corrigir a constraint de status

-- Atualizar todos os registros com status inválido para 'online'
UPDATE public.profiles 
SET status = 'online' 
WHERE status NOT IN ('online', 'ausente', 'offline') OR status IS NULL;

-- Remover a constraint atual de status se existir
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_status_check;

-- Recriar a constraint de status com valores corretos
ALTER TABLE public.profiles ADD CONSTRAINT profiles_status_check 
CHECK (status IN ('online', 'ausente', 'offline'));

-- Garantir que o campo status tenha um valor padrão
ALTER TABLE public.profiles ALTER COLUMN status SET DEFAULT 'online';

-- Atualizar a função de criação do super admin para usar status válido
CREATE OR REPLACE FUNCTION public.create_super_admin_profile()
RETURNS VOID AS $$
DECLARE
    admin_user_id UUID;
    empresa_id UUID;
BEGIN
    -- Buscar a empresa Amplie Marketing
    SELECT id INTO empresa_id FROM public.empresas WHERE email = 'ampliemarketing.mkt@gmail.com';
    
    -- Buscar o usuário pelo email
    SELECT id INTO admin_user_id FROM auth.users WHERE email = 'ampliemarketing.mkt@gmail.com';
    
    -- Se o usuário existir, criar/atualizar o perfil
    IF admin_user_id IS NOT NULL THEN
        -- Verificar se o perfil já existe
        IF EXISTS (SELECT 1 FROM public.profiles WHERE id = admin_user_id) THEN
            -- Atualizar perfil existente
            UPDATE public.profiles 
            SET nome = 'Amplie Chat',
                empresa_id = empresa_id,
                cargo = 'super_admin',
                setor = 'Administração',
                status = 'online'
            WHERE id = admin_user_id;
        ELSE
            -- Criar novo perfil
            INSERT INTO public.profiles (id, nome, email, empresa_id, cargo, setor, status)
            VALUES (admin_user_id, 'Amplie Chat', 'ampliemarketing.mkt@gmail.com', empresa_id, 'super_admin', 'Administração', 'online');
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
