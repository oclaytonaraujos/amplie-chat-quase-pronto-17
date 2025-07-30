import { useState, useMemo } from 'react';
import { ConversaInterna, MensagemInterna } from '@/types/chat-interno';

export function useChatInternoSearch(
  conversas: ConversaInterna[], 
  mensagens: { [conversaId: string]: MensagemInterna[] }
) {
  const [searchTerm, setSearchTerm] = useState('');

  const { conversasFiltradas, mensagemEncontrada } = useMemo(() => {
    if (!searchTerm.trim()) {
      return { conversasFiltradas: conversas, mensagemEncontrada: null };
    }

    const termo = searchTerm.toLowerCase();
    const conversasComMatch: ConversaInterna[] = [];
    let mensagemMatch: { conversa: ConversaInterna; mensagem: MensagemInterna } | null = null;

    conversas.forEach(conversa => {
      // Buscar no nome do participante
      const nomeMatch = conversa.participante?.nome?.toLowerCase().includes(termo);
      
      // Buscar nas mensagens da conversa
      const mensagensConversa = mensagens[conversa.id] || [];
      const mensagemComMatch = mensagensConversa.find(msg => 
        msg.conteudo.toLowerCase().includes(termo)
      );

      // Se encontrou match, adicionar à lista
      if (nomeMatch || mensagemComMatch) {
        conversasComMatch.push(conversa);
        
        // Guardar a primeira mensagem encontrada
        if (mensagemComMatch && !mensagemMatch) {
          mensagemMatch = { conversa, mensagem: mensagemComMatch };
        }
      }
    });

    return { 
      conversasFiltradas: conversasComMatch, 
      mensagemEncontrada: mensagemMatch 
    };
  }, [conversas, mensagens, searchTerm]);

  const clearSearch = () => setSearchTerm('');

  return {
    searchTerm,
    setSearchTerm,
    conversasFiltradas,
    mensagemEncontrada,
    clearSearch,
    hasResults: conversasFiltradas.length > 0
  };
}