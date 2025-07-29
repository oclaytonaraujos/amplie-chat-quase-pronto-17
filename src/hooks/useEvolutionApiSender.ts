
import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/structured-logger';

interface SendMessageParams {
  telefone: string;
  mensagem: string;
  tipo: 'texto' | 'imagem' | 'audio' | 'video' | 'documento' | 'botoes' | 'lista';
  conversaId?: string;
  opcoes?: {
    imageUrl?: string;
    audioUrl?: string;
    videoUrl?: string;
    documentUrl?: string;
    fileName?: string;
    caption?: string;
    botoes?: Array<{ text: string; id: string }>;
    lista?: Array<{ title: string; description: string; id: string }>;
  };
}

export function useEvolutionApiSender() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const getEvolutionConfig = useCallback(async () => {
    if (!user) throw new Error('Usuário não autenticado');

    // Buscar configuração global da Evolution API
    const { data: globalConfig } = await supabase
      .from('evolution_api_global_config')
      .select('*')
      .eq('ativo', true)
      .single();

    if (!globalConfig) {
      throw new Error('Configuração global da Evolution API não encontrada');
    }

    return globalConfig;
  }, [user]);

  const getActiveInstance = useCallback(async () => {
    if (!user) throw new Error('Usuário não autenticado');

    const { data: profile } = await supabase
      .from('profiles')
      .select('empresa_id')
      .eq('id', user.id)
      .single();

    if (!profile?.empresa_id) {
      throw new Error('Usuário não está associado a uma empresa');
    }

    const { data: instance } = await supabase
      .from('whatsapp_connections')
      .select('*')
      .eq('empresa_id', profile.empresa_id)
      .eq('ativo', true)
      .eq('status', 'connected')
      .single();

    if (!instance) {
      throw new Error('Nenhuma instância WhatsApp conectada encontrada');
    }

    return instance;
  }, [user]);

  const sendMessage = useCallback(async (params: SendMessageParams) => {
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    setIsLoading(true);
    
    try {
      logger.info('Enviando mensagem via Evolution API', {
        userId: user.id,
        metadata: {
          tipo: params.tipo,
          telefone: params.telefone,
          conversaId: params.conversaId
        }
      });

      const globalConfig = await getEvolutionConfig();
      const instance = await getActiveInstance();

      // Chamar a Edge Function para enviar mensagem
      const { data, error } = await supabase.functions.invoke('chatbot-sender-evolution', {
        body: {
          instanceName: instance.nome,
          telefone: params.telefone,
          mensagem: params.mensagem,
          tipo: params.tipo,
          opcoes: params.opcoes,
          conversaId: params.conversaId
        }
      });

      if (error) {
        throw error;
      }

      logger.info('Mensagem enviada com sucesso', {
        userId: user.id,
        metadata: {
          messageId: data?.messageId,
          conversaId: params.conversaId
        }
      });

      toast({
        title: "Mensagem enviada",
        description: "Mensagem enviada com sucesso!",
      });

      return { success: true, data };

    } catch (error) {
      logger.error('Erro ao enviar mensagem', {
        userId: user.id,
        conversaId: params.conversaId
      }, error as Error);

      toast({
        title: "Erro no envio",
        description: "Não foi possível enviar a mensagem. Verifique a configuração da Evolution API.",
        variant: "destructive",
      });

      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [user, getEvolutionConfig, toast]);

  const uploadFile = useCallback(async (file: File): Promise<string> => {
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    setIsLoading(true);

    try {
      const fileName = `${Date.now()}_${file.name}`;
      const { data, error } = await supabase.storage
        .from('whatsapp-media')
        .upload(fileName, file);

      if (error) {
        throw error;
      }

      const { data: publicUrl } = supabase.storage
        .from('whatsapp-media')
        .getPublicUrl(data.path);

      return publicUrl.publicUrl;

    } catch (error) {
      logger.error('Erro ao fazer upload do arquivo', {
        userId: user.id
      }, error as Error);

      toast({
        title: "Erro no upload",
        description: "Não foi possível fazer upload do arquivo.",
        variant: "destructive",
      });

      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  return {
    sendMessage,
    uploadFile,
    isLoading
  };
}
