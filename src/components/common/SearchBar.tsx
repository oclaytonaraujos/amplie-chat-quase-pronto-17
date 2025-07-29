/**
 * Barra de busca universal com funcionalidades avançadas
 */
import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Filter, Clock, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  type: 'conversation' | 'contact' | 'user' | 'sector' | 'chatbot' | 'automation';
  url?: string;
  metadata?: Record<string, any>;
}

interface SearchFilter {
  id: string;
  label: string;
  value: string;
  active: boolean;
}

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string, filters: SearchFilter[]) => void;
  onResultSelect?: (result: SearchResult) => void;
  results?: SearchResult[];
  isLoading?: boolean;
  className?: string;
  showFilters?: boolean;
  recentSearches?: string[];
  onRecentSearchSelect?: (search: string) => void;
  onRecentSearchClear?: () => void;
}

const typeIcons = {
  conversation: '💬',
  contact: '👤', 
  user: '👥',
  sector: '🏢',
  chatbot: '🤖',
  automation: '⚡'
};

const typeLabels = {
  conversation: 'Conversa',
  contact: 'Contato',
  user: 'Usuário', 
  sector: 'Setor',
  chatbot: 'ChatBot',
  automation: 'Automação'
};

export function SearchBar({
  placeholder = "Buscar em tudo...",
  onSearch,
  onResultSelect,
  results = [],
  isLoading = false,
  className,
  showFilters = true,
  recentSearches = [],
  onRecentSearchSelect,
  onRecentSearchClear
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [filters, setFilters] = useState<SearchFilter[]>([
    { id: 'conversations', label: 'Conversas', value: 'conversation', active: false },
    { id: 'contacts', label: 'Contatos', value: 'contact', active: false },
    { id: 'users', label: 'Usuários', value: 'user', active: false },
    { id: 'sectors', label: 'Setores', value: 'sector', active: false },
    { id: 'chatbots', label: 'ChatBots', value: 'chatbot', active: false },
    { id: 'automations', label: 'Automações', value: 'automation', active: false }
  ]);

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(query, 300);

  // Execute search when debounced query changes
  useEffect(() => {
    if (debouncedQuery.length > 0) {
      onSearch?.(debouncedQuery, filters);
      setShowResults(true);
    } else {
      setShowResults(false);
    }
  }, [debouncedQuery, filters, onSearch]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showResults) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, -1));
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && results[selectedIndex]) {
            handleResultSelect(results[selectedIndex]);
          }
          break;
        case 'Escape':
          setShowResults(false);
          setSelectedIndex(-1);
          inputRef.current?.blur();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showResults, selectedIndex, results]);

  const handleResultSelect = (result: SearchResult) => {
    onResultSelect?.(result);
    setQuery('');
    setShowResults(false);
    setSelectedIndex(-1);
    inputRef.current?.blur();
  };

  const handleFilterToggle = (filterId: string) => {
    const updatedFilters = filters.map(filter =>
      filter.id === filterId 
        ? { ...filter, active: !filter.active }
        : filter
    );
    setFilters(updatedFilters);
  };

  const clearFilters = () => {
    setFilters(filters.map(filter => ({ ...filter, active: false })));
  };

  const activeFilters = filters.filter(f => f.active);
  const filteredResults = results.filter(result => {
    if (activeFilters.length === 0) return true;
    return activeFilters.some(filter => filter.value === result.type);
  });

  const handleRecentSearchClick = (search: string) => {
    setQuery(search);
    onRecentSearchSelect?.(search);
    inputRef.current?.focus();
  };

  return (
    <div className={cn("relative w-full max-w-2xl", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length > 0 && setShowResults(true)}
          onBlur={() => {
            // Delay hiding results to allow for clicks
            setTimeout(() => setShowResults(false), 150);
          }}
          className="pl-10 pr-20 h-12 text-base"
        />

        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
          {query && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setQuery('');
                setShowResults(false);
                setSelectedIndex(-1);
              }}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}

          {showFilters && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-8 w-8 p-0",
                    activeFilters.length > 0 && "bg-primary text-primary-foreground"
                  )}
                >
                  <Filter className="h-4 w-4" />
                  {activeFilters.length > 0 && (
                    <Badge 
                      variant="secondary" 
                      className="ml-1 h-5 w-5 p-0 text-xs"
                    >
                      {activeFilters.length}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-3" align="end">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">Filtros de Busca</h4>
                    {activeFilters.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="h-auto p-1 text-xs"
                      >
                        Limpar
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {filters.map((filter) => (
                      <Button
                        key={filter.id}
                        variant={filter.active ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleFilterToggle(filter.id)}
                        className="justify-start text-xs h-8"
                      >
                        {filter.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>

      {/* Active filters display */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {activeFilters.map((filter) => (
            <Badge
              key={filter.id}
              variant="secondary"
              className="text-xs cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => handleFilterToggle(filter.id)}
            >
              {filter.label}
              <X className="ml-1 h-3 w-3" />
            </Badge>
          ))}
        </div>
      )}

      {/* Search results dropdown */}
      {showResults && (
        <div 
          ref={resultsRef}
          className="absolute top-full left-0 right-0 mt-2 bg-popover border rounded-md shadow-lg z-50 max-h-96 overflow-y-auto"
        >
          {isLoading ? (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto" />
              <p className="text-sm text-muted-foreground mt-2">Buscando...</p>
            </div>
          ) : filteredResults.length > 0 ? (
            <div className="py-2">
              {filteredResults.map((result, index) => (
                <button
                  key={result.id}
                  onClick={() => handleResultSelect(result)}
                  className={cn(
                    "w-full text-left px-4 py-3 hover:bg-accent transition-colors",
                    index === selectedIndex && "bg-accent"
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{typeIcons[result.type]}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="font-medium truncate">{result.title}</p>
                        <Badge variant="outline" className="text-xs">
                          {typeLabels[result.type]}
                        </Badge>
                      </div>
                      {result.subtitle && (
                        <p className="text-sm text-muted-foreground truncate">
                          {result.subtitle}
                        </p>
                      )}
                    </div>
                    <Zap className="h-4 w-4 text-muted-foreground" />
                  </div>
                </button>
              ))}
            </div>
          ) : query.length > 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhum resultado encontrado</p>
              <p className="text-xs mt-1">Tente termos diferentes ou remova os filtros</p>
            </div>
          ) : recentSearches.length > 0 ? (
            <div className="py-2">
              <div className="px-4 py-2 flex items-center justify-between">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Buscas Recentes
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRecentSearchClear}
                  className="h-auto p-1 text-xs text-muted-foreground"
                >
                  Limpar
                </Button>
              </div>
              {recentSearches.slice(0, 5).map((search, index) => (
                <button
                  key={index}
                  onClick={() => handleRecentSearchClick(search)}
                  className="w-full text-left px-4 py-2 hover:bg-accent transition-colors text-sm"
                >
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{search}</span>
                  </div>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}