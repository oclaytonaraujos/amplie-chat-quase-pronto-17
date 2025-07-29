
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { SetoresService, type SetorData, type CreateSetorData, type UpdateSetorData } from '@/services/setoresService';

const SETORES_QUERY_KEY = 'setores';

export function useSetoresQuery() {
  return useQuery({
    queryKey: [SETORES_QUERY_KEY],
    queryFn: SetoresService.getSetores,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });
}

export function useCreateSetorMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (setor: CreateSetorData) => SetoresService.createSetor(setor),
    onSuccess: (newSetor) => {
      queryClient.setQueryData([SETORES_QUERY_KEY], (old: SetorData[] | undefined) => {
        return old ? [newSetor, ...old] : [newSetor];
      });
      toast.success(`Setor "${newSetor.nome}" criado com sucesso!`);
    },
    onError: (error: Error) => {
      console.error('Erro ao criar setor:', error);
      toast.error(error.message || 'Erro ao criar setor');
    },
  });
}

export function useUpdateSetorMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateSetorData }) => 
      SetoresService.updateSetor(id, updates),
    onSuccess: (updatedSetor) => {
      queryClient.setQueryData([SETORES_QUERY_KEY], (old: SetorData[] | undefined) => {
        return old ? old.map(s => s.id === updatedSetor.id ? updatedSetor : s) : [updatedSetor];
      });
      toast.success(`Setor "${updatedSetor.nome}" atualizado com sucesso!`);
    },
    onError: (error: Error) => {
      console.error('Erro ao atualizar setor:', error);
      toast.error(error.message || 'Erro ao atualizar setor');
    },
  });
}

export function useDeleteSetorMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => SetoresService.deleteSetor(id),
    onSuccess: (_, deletedId) => {
      queryClient.setQueryData([SETORES_QUERY_KEY], (old: SetorData[] | undefined) => {
        return old ? old.filter(s => s.id !== deletedId) : [];
      });
      toast.success('Setor excluído com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Erro ao excluir setor:', error);
      toast.error(error.message || 'Erro ao excluir setor');
    },
  });
}
