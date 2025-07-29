-- Criar tabela para armazenar métricas de relatórios
CREATE TABLE IF NOT EXISTS public.relatorios_metricas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID REFERENCES empresas(id) NOT NULL,
  data_referencia DATE NOT NULL,
  total_atendimentos INTEGER DEFAULT 0,
  atendimentos_resolvidos INTEGER DEFAULT 0,
  atendimentos_pendentes INTEGER DEFAULT 0,
  tempo_medio_atendimento INTEGER DEFAULT 0, -- em segundos
  satisfacao_media DECIMAL(3,2) DEFAULT 0,
  taxa_resolucao DECIMAL(5,2) DEFAULT 0,
  nps DECIMAL(3,1) DEFAULT 0,
  volume_whatsapp INTEGER DEFAULT 0,
  volume_chat_interno INTEGER DEFAULT 0,
  volume_email INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela para análise de sentimento
CREATE TABLE IF NOT EXISTS public.sentiment_analysis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mensagem_id UUID REFERENCES mensagens(id),
  conversa_id UUID REFERENCES conversas(id),
  empresa_id UUID REFERENCES empresas(id) NOT NULL,
  sentimento_score DECIMAL(3,2) DEFAULT 0, -- -1 a 1
  sentimento_confianca DECIMAL(3,2) DEFAULT 0, -- 0 a 1
  emocao VARCHAR(20) DEFAULT 'neutral',
  palavras_chave TEXT[] DEFAULT '{}',
  sugestao_ia TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela para chamadas de vídeo/áudio
CREATE TABLE IF NOT EXISTS public.video_audio_calls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID REFERENCES empresas(id) NOT NULL,
  agente_id UUID REFERENCES profiles(id),
  contato_id UUID REFERENCES contatos(id),
  tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('voice', 'video')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'connecting', 'connected', 'ended', 'cancelled')),
  duracao INTEGER DEFAULT 0, -- em segundos
  qualidade_audio VARCHAR(10) DEFAULT 'medium',
  qualidade_video VARCHAR(10) DEFAULT 'medium',
  gravacao_url TEXT,
  notas TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_relatorios_metricas_empresa_data ON relatorios_metricas(empresa_id, data_referencia);
CREATE INDEX IF NOT EXISTS idx_sentiment_analysis_conversa ON sentiment_analysis(conversa_id);
CREATE INDEX IF NOT EXISTS idx_sentiment_analysis_empresa ON sentiment_analysis(empresa_id);
CREATE INDEX IF NOT EXISTS idx_video_calls_empresa ON video_audio_calls(empresa_id);
CREATE INDEX IF NOT EXISTS idx_video_calls_agente ON video_audio_calls(agente_id);

-- Habilitar RLS
ALTER TABLE relatorios_metricas ENABLE ROW LEVEL SECURITY;
ALTER TABLE sentiment_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_audio_calls ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para relatorios_metricas
CREATE POLICY "Users can view company metrics" ON relatorios_metricas
  FOR SELECT USING (
    empresa_id IN (
      SELECT empresa_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Super admins can manage all metrics" ON relatorios_metricas
  FOR ALL USING (is_super_admin());

-- Políticas RLS para sentiment_analysis
CREATE POLICY "Users can view company sentiment analysis" ON sentiment_analysis
  FOR SELECT USING (
    empresa_id IN (
      SELECT empresa_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "System can manage sentiment analysis" ON sentiment_analysis
  FOR ALL USING (true);

-- Políticas RLS para video_audio_calls
CREATE POLICY "Users can view company calls" ON video_audio_calls
  FOR SELECT USING (
    empresa_id IN (
      SELECT empresa_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can manage company calls" ON video_audio_calls
  FOR ALL USING (
    empresa_id IN (
      SELECT empresa_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_relatorios_metricas_updated_at
  BEFORE UPDATE ON relatorios_metricas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sentiment_analysis_updated_at
  BEFORE UPDATE ON sentiment_analysis
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_video_audio_calls_updated_at
  BEFORE UPDATE ON video_audio_calls
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();