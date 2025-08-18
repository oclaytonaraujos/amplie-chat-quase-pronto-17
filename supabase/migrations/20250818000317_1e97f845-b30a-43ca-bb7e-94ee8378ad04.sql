-- Ativar uma configuração Evolution API de exemplo (se não houver nenhuma ativa)
-- Esta migração garante que pelo menos uma configuração esteja ativa para testes

DO $$
BEGIN
  -- Verificar se existe alguma configuração ativa
  IF NOT EXISTS (SELECT 1 FROM evolution_api_global_config WHERE ativo = true) THEN
    -- Se não existe configuração ativa, criar uma de exemplo
    INSERT INTO evolution_api_global_config (
      server_url,
      api_key,
      webhook_base_url,
      ativo,
      environment,
      created_at,
      updated_at
    ) VALUES (
      'https://evolutionapi.amplie-marketing.com',
      'sua-api-key-aqui',
      'https://obtpghqvrygzcukdaiej.supabase.co/functions/v1',
      true,
      'production',
      now(),
      now()
    )
    ON CONFLICT DO NOTHING;
  END IF;
END $$;