-- Manter apenas a configuração com URL válida ativa
UPDATE evolution_api_global_config 
SET ativo = false 
WHERE server_url = 'https://evolution-api.example.com';

-- Garantir que a configuração correta está ativa
UPDATE evolution_api_global_config 
SET ativo = true 
WHERE server_url = 'https://evolutionapi.amplie-marketing.com';