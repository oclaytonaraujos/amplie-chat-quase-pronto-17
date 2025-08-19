-- Add missing webhook columns to n8n_configurations table
ALTER TABLE public.n8n_configurations 
ADD COLUMN IF NOT EXISTS webhook_create_connection TEXT,
ADD COLUMN IF NOT EXISTS webhook_delete_instance TEXT,
ADD COLUMN IF NOT EXISTS webhook_chatbot TEXT;