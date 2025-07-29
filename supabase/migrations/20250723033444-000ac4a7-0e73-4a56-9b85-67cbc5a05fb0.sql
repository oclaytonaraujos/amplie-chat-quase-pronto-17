-- Inserir configuração global da Evolution API se não existir
INSERT INTO evolution_api_global_config (api_key, server_url, ativo)
SELECT '429683C4C977415CAAFCCE10F7D57E11', 'https://evolutionapi.amplie-marketing.com', true
WHERE NOT EXISTS (SELECT 1 FROM evolution_api_global_config WHERE ativo = true);

-- Atualizar configuração existente se já existir
UPDATE evolution_api_global_config 
SET 
  api_key = '429683C4C977415CAAFCCE10F7D57E11',
  server_url = 'https://evolutionapi.amplie-marketing.com',
  ativo = true
WHERE ativo = true;