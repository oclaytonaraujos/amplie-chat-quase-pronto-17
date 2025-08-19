-- Criar empresa Amplie Marketing se não existir
INSERT INTO empresas (nome, email, telefone, ativo)
SELECT 'Amplie Marketing', 'ampliemarketing.mkt@gmail.com', '', true
WHERE NOT EXISTS (
    SELECT 1 FROM empresas WHERE email = 'ampliemarketing.mkt@gmail.com'
);

-- Criar usuário super admin diretamente
DO $$
DECLARE
    empresa_id_var UUID;
BEGIN
    -- Buscar ID da empresa Amplie Marketing
    SELECT id INTO empresa_id_var
    FROM empresas
    WHERE email = 'ampliemarketing.mkt@gmail.com'
    LIMIT 1;

    -- Se não encontrou a empresa, buscar novamente (caso tenha sido criada acima)
    IF empresa_id_var IS NULL THEN
        SELECT id INTO empresa_id_var
        FROM empresas
        WHERE nome = 'Amplie Marketing'
        LIMIT 1;
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
        created_at,
        updated_at,
        raw_app_meta_data,
        raw_user_meta_data
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
        NOW(),
        '{"provider": "email", "providers": ["email"]}',
        '{"nome": "Super Admin"}'
    WHERE NOT EXISTS (
        SELECT 1 FROM auth.users WHERE email = 'ampliemarketing.mkt@gmail.com'
    );

END $$;