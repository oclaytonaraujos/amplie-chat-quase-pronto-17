-- Remover instância "teste" do banco de dados
DELETE FROM evolution_api_config 
WHERE instance_name = 'teste' 
AND empresa_id = '40979bfd-3e37-48cb-9eac-ef1b56375cc8';