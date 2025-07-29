
-- Inserir o usuário administrador na tabela auth.users (simulando o cadastro)
-- Nota: Em produção, este usuário deve ser criado através do painel do Supabase ou API de autenticação

-- Primeiro, vamos garantir que temos uma empresa padrão
UPDATE public.empresas 
SET nome = 'Amplie Marketing', email = 'ampliemarketing.mkt@gmail.com' 
WHERE nome = 'Empresa Demo';

-- Inserir o perfil do administrador (assumindo que o usuário já foi criado no Supabase Auth)
-- O ID do usuário será obtido após o cadastro via Supabase Auth
-- Por enquanto, vamos preparar a estrutura para quando o usuário fizer login

-- Criar função para associar usuário admin à empresa
CREATE OR REPLACE FUNCTION public.setup_admin_user()
RETURNS VOID AS $$
DECLARE
    admin_user_id UUID;
    empresa_id UUID;
BEGIN
    -- Buscar o ID da empresa Amplie Marketing
    SELECT id INTO empresa_id FROM public.empresas WHERE email = 'ampliemarketing.mkt@gmail.com';
    
    -- Buscar o usuário admin pelo email (caso já exista)
    SELECT id INTO admin_user_id FROM auth.users WHERE email = 'ampliemarketing.mkt@gmail.com';
    
    -- Se o usuário existir, atualizar seu perfil
    IF admin_user_id IS NOT NULL THEN
        UPDATE public.profiles 
        SET 
            empresa_id = empresa_id,
            nome = 'Administrador',
            cargo = 'admin',
            setor = 'Administração'
        WHERE id = admin_user_id;
        
        -- Se o perfil não existir, criar
        IF NOT FOUND THEN
            INSERT INTO public.profiles (id, nome, email, empresa_id, cargo, setor)
            VALUES (admin_user_id, 'Administrador', 'ampliemarketing.mkt@gmail.com', empresa_id, 'admin', 'Administração');
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
