/**
 * Hook para busca universal avançada
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useOptimizedDebounce } from './usePerformanceOptimizations';
import { supabase } from '@/integrations/supabase/client';

interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  type: 'conversation' | 'contact' | 'user' | 'sector' | 'chatbot' | 'automation';
  url?: string;
  metadata?: Record<string, any>;
  score?: number;
}

interface SearchFilter {
  id: string;
  label: string;
  value: string;
  active: boolean;
}

interface UseAdvancedSearchOptions {
  debounceMs?: number;
  maxResults?: number;
  enableFuzzySearch?: boolean;
  enableRecentSearches?: boolean;
}

export function useAdvancedSearch(options: UseAdvancedSearchOptions = {}) {
  const {
    debounceMs = 300,
    maxResults = 50,
    enableFuzzySearch = true,
    enableRecentSearches = true
  } = options;

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<SearchFilter[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const debouncedQuery = useOptimizedDebounce(query, debounceMs);

  // Carregar buscas recentes do localStorage
  useEffect(() => {
    if (enableRecentSearches) {
      const saved = localStorage.getItem('recentSearches');
      if (saved) {
        try {
          setRecentSearches(JSON.parse(saved));
        } catch (error) {
          console.error('Error loading recent searches:', error);
        }
      }
    }
  }, [enableRecentSearches]);

  // Salvar buscas recentes
  const saveRecentSearch = useCallback((searchQuery: string) => {
    if (!enableRecentSearches || !searchQuery.trim()) return;

    setRecentSearches(prev => {
      const updated = [searchQuery, ...prev.filter(s => s !== searchQuery)].slice(0, 10);
      localStorage.setItem('recentSearches', JSON.stringify(updated));
      return updated;
    });
  }, [enableRecentSearches]);

  // Função para busca fuzzy
  const fuzzyMatch = useCallback((text: string, searchTerm: string): number => {
    if (!enableFuzzySearch) {
      return text.toLowerCase().includes(searchTerm.toLowerCase()) ? 1 : 0;
    }

    const textLower = text.toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    
    // Busca exata
    if (textLower.includes(searchLower)) {
      return 1;
    }
    
    // Busca por iniciais
    const words = textLower.split(' ');
    const searchWords = searchLower.split(' ');
    
    if (searchWords.length === 1) {
      const initials = words.map(w => w.charAt(0)).join('');
      if (initials.includes(searchLower)) {
        return 0.8;
      }
    }
    
    // Busca por caracteres
    let score = 0;
    let searchIndex = 0;
    
    for (let i = 0; i < textLower.length && searchIndex < searchLower.length; i++) {
      if (textLower[i] === searchLower[searchIndex]) {
        score++;
        searchIndex++;
      }
    }
    
    return searchIndex === searchLower.length ? score / textLower.length : 0;
  }, [enableFuzzySearch]);

  // Buscar conversas
  const searchConversations = useCallback(async (searchQuery: string): Promise<SearchResult[]> => {
    const { data, error } = await supabase
      .from('conversas')
      .select(`
        id,
        status,
        canal,
        created_at,
        contatos (nome, telefone),
        profiles (nome)
      `)
      .limit(maxResults);

    if (error) throw error;

    return (data || [])
      .map(conv => {
        const contactName = conv.contatos?.nome || 'Contato sem nome';
        const agentName = conv.profiles?.nome || 'Sem agente';
        const title = `${contactName} - ${conv.canal}`;
        const subtitle = `Agente: ${agentName} | Status: ${conv.status}`;
        
        const score = Math.max(
          fuzzyMatch(contactName, searchQuery),
          fuzzyMatch(agentName, searchQuery),
          fuzzyMatch(conv.status, searchQuery)
        );

        return {
          id: conv.id,
          title,
          subtitle,
          type: 'conversation' as const,
          score,
          metadata: { status: conv.status, canal: conv.canal }
        };
      })
      .filter(result => result.score > 0)
      .sort((a, b) => (b.score || 0) - (a.score || 0));
  }, [fuzzyMatch, maxResults]);

  // Buscar contatos
  const searchContacts = useCallback(async (searchQuery: string): Promise<SearchResult[]> => {
    const { data, error } = await supabase
      .from('contatos')
      .select('id, nome, telefone, email, empresa')
      .limit(maxResults);

    if (error) throw error;

    return (data || [])
      .map(contact => {
        const title = contact.nome;
        const subtitle = [contact.telefone, contact.email, contact.empresa]
          .filter(Boolean)
          .join(' | ');
        
        const score = Math.max(
          fuzzyMatch(contact.nome, searchQuery),
          fuzzyMatch(contact.telefone || '', searchQuery),
          fuzzyMatch(contact.email || '', searchQuery),
          fuzzyMatch(contact.empresa || '', searchQuery)
        );

        return {
          id: contact.id,
          title,
          subtitle,
          type: 'contact' as const,
          score,
          url: `/contatos?id=${contact.id}`,
          metadata: { telefone: contact.telefone, email: contact.email }
        };
      })
      .filter(result => result.score > 0)
      .sort((a, b) => (b.score || 0) - (a.score || 0));
  }, [fuzzyMatch, maxResults]);

  // Buscar usuários
  const searchUsers = useCallback(async (searchQuery: string): Promise<SearchResult[]> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, nome, email, cargo, setor')
      .limit(maxResults);

    if (error) throw error;

    return (data || [])
      .map(user => {
        const title = user.nome;
        const subtitle = [user.cargo, user.setor, user.email]
          .filter(Boolean)
          .join(' | ');
        
        const score = Math.max(
          fuzzyMatch(user.nome, searchQuery),
          fuzzyMatch(user.email, searchQuery),
          fuzzyMatch(user.cargo || '', searchQuery),
          fuzzyMatch(user.setor || '', searchQuery)
        );

        return {
          id: user.id,
          title,
          subtitle,
          type: 'user' as const,
          score,
          url: `/usuarios?id=${user.id}`,
          metadata: { cargo: user.cargo, setor: user.setor }
        };
      })
      .filter(result => result.score > 0)
      .sort((a, b) => (b.score || 0) - (a.score || 0));
  }, [fuzzyMatch, maxResults]);

  // Buscar setores
  const searchSectors = useCallback(async (searchQuery: string): Promise<SearchResult[]> => {
    const { data, error } = await supabase
      .from('setores')
      .select('id, nome, descricao, atendimentos_ativos, agentes_ativos')
      .limit(maxResults);

    if (error) throw error;

    return (data || [])
      .map(sector => {
        const title = sector.nome;
        const subtitle = `${sector.descricao || ''} | Atendimentos: ${sector.atendimentos_ativos} | Agentes: ${sector.agentes_ativos}`;
        
        const score = Math.max(
          fuzzyMatch(sector.nome, searchQuery),
          fuzzyMatch(sector.descricao || '', searchQuery)
        );

        return {
          id: sector.id,
          title,
          subtitle,
          type: 'sector' as const,
          score,
          url: `/setores?id=${sector.id}`,
          metadata: { 
            atendimentos: sector.atendimentos_ativos,
            agentes: sector.agentes_ativos 
          }
        };
      })
      .filter(result => result.score > 0)
      .sort((a, b) => (b.score || 0) - (a.score || 0));
  }, [fuzzyMatch, maxResults]);

  // Buscar chatbots
  const searchChatbots = useCallback(async (searchQuery: string): Promise<SearchResult[]> => {
    const { data, error } = await supabase
      .from('chatbots')
      .select('id, nome, status, mensagem_inicial, interacoes')
      .limit(maxResults);

    if (error) throw error;

    return (data || [])
      .map(chatbot => {
        const title = chatbot.nome;
        const subtitle = `Status: ${chatbot.status} | Interações: ${chatbot.interacoes}`;
        
        const score = Math.max(
          fuzzyMatch(chatbot.nome, searchQuery),
          fuzzyMatch(chatbot.mensagem_inicial, searchQuery),
          fuzzyMatch(chatbot.status, searchQuery)
        );

        return {
          id: chatbot.id,
          title,
          subtitle,
          type: 'chatbot' as const,
          score,
          url: `/chatbot?id=${chatbot.id}`,
          metadata: { status: chatbot.status, interacoes: chatbot.interacoes }
        };
      })
      .filter(result => result.score > 0)
      .sort((a, b) => (b.score || 0) - (a.score || 0));
  }, [fuzzyMatch, maxResults]);

  // Buscar automações
  const searchAutomations = useCallback(async (searchQuery: string): Promise<SearchResult[]> => {
    const { data, error } = await supabase
      .from('automations')
      .select('id, name, status')
      .limit(maxResults);

    if (error) throw error;

    return (data || [])
      .map(automation => {
        const title = automation.name;
        const subtitle = `Status: ${automation.status}`;
        
        const score = Math.max(
          fuzzyMatch(automation.name, searchQuery),
          fuzzyMatch(automation.status, searchQuery)
        );

        return {
          id: automation.id,
          title,
          subtitle,
          type: 'automation' as const,
          score,
          url: `/automations?id=${automation.id}`,
          metadata: { status: automation.status }
        };
      })
      .filter(result => result.score > 0)
      .sort((a, b) => (b.score || 0) - (a.score || 0));
  }, [fuzzyMatch, maxResults]);

  // Função principal de busca
  const performSearch = useCallback(async (searchQuery: string, activeFilters: SearchFilter[]) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const searchPromises: Promise<SearchResult[]>[] = [];
      const filterValues = activeFilters.map(f => f.value);

      if (filterValues.length === 0 || filterValues.includes('conversation')) {
        searchPromises.push(searchConversations(searchQuery));
      }
      if (filterValues.length === 0 || filterValues.includes('contact')) {
        searchPromises.push(searchContacts(searchQuery));
      }
      if (filterValues.length === 0 || filterValues.includes('user')) {
        searchPromises.push(searchUsers(searchQuery));
      }
      if (filterValues.length === 0 || filterValues.includes('sector')) {
        searchPromises.push(searchSectors(searchQuery));
      }
      if (filterValues.length === 0 || filterValues.includes('chatbot')) {
        searchPromises.push(searchChatbots(searchQuery));
      }
      if (filterValues.length === 0 || filterValues.includes('automation')) {
        searchPromises.push(searchAutomations(searchQuery));
      }

      const allResults = await Promise.all(searchPromises);
      const combinedResults = allResults
        .flat()
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .slice(0, maxResults);

      setResults(combinedResults);
      saveRecentSearch(searchQuery);
    } catch (error) {
      console.error('Search error:', error);
      setError('Erro ao realizar busca');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [
    searchConversations,
    searchContacts,
    searchUsers,
    searchSectors,
    searchChatbots,
    searchAutomations,
    maxResults,
    saveRecentSearch
  ]);

  // Executar busca quando query ou filtros mudarem
  useEffect(() => {
    performSearch(debouncedQuery, filters.filter(f => f.active));
  }, [debouncedQuery, filters, performSearch]);

  // Limpar busca
  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
    setError(null);
  }, []);

  // Limpar buscas recentes
  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  }, []);

  return {
    query,
    setQuery,
    results,
    isLoading,
    error,
    filters,
    setFilters,
    recentSearches,
    clearSearch,
    clearRecentSearches,
    performSearch: (q: string) => performSearch(q, filters.filter(f => f.active))
  };
}