import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/structured-logger';
import { EventsService } from '@/services/EventsService';
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
          response = await EventsService.sendTextMessage(
            instance.nome,
            params.telefone,
            params.mensagem,
            {
              conversaId: params.conversaId,
              delay: 0,
              linkPreview: true,
              idempotencyKey
            }
          );
          break;

        case 'imagem':
        case 'audio':
        case 'video':
        case 'documento':
          if (!params.opcoes?.imageUrl && !params.opcoes?.audioUrl && 
              !params.opcoes?.videoUrl && !params.opcoes?.documentUrl) {
            throw new Error('URL da mídia é obrigatória');
          }

          const mediaUrl = params.opcoes.imageUrl || params.opcoes.audioUrl || 
                          params.opcoes.videoUrl || params.opcoes.documentUrl!;

          response = await EventsService.sendMediaMessage(
            instance.nome,
            params.telefone,
            mediaUrl,
            params.tipo as 'imagem' | 'audio' | 'video' | 'documento',
            {
              conversaId: params.conversaId,
              caption: params.opcoes.caption,
              fileName: params.opcoes.fileName,
              idempotencyKey
            }
          );
          break;

        case 'botoes':
          if (!params.opcoes?.botoes || params.opcoes.botoes.length === 0) {
            throw new Error('Botões são obrigatórios');
          }

          response = await EventsService.sendButtonsMessage(
            instance.nome,
            params.telefone,
            params.mensagem,
            params.opcoes.botoes,
            {
              conversaId: params.conversaId,
              idempotencyKey
            }
          );
          break;

        case 'lista':
          if (!params.opcoes?.lista || params.opcoes.lista.length === 0) {
            throw new Error('Lista é obrigatória');
          }

          response = await EventsService.sendListMessage(
            instance.nome,
            params.telefone,
            params.mensagem,
            params.opcoes.lista,
            {
              conversaId: params.conversaId,
              idempotencyKey
            }
          );
          break;

        default:
          throw new Error(`Tipo de mensagem não suportado: ${params.tipo}`);
      }

      setMessageStatus({
        correlationId: response.correlation_id,
        status: response.status === 'processing' ? 'queued' : 'failed'
      });

      // Subscribe to status updates
      if (response.correlation_id) {
        const unsubscribe = EventsService.subscribeToEvent(response.correlation_id, (event) => {
          setMessageStatus({
            correlationId: event.correlation_id,
            status: event.status as MessageStatus['status'],
            error: event.error_message
          });

          if (event.status === 'delivered') {
            toast({
              title: "Mensagem enviada",
              description: "Mensagem enviada com sucesso!",
            });
          } else if (event.status === 'failed') {
            toast({
              title: "Erro no envio",
              description: event.error_message || "Falha ao enviar mensagem",
              variant: "destructive",
            });
          }
        });

        // Cleanup subscription after 5 minutes
        setTimeout(unsubscribe, 5 * 60 * 1000);
      }

      logger.info('Mensagem enviada para fila n8n', {
        userId: user.id,
        metadata: {
          correlationId: response.correlation_id,
          conversaId: params.conversaId
        }
      });

      return { success: true, correlationId: response.correlation_id };

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