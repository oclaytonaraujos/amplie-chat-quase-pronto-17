import { useState } from 'react';
import { Building2, Users, Clock, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useSetoresQuery } from '@/hooks/useSetoresQuery';
import { NovoSetorDialog } from '@/components/setores/NovoSetorDialog';
import { EditarSetorDialog } from '@/components/setores/EditarSetorDialog';
import { ExcluirSetorDialog } from '@/components/setores/ExcluirSetorDialog';
import { SetorCard } from '@/components/setores/SetorCard';
import { StatsCard } from '@/components/setores/StatsCard';
import { EmptyState } from '@/components/setores/EmptyState';
import { type SetorData } from '@/services/setoresService';
export default function Setores() {
  const [searchTerm, setSearchTerm] = useState('');
  const [setorParaEditar, setSetorParaEditar] = useState<SetorData | null>(null);
  const [setorParaExcluir, setSetorParaExcluir] = useState<SetorData | null>(null);
  const {
    data: setores = [],
    isLoading,
    error
  } = useSetoresQuery();
  const filteredSetores = setores.filter(setor => setor.nome.toLowerCase().includes(searchTerm.toLowerCase()) || setor.descricao && setor.descricao.toLowerCase().includes(searchTerm.toLowerCase()));
  if (isLoading) {
    return <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando setores...</p>
        </div>
      </div>;
  }
  if (error) {
    return <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 mb-4">Erro ao carregar setores</p>
          <p className="text-sm text-gray-500">{error.message}</p>
        </div>
      </div>;
  }
  return <div className="p-4 md:p-6 space-y-6 min-h-screen">
      {/* Header com botão de ação */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          
          
        </div>
        <div className="flex-shrink-0">
          <NovoSetorDialog />
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-amplie p-4 md:p-6">
        <Input placeholder="Pesquisar setores..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full" />
      </div>

      {/* Estatísticas gerais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <StatsCard title="Total de Setores" value={setores.length} icon={Building2} iconColor="text-blue-600" iconBgColor="bg-blue-100" />
        <StatsCard title="Setores Ativos" value={setores.filter(s => s.ativo).length} icon={Users} iconColor="text-green-600" iconBgColor="bg-green-100" />
        <div className="sm:col-span-2 lg:col-span-1">
          <StatsCard title="Setores Inativos" value={setores.filter(s => !s.ativo).length} icon={Clock} iconColor="text-orange-600" iconBgColor="bg-orange-100" />
        </div>
      </div>

      {/* Setores Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {filteredSetores.map(setor => <SetorCard key={setor.id} setor={setor} onEdit={setSetorParaEditar} onDelete={setSetorParaExcluir} />)}
      </div>

      {/* Empty States */}
      {filteredSetores.length === 0 && setores.length > 0 && <EmptyState type="search" searchTerm={searchTerm} />}

      {setores.length === 0 && <EmptyState type="initial" />}

      {/* Dialogs */}
      {setorParaEditar && <EditarSetorDialog setor={setorParaEditar} open={!!setorParaEditar} onOpenChange={open => !open && setSetorParaEditar(null)} />}

      <ExcluirSetorDialog setor={setorParaExcluir} open={!!setorParaExcluir} onOpenChange={open => !open && setSetorParaExcluir(null)} />
    </div>;
}