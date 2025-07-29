-- Fix duplicate active configurations
-- First, set all configurations to inactive
UPDATE evolution_api_global_config SET ativo = false;

-- Then, activate only the most recent valid configuration
UPDATE evolution_api_global_config 
SET ativo = true 
WHERE id = 'd6414ea5-8580-4e34-a2d6-06aefe9ba26f' 
AND server_url = 'https://evolutionapi.amplie-marketing.com';