
-- Criar bucket para anexos do WhatsApp
INSERT INTO storage.buckets (id, name, public) 
VALUES ('attachments', 'attachments', true);

-- Criar política para permitir que usuários autenticados façam upload
CREATE POLICY "Usuários autenticados podem fazer upload de anexos" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'attachments' AND auth.role() = 'authenticated');

-- Criar política para permitir visualização pública dos anexos
CREATE POLICY "Anexos são públicos para visualização" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'attachments');

-- Criar política para permitir que usuários autenticados atualizem seus anexos
CREATE POLICY "Usuários autenticados podem atualizar anexos" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'attachments' AND auth.role() = 'authenticated');

-- Criar política para permitir que usuários autenticados deletem anexos
CREATE POLICY "Usuários autenticados podem deletar anexos" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'attachments' AND auth.role() = 'authenticated');
