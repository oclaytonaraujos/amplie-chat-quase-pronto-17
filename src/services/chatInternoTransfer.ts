
import { Mensagem, Usuario } from '@/types/chat-interno';

export interface TransferMessage {
  tipo: 'transferencia';
  deUsuario: string;
  paraUsuario: string;
  cliente: string;
  motivo: string;
  timestamp: Date;
}

export class ChatInternoTransferService {
  static createTransferMessage(
    transferData: TransferMessage,
    autorMensagem: Usuario
  ): Mensagem {
    const messageText = `🔄 TRANSFERÊNCIA DE ATENDIMENTO
    
Cliente: ${transferData.cliente}
De: ${transferData.deUsuario}
Para: ${transferData.paraUsuario}
Motivo: ${transferData.motivo}

Data: ${transferData.timestamp.toLocaleString('pt-BR')}`;

    return {
      id: Date.now(),
      texto: messageText,
      autor: autorMensagem,
      tempo: transferData.timestamp.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      tipo: 'texto'
    };
  }

  static findOrCreateTransferConversation(
    conversas: any[],
    usuarioOrigemId: number,
    usuarioDestinoId: number,
    usuarios: Usuario[]
  ) {
    // Procurar conversa existente entre os dois usuários
    const conversaExistente = conversas.find(conversa => 
      conversa.tipo === 'individual' && 
      (
        (conversa.participantes.some((p: Usuario) => p.id === usuarioOrigemId) &&
         conversa.participantes.some((p: Usuario) => p.id === usuarioDestinoId)) ||
        (conversa.participantes.some((p: Usuario) => p.id === usuarioDestinoId) &&
         conversa.participantes.some((p: Usuario) => p.id === usuarioOrigemId))
      )
    );

    if (conversaExistente) {
      return conversaExistente;
    }

    // Criar nova conversa se não existir
    const usuarioDestino = usuarios.find(u => u.id === usuarioDestinoId);
    if (!usuarioDestino) return null;

    return {
      id: Date.now(),
      tipo: 'individual' as const,
      nome: usuarioDestino.nome,
      participantes: [usuarioDestino],
      mensagensNaoLidas: 1
    };
  }
}
