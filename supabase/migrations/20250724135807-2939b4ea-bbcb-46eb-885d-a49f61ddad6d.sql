-- Criar tabela para configurações de aparência e idioma dos usuários
CREATE TABLE public.user_appearance_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Configurações de tema
  theme TEXT NOT NULL DEFAULT 'light',
  color_scheme TEXT NOT NULL DEFAULT 'blue', 
  font_size TEXT NOT NULL DEFAULT 'medium',
  compact_mode BOOLEAN NOT NULL DEFAULT false,
  animations BOOLEAN NOT NULL DEFAULT true,
  
  -- Configurações de layout
  sidebar_collapsed BOOLEAN NOT NULL DEFAULT false,
  show_avatars BOOLEAN NOT NULL DEFAULT true,
  show_timestamps BOOLEAN NOT NULL DEFAULT true,
  density_mode TEXT NOT NULL DEFAULT 'comfortable',
  
  -- Configurações de acessibilidade
  high_contrast BOOLEAN NOT NULL DEFAULT false,
  reduced_motion BOOLEAN NOT NULL DEFAULT false,
  screen_reader BOOLEAN NOT NULL DEFAULT false,
  keyboard_navigation BOOLEAN NOT NULL DEFAULT true,
  
  -- Configurações de idioma
  primary_language TEXT NOT NULL DEFAULT 'pt-BR',
  secondary_language TEXT NOT NULL DEFAULT 'en-US',
  auto_detect BOOLEAN NOT NULL DEFAULT true,
  translate_messages BOOLEAN NOT NULL DEFAULT false,
  date_format TEXT NOT NULL DEFAULT 'DD/MM/YYYY',
  time_format TEXT NOT NULL DEFAULT '24h',
  number_format TEXT NOT NULL DEFAULT 'pt-BR',
  
  -- Configurações regionais
  timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  currency TEXT NOT NULL DEFAULT 'BRL',
  first_day_of_week TEXT NOT NULL DEFAULT 'monday',
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(user_id)
);

-- Habilitar RLS
ALTER TABLE public.user_appearance_settings ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view their own appearance settings" 
ON public.user_appearance_settings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own appearance settings" 
ON public.user_appearance_settings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own appearance settings" 
ON public.user_appearance_settings 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_user_appearance_settings_updated_at
  BEFORE UPDATE ON public.user_appearance_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();