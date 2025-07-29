/**
 * Hook simples para paginação de mensagens
 */
import { useState, useCallback } from 'react';

interface MessagePaginationOptions {
  conversaId: string;
  pageSize?: number;
}

interface PaginationResult {
  data: any[];
  hasMore: boolean;
  page: number;
}

export function useMessagePagination(options: MessagePaginationOptions) {
  const { conversaId, pageSize = 20 } = options;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const loadMessages = useCallback(async (): Promise<PaginationResult> => {
    setLoading(true);
    setError(null);
    
    try {
      // Simular carregamento por enquanto
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mockData = {
        data: [],
        hasMore: false,
        page: currentPage
      };
      
      setHasMore(false);
      return mockData;
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [conversaId, currentPage, pageSize]);

  const loadNextPage = useCallback(async () => {
    if (!hasMore || loading) return;
    
    setCurrentPage(prev => prev + 1);
    return loadMessages();
  }, [hasMore, loading, loadMessages]);

  return {
    loading,
    error,
    hasMore,
    loadMessages,
    loadNextPage
  };
}