-- Corrigir status da instância WhatsApp para refletir conexão real
UPDATE evolution_api_config 
SET 
  status = 'open',
  connection_state = 'OPEN',
  webhook_status = 'ativo',
  last_connected_at = now(),
  updated_at = now()
WHERE instance_name = 'amplie teste';

-- Verificar se a atualização foi aplicada
SELECT 
  instance_name,
  status,
  connection_state,
  webhook_status,
  last_connected_at,
  updated_at
FROM evolution_api_config 
WHERE instance_name = 'amplie teste';