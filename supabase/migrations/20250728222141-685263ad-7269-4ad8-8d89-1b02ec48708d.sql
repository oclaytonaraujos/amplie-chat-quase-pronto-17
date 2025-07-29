-- Criar bucket whatsapp-media para uploads de mídia
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('whatsapp-media', 'whatsapp-media', true, 52428800, ARRAY['image/*', 'video/*', 'audio/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']);

-- Atualizar RLS da evolution_api_global_config para permitir leitura por usuários autenticados
DROP POLICY IF EXISTS "Only super admins can manage global evolution api config" ON evolution_api_global_config;

CREATE POLICY "Super admins can manage global evolution api config" 
ON evolution_api_global_config 
FOR ALL 
USING (is_super_admin()) 
WITH CHECK (is_super_admin());

CREATE POLICY "Users can view global evolution api config" 
ON evolution_api_global_config 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Criar políticas para o bucket whatsapp-media
CREATE POLICY "Anyone can view whatsapp media" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'whatsapp-media');

CREATE POLICY "Authenticated users can upload whatsapp media" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'whatsapp-media' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update their whatsapp media" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'whatsapp-media' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete their whatsapp media" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'whatsapp-media' AND auth.uid() IS NOT NULL);