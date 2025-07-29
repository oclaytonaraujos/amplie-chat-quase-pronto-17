
-- Inserir a empresa Amplie Marketing se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.empresas WHERE email = 'ampliemarketing.mkt@gmail.com') THEN
        INSERT INTO public.empresas (nome, email) 
        VALUES ('Amplie Marketing', 'ampliemarketing.mkt@gmail.com');
    ELSE
        UPDATE public.empresas 
        SET nome = 'Amplie Marketing' 
        WHERE email = 'ampliemarketing.mkt@gmail.com';
    END IF;
END $$;

-- Função para criar perfil do super admin quando o usuário for criado
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

-- Executar a função para criar o perfil se o usuário já existir
SELECT public.create_super_admin_profile();
