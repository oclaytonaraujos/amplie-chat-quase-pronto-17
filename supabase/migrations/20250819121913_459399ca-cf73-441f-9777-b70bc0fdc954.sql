-- Criar empresa Amplie Marketing se não existir
INSERT INTO empresas (nome, email, telefone, status)
SELECT 'Amplie Marketing', 'ampliemarketing.mkt@gmail.com', '', 'ativa'
WHERE NOT EXISTS (
    SELECT 1 FROM empresas WHERE email = 'ampliemarketing.mkt@gmail.com'
);

-- Função para criar super admin automaticamente
CREATE OR REPLACE FUNCTION create_super_admin()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    empresa_id_var UUID;
    user_id_var UUID;
BEGIN
    -- Buscar ID da empresa Amplie Marketing
    SELECT id INTO empresa_id_var
    FROM empresas
    WHERE email = 'ampliemarketing.mkt@gmail.com'
    LIMIT 1;

    -- Se não encontrou a empresa, criar
    IF empresa_id_var IS NULL THEN
        INSERT INTO empresas (nome, email, telefone, status)
        VALUES ('Amplie Marketing', 'ampliemarketing.mkt@gmail.com', '', 'ativa')
        RETURNING id INTO empresa_id_var;
    END IF;

    -- Criar usuário no auth.users se não existir
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        confirmation_sent_at,
        confirmation_token,
        recovery_token,
        email_change_token_new,
        email_change,
        created_at,
        updated_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        last_sign_in_at
    )
    SELECT
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        'ampliemarketing.mkt@gmail.com',
        crypt('123456', gen_salt('bf')),
        NOW(),
        NOW(),
        '',
        '',
        '',
        '',
        NOW(),
        NOW(),
        '{"provider": "email", "providers": ["email"]}',
        '{"nome": "Super Admin"}',
        FALSE,
        NOW()
    WHERE NOT EXISTS (
        SELECT 1 FROM auth.users WHERE email = 'ampliemarketing.mkt@gmail.com'
    )
    RETURNING id INTO user_id_var;

    -- Se usuário já existia, pegar o ID
    IF user_id_var IS NULL THEN
        SELECT id INTO user_id_var
        FROM auth.users
        WHERE email = 'ampliemarketing.mkt@gmail.com'
        LIMIT 1;
    END IF;

    -- Criar ou atualizar perfil como super_admin
    INSERT INTO profiles (
        id,
        nome,
        email,
        empresa_id,
        cargo,
        setor,
        status,
        permissoes,
        limite_atendimentos,
        aceita_novos_atendimentos,
        created_at,
        updated_at
    )
    VALUES (
        user_id_var,
        'Super Admin',
        'ampliemarketing.mkt@gmail.com',
        empresa_id_var,
        'super_admin',
        'Administração',
        'online',
        '["all"]',
        999,
        true,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        cargo = 'super_admin',
        empresa_id = empresa_id_var,
        permissoes = '["all"]',
        updated_at = NOW();

    RAISE NOTICE 'Super admin criado/atualizado com sucesso: %', user_id_var;
END;
$$;

-- Executar a função
SELECT create_super_admin();