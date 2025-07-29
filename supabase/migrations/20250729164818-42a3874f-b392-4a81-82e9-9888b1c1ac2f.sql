-- Corrigir migração de autenticação - adicionar constraint única e configurar sistema

-- Primeiro, adicionar constraint única na tabela empresas se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'empresas_email_key' 
        AND table_name = 'empresas'
    ) THEN
        ALTER TABLE public.empresas ADD CONSTRAINT empresas_email_key UNIQUE (email);
    END IF;
END $$;

-- Criar empresa Amplie Marketing se não existir
INSERT INTO public.empresas (nome, email, telefone, ativo) 
VALUES ('Amplie Marketing', 'ampliemarketing.mkt@gmail.com', '+55 11 99999-9999', true)
ON CONFLICT (email) DO NOTHING;

-- Configurar usuário super admin
DO $$
DECLARE
    empresa_id UUID;
    admin_user_id UUID;
BEGIN
    -- Buscar ID da empresa Amplie Marketing
    SELECT id INTO empresa_id FROM public.empresas WHERE email = 'ampliemarketing.mkt@gmail.com';
    
    -- Verificar se existe usuário na tabela auth.users
    SELECT id INTO admin_user_id FROM auth.users WHERE email = 'ampliemarketing.mkt@gmail.com';
    
    -- Se o usuário existir no auth mas não tiver perfil, criar o perfil
    IF admin_user_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = admin_user_id) THEN
        INSERT INTO public.profiles (
            id,
            nome,
            email,
            empresa_id,
            cargo,
            setor,
            status,
            permissoes,
            limite_atendimentos,
            aceita_novos_atendimentos
        ) VALUES (
            admin_user_id,
            'Administrador',
            'ampliemarketing.mkt@gmail.com',
            empresa_id,
            'super_admin',
            'Administração',
            'online',
            '[]'::jsonb,
            100,
            true
        );
    END IF;
END $$;

-- Atualizar/criar função para manter updated_at atualizado
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger na tabela profiles se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_profiles_updated_at') THEN
        CREATE TRIGGER handle_profiles_updated_at
            BEFORE UPDATE ON public.profiles
            FOR EACH ROW
            EXECUTE FUNCTION public.handle_updated_at();
    END IF;
END $$;

-- Função para criar perfil automaticamente quando usuário é criado
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    default_empresa_id UUID;
BEGIN
    -- Buscar empresa padrão (Amplie Marketing)
    SELECT id INTO default_empresa_id FROM public.empresas WHERE email = 'ampliemarketing.mkt@gmail.com';
    
    -- Criar perfil básico para o novo usuário
    INSERT INTO public.profiles (
        id,
        nome,
        email,
        empresa_id,
        cargo,
        setor,
        status,
        permissoes,
        limite_atendimentos,
        aceita_novos_atendimentos
    ) VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
        NEW.email,
        COALESCE((NEW.raw_user_meta_data->>'empresa_id')::UUID, default_empresa_id),
        CASE 
            WHEN NEW.email = 'ampliemarketing.mkt@gmail.com' THEN 'super_admin'
            ELSE COALESCE(NEW.raw_user_meta_data->>'cargo', 'usuario')
        END,
        COALESCE(NEW.raw_user_meta_data->>'setor', 'Geral'),
        'online',
        COALESCE((NEW.raw_user_meta_data->>'permissoes')::jsonb, '[]'::jsonb),
        COALESCE((NEW.raw_user_meta_data->>'limite_atendimentos')::integer, 5),
        COALESCE((NEW.raw_user_meta_data->>'aceita_novos_atendimentos')::boolean, true)
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar trigger na tabela auth.users se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
        CREATE TRIGGER on_auth_user_created
            AFTER INSERT ON auth.users
            FOR EACH ROW
            EXECUTE FUNCTION public.handle_new_user();
    END IF;
END $$;