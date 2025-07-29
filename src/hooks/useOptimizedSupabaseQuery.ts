
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Database } from '@/integrations/supabase/types';

type TableName = keyof Database['public']['Tables'];

interface QueryOptions {
  table: TableName;
  select?: string;
  filters?: Array<{
    column: string;
    operator: string;
    value: any;
  }>;
  orderBy?: {
    column: string;
    ascending?: boolean;
  };
  limit?: number;
  enabled?: boolean;
}

export function useOptimizedSupabaseQuery<T = any>({
  table,
  select = '*',
  filters = [],
  orderBy,
  limit,
  enabled = true
}: QueryOptions) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const executeQuery = useCallback(async () => {
    if (!enabled || !user) {
      setData([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let query = supabase.from(table).select(select);

      // Aplicar filtros
      filters.forEach(filter => {
        query = query.filter(filter.column, filter.operator, filter.value);
      });

      // Aplicar ordenação
      if (orderBy) {
        query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true });
      }

      // Aplicar limite
      if (limit) {
        query = query.limit(limit);
      }

      const { data: result, error: queryError } = await query;

      if (queryError) {
        throw queryError;
      }

      setData((result as T[]) || []);
    } catch (err: any) {
      console.error(`Erro na consulta da tabela ${table}:`, err);
      setError(err.message || 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [table, select, filters, orderBy, limit, enabled, user]);

  useEffect(() => {
    executeQuery();
  }, [executeQuery]);

  const refetch = useCallback(() => {
    executeQuery();
  }, [executeQuery]);

  return {
    data,
    loading,
    error,
    refetch
  };
}
