/**
 * Hook otimizado para queries com cache inteligente
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCallback, useMemo, useEffect } from 'react';

interface OptimizedQueryOptions {
  table: string;
  select?: string;
  filters?: Record<string, any>;
  enableRealtime?: boolean;
  cacheTime?: number;
  staleTime?: number;
}

export function useOptimizedQuery({
  table,
  select = '*',
  filters = {},
  enableRealtime = false,
  cacheTime = 10 * 60 * 1000, // 10 minutos
  staleTime = 5 * 60 * 1000,   // 5 minutos
}: OptimizedQueryOptions) {
  const queryClient = useQueryClient();

  const queryKey = useMemo(() => [
    table,
    select,
    JSON.stringify(filters)
  ], [table, select, filters]);

  const queryFn = useCallback(async () => {
    const query = supabase.from(table as any).select(select);
    
    // Aplicar filtros dinamicamente
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.eq(key, value);
      }
    });
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data;
  }, [table, select, filters]);

  const result = useQuery({
    queryKey,
    queryFn,
    gcTime: cacheTime,
    staleTime,
    refetchOnWindowFocus: false,
    retry: 2,
  });

  // Realtime subscription
  useEffect(() => {
    if (!enableRealtime) return;

    const channel = supabase
      .channel(`${table}-changes`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table },
        () => {
          queryClient.invalidateQueries({ queryKey });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enableRealtime, table, queryClient, queryKey]);

  return result;
}