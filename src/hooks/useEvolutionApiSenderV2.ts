import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/structured-logger';
// Removido: EventsService
import { useEvolutionApiSender } from './useEvolutionApiSender';

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

interface MessageStatus {
  correlationId?: string;
  status: 'idle' | 'queued' | 'processing' | 'delivered' | 'failed';
  error?: string;
}

export function useEvolutionApiSenderV2() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [messageStatus, setMessageStatus] = useState<MessageStatus>({ status: 'idle' });

  // Fallback to direct mode
  const directSender = useEvolutionApiSender();

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

  const sendMessage = useCallback(async (params: SendMessageParams, useN8nMode: boolean = true) => {
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    setIsLoading(true);
    setMessageStatus({ status: 'idle' });
    
    try {
      logger.info('Enviando mensagem via Evolution API V2', {
        userId: user.id,
        metadata: {
          useN8nMode,
          tipo: params.tipo,
          telefone: params.telefone,
          conversaId: params.conversaId
        }
      });

      // If not using n8n mode, fallback to direct mode
      if (!useN8nMode) {
        return await directSender.sendMessage(params);
      }

      const instance = await getActiveInstance();
      
      let response;
      const idempotencyKey = `${params.conversaId || 'no-conv'}-${Date.now()}-${Math.random()}`;

      switch (params.tipo) {
        case 'texto':
          // Fallback para modo direto sem EventsService
          return await directSender.sendMessage(params);

        case 'imagem':
        case 'audio':
        case 'video':
        case 'documento':
          if (!params.opcoes?.imageUrl && !params.opcoes?.audioUrl && 
              !params.opcoes?.videoUrl && !params.opcoes?.documentUrl) {
            throw new Error('URL da mídia é obrigatória');
          }

          // Fallback para modo direto
          return await directSender.sendMessage(params);

        case 'botoes':
          if (!params.opcoes?.botoes || params.opcoes.botoes.length === 0) {
            throw new Error('Botões são obrigatórios');
          }

          // Fallback para modo direto
          return await directSender.sendMessage(params);

        case 'lista':
          if (!params.opcoes?.lista || params.opcoes.lista.length === 0) {
            throw new Error('Lista é obrigatória');
          }

          // Fallback para modo direto
          return await directSender.sendMessage(params);

        default:
          throw new Error(`Tipo de mensagem não suportado: ${params.tipo}`);
      }

    } catch (error) {
      logger.error('Erro ao enviar mensagem via n8n', {
        userId: user.id,
        conversaId: params.conversaId
      }, error as Error);

      setMessageStatus({ 
        status: 'failed', 
        error: (error as Error).message 
      });

      toast({
        title: "Erro no envio",
        description: "Não foi possível enviar a mensagem. Tentando modo direto...",
        variant: "destructive",
      });

      // Fallback to direct mode
      try {
        return await directSender.sendMessage(params);
      } catch (fallbackError) {
        toast({
          title: "Erro crítico",
          description: "Falha tanto no modo n8n quanto no modo direto",
          variant: "destructive",
        });
        throw fallbackError;
      }
    } finally {
      setIsLoading(false);
    }
  }, [user, getActiveInstance, toast, directSender]);

  const uploadFile = useCallback(async (file: File): Promise<string> => {
    // Use the existing upload functionality
    return await directSender.uploadFile(file);
  }, [directSender]);

  return {
    sendMessage,
    uploadFile,
    isLoading,
    messageStatus
  };
}