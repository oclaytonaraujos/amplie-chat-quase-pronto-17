/**
 * Hook para cache inteligente de mensagens
 * Otimiza carregamento e reduz requisições desnecessárias
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import { useIntelligentCache } from '@/hooks/useIntelligentCache';
import { useIsMobile } from '@/hooks/use-mobile';

interface Mensagem {
  id: string;
  conteudo: string;
  remetente_tipo: 'cliente' | 'agente' | 'sistema';
  remetente_nome: string;
  created_at: string;
  tipo_mensagem: 'texto' | 'imagem' | 'audio' | 'video' | 'arquivo';
  metadata?: any;
  status: 'enviando' | 'enviado' | 'entregue' | 'lido' | 'erro';
  lida: boolean;
}

interface MessageCacheOptions {
  maxMessages?: number;
  prefetchCount?: number;
  enablePersistence?: boolean;
  ttl?: number;
}

export function useMessageCache(conversaId: string, options: MessageCacheOptions = {}) {
  const {
    maxMessages = 100,
    prefetchCount = 20,
    enablePersistence = true,
    ttl = 5 * 60 * 1000 // 5 minutos
  } = options;

  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const loadedPagesRef = useRef(new Set<number>());
  const lastLoadTimeRef = useRef<number>(0);

  // Cache principal usando o hook inteligente
  const { 
    data: mensagensCache, 
    loading: cacheLoading
  } = useIntelligentCache(
    `mensagens-${conversaId}`,
    async () => {
      // Simular carregamento inicial de mensagens
      await new Promise(resolve => setTimeout(resolve, 100));
      return {
        mensagens: [] as Mensagem[],
        totalCount: 0,
        lastUpdate: Date.now()
      };
    },
    {
      ttl: enablePersistence ? ttl : 0,
      enablePersistence,
      maxSize: isMobile ? 50 : 100
    }
  );

  // Cache de metadata para otimizar busca
  const metadataCache = useRef(new Map<string, {
    totalCount: number;
    lastMessageId: string | null;
    lastUpdate: number;
  }>());

  // Função para carregar mensagens de forma paginada
  const loadMessages = useCallback(async (page: number = 0, limit: number = prefetchCount) => {
    if (loadedPagesRef.current.has(page) || loading) {
      return;
    }

    // Rate limiting - evitar muitas requisições simultâneas
    const now = Date.now();
    if (now - lastLoadTimeRef.current < (isMobile ? 1000 : 500)) {
      return;
    }

    setLoading(true);
    lastLoadTimeRef.current = now;

    try {
      // Simular carregamento de mensagens
      await new Promise(resolve => setTimeout(resolve, isMobile ? 200 : 100));
      
      // Mock data - em produção viria da API
      const novasMensagens: Mensagem[] = Array.from({ length: limit }, (_, i) => ({
        id: `msg-${page}-${i}`,
        conteudo: `Mensagem ${page * limit + i + 1}`,
        remetente_tipo: i % 2 === 0 ? 'cliente' : 'agente',
        remetente_nome: i % 2 === 0 ? 'Cliente' : 'Agente',
        created_at: new Date(Date.now() - i * 60000).toISOString(),
        tipo_mensagem: 'texto',
        status: 'entregue',
        lida: true
      }));

      // Simular atualização do cache com novas mensagens
      console.log('Mensagens carregadas:', novasMensagens.length);

      loadedPagesRef.current.add(page);
      
      // Verificar se há mais mensagens
      if (novasMensagens.length < limit) {
        setHasMore(false);
      }

    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    } finally {
      setLoading(false);
    }
  }, [conversaId, prefetchCount, maxMessages, loading, isMobile]);

  // Função para adicionar nova mensagem ao cache
  const addMessage = useCallback((novaMensagem: Mensagem) => {
    // Em uma implementação real, isso seria feito através de uma função de atualização
    console.log('Adicionando mensagem ao cache:', novaMensagem);
  }, [maxMessages]);

  // Função para atualizar status de mensagem
  const updateMessageStatus = useCallback((messageId: string, newStatus: Mensagem['status']) => {
    console.log('Atualizando status da mensagem:', messageId, newStatus);
  }, []);

  // Função para marcar mensagens como lidas
  const markMessagesAsRead = useCallback((messageIds: string[]) => {
    console.log('Marcando mensagens como lidas:', messageIds);
  }, []);

  // Limpar cache quando conversa muda
  useEffect(() => {
    loadedPagesRef.current.clear();
    setHasMore(true);
    
    // Carregar mensagens iniciais
    if (conversaId) {
      loadMessages(0);
    }
  }, [conversaId, loadMessages]);

  // Preload de próxima página quando próximo do fim
  const preloadNextPage = useCallback(() => {
    if (hasMore && !loading) {
      const nextPage = loadedPagesRef.current.size;
      loadMessages(nextPage);
    }
  }, [hasMore, loading, loadMessages]);

  // Estatísticas de performance
  const getCacheStats = useCallback(() => {
    const cacheData = mensagensCache || { mensagens: [], totalCount: 0, lastUpdate: 0 };
    return {
      totalMessages: cacheData.mensagens.length,
      loadedPages: loadedPagesRef.current.size,
      hasMore,
      cacheSize: JSON.stringify(cacheData).length,
      lastUpdate: cacheData.lastUpdate || 0
    };
  }, [mensagensCache, hasMore]);

  // Limpar cache antigo
  const clearOldCache = useCallback(() => {
    loadedPagesRef.current.clear();
    metadataCache.current.clear();
    console.log('Cache limpo');
  }, []);

  return {
    mensagens: mensagensCache?.mensagens || [],
    loading: loading || cacheLoading,
    hasMore,
    loadMessages,
    addMessage,
    updateMessageStatus,
    markMessagesAsRead,
    preloadNextPage,
    getCacheStats,
    clearOldCache
  };
}

// Hook específico para busca otimizada de mensagens
export function useMessageSearch(conversaId: string, searchTerm: string, debounceMs: number = 300) {
  const [searchResults, setSearchResults] = useState<Mensagem[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  const performSearch = useCallback(async (term: string) => {
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);

    try {
      // Simular busca de mensagens
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Mock results - em produção viria da API/cache
      const results: Mensagem[] = Array.from({ length: 5 }, (_, i) => ({
        id: `search-${i}`,
        conteudo: `Resultado da busca: "${term}" - mensagem ${i + 1}`,
        remetente_tipo: i % 2 === 0 ? 'cliente' : 'agente',
        remetente_nome: i % 2 === 0 ? 'Cliente' : 'Agente',
        created_at: new Date(Date.now() - i * 3600000).toISOString(),
        tipo_mensagem: 'texto',
        status: 'entregue',
        lida: true
      }));

      setSearchResults(results);
    } catch (error) {
      console.error('Erro na busca:', error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      performSearch(searchTerm);
    }, debounceMs);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, debounceMs, performSearch]);

  return {
    searchResults,
    searching
  };
}