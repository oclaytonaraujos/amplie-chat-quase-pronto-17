-- Criar super admin automaticamente
DO $$
DECLARE
    admin_user_id UUID;
    empresa_id UUID;
BEGIN
    -- Buscar a empresa Amplie Marketing
    SELECT id INTO empresa_id FROM public.empresas WHERE email = 'ampliemarketing.mkt@gmail.com';
    
    -- Se não existe, criar empresa
    IF empresa_id IS NULL THEN
        INSERT INTO public.empresas (nome, email, ativo) 
        VALUES ('Amplie Marketing', 'ampliemarketing.mkt@gmail.com', true)
        RETURNING id INTO empresa_id;
    END IF;
    
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
END $$;