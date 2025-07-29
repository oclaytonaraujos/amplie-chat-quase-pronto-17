
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      gcTime: 10 * 60 * 1000, // 10 minutos
      refetchOnWindowFocus: false,
      refetchOnMount: true, // Permitir refetch no mount para dados atualizados
      refetchOnReconnect: true, // Refetch quando reconectar
      retry: (failureCount, error: any) => {
        if (error?.message?.includes('JWT')) return false;
        return failureCount < 2; // Aumentar tentativas para melhor confiabilidade
      },
      networkMode: 'online', // Só fazer queries quando online
    },
    mutations: {
      retry: 1, // Permitir uma retry em mutations
      networkMode: 'online',
    },
  },
});
