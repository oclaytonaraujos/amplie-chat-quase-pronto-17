-- Criar tabela webhooks que está sendo referenciada pelo sistema

CREATE TABLE IF NOT EXISTS public.webhooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL,
  nome TEXT NOT NULL,
  url TEXT NOT NULL,
  eventos TEXT[] DEFAULT ARRAY[]::TEXT[],
  ativo BOOLEAN DEFAULT true,
  headers JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para webhooks
CREATE POLICY "Users can view company webhooks"
ON public.webhooks FOR SELECT
USING (empresa_id = (SELECT empresa_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can manage company webhooks"
ON public.webhooks FOR ALL
USING (empresa_id = (SELECT empresa_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Super admins can manage all webhooks"
ON public.webhooks FOR ALL
USING (is_super_admin());

-- Trigger para atualizar updated_at
CREATE TRIGGER update_webhooks_updated_at
BEFORE UPDATE ON public.webhooks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_webhooks_empresa_id ON public.webhooks(empresa_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_ativo ON public.webhooks(ativo);

-- Trigger para criar webhook padrão quando uma empresa é criada
CREATE TRIGGER create_empresa_default_webhook
AFTER INSERT ON public.empresas
FOR EACH ROW
EXECUTE FUNCTION public.create_default_webhook();