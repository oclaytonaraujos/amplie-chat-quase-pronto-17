-- Inserir configuração global padrão da Evolution API
INSERT INTO public.evolution_api_global_config (
  server_url,
  api_key,
  webhook_base_url,
  webhook_base_path,
  ativo,
  environment,
  timeout_ms,
  retry_attempts,
  rate_limit_per_minute
) VALUES (
  'https://evolution-api.example.com',
  'your-api-key-here',
  'https://obtpghqvrygzcukdaiej.supabase.co',
  '/functions/v1',
  true,
  'production',
  30000,
  3,
  60
) ON CONFLICT DO NOTHING;