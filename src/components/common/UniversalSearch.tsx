/**
 * Componente de busca universal otimizada
 */
import React, { useState, useCallback, useMemo } from 'react';
import { Search, X, Filter, Clock, Star } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useOptimizedQuery } from '@/hooks/useOptimizedQuery';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  type: 'contato' | 'conversa' | 'usuario' | 'empresa';
  score: number;
  metadata?: Record<string, any>;
}

interface UniversalSearchProps {
  onResultSelect?: (result: SearchResult) => void;
  placeholder?: string;
  className?: string;
}

export const UniversalSearch: React.FC<UniversalSearchProps> = ({
  onResultSelect,
  placeholder = "Buscar contatos, conversas, usuários...",
  className = ""
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  const debouncedQuery = useDebounce(query, 300);
  
  // Busca em contatos
  const { data: contatos = [] } = useOptimizedQuery({
    table: 'contatos',
    select: 'id, nome, telefone, email, empresa',
    filters: debouncedQuery ? { 
      nome: `%${debouncedQuery}%` 
    } : {},
    staleTime: 30000,
    enableRealtime: true
  });
  
  // Busca em conversas
  const { data: conversas = [] } = useOptimizedQuery({
    table: 'conversas',
    select: 'id, status, canal, created_at, contatos(nome)',
    filters: debouncedQuery ? { 
      status: 'ativo' 
    } : {},
    staleTime: 30000,
    enableRealtime: true
  });

  const searchResults = useMemo(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) return [];
    
    const results: SearchResult[] = [];
    
    // Resultados de contatos
    contatos?.forEach((contato: any) => {
      const score = calculateRelevanceScore(debouncedQuery, contato.nome, contato.email);
      if (score > 0.3) {
        results.push({
          id: contato.id,
          title: contato.nome,
          subtitle: contato.telefone || contato.email,
          type: 'contato',
          score,
          metadata: contato
        });
      }
    });
    
    // Resultados de conversas
    conversas?.forEach((conversa: any) => {
      const nomeContato = conversa.contatos?.nome || 'Conversa sem nome';
      const score = calculateRelevanceScore(debouncedQuery, nomeContato);
      if (score > 0.2) {
        results.push({
          id: conversa.id,
          title: `Conversa - ${nomeContato}`,
          subtitle: `${conversa.canal} • ${conversa.status}`,
          type: 'conversa',
          score,
          metadata: conversa
        });
      }
    });
    
    return results.sort((a, b) => b.score - a.score).slice(0, 8);
  }, [debouncedQuery, contatos, conversas]);

  const calculateRelevanceScore = (query: string, ...texts: (string | undefined)[]): number => {
    const searchTerm = query.toLowerCase();
    let maxScore = 0;
    
    texts.forEach(text => {
      if (!text) return;
      const normalizedText = text.toLowerCase();
      
      if (normalizedText.includes(searchTerm)) {
        const startMatch = normalizedText.startsWith(searchTerm) ? 1 : 0.8;
        const lengthRatio = searchTerm.length / normalizedText.length;
        maxScore = Math.max(maxScore, startMatch * lengthRatio);
      }
    });
    
    return maxScore;
  };

  const handleResultClick = useCallback((result: SearchResult) => {
    onResultSelect?.(result);
    setQuery('');
    setIsOpen(false);
    
    // Adicionar à lista de buscas recentes
    setRecentSearches(prev => {
      const updated = [result.title, ...prev.filter(item => item !== result.title)];
      return updated.slice(0, 5);
    });
  }, [onResultSelect]);

  const clearQuery = useCallback(() => {
    setQuery('');
    setIsOpen(false);
  }, []);

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="pl-10 pr-10"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearQuery}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {isOpen && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 shadow-lg">
          <CardContent className="p-2">
            {debouncedQuery && debouncedQuery.length >= 2 ? (
              searchResults.length > 0 ? (
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground px-2 py-1">
                    {searchResults.length} resultado(s) encontrado(s)
                  </div>
                  {searchResults.map((result) => (
                    <div
                      key={`${result.type}-${result.id}`}
                      onClick={() => handleResultClick(result)}
                      className="flex items-center gap-3 p-2 rounded hover:bg-accent cursor-pointer"
                    >
                      <Badge variant="outline" className="text-xs">
                        {result.type}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {result.title}
                        </div>
                        {result.subtitle && (
                          <div className="text-xs text-muted-foreground truncate">
                            {result.subtitle}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  Nenhum resultado encontrado para "{debouncedQuery}"
                </div>
              )
            ) : recentSearches.length > 0 ? (
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground px-2 py-1 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Buscas recentes
                </div>
                {recentSearches.map((search, index) => (
                  <div
                    key={index}
                    onClick={() => setQuery(search)}
                    className="flex items-center gap-3 p-2 rounded hover:bg-accent cursor-pointer"
                  >
                    <Star className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm">{search}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground text-sm">
                Digite pelo menos 2 caracteres para buscar
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};