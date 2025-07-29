import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, Power, PowerOff, Settings, Trash2, CheckSquare, Square, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useEvolutionAPIComplete } from '@/hooks/useEvolutionAPIComplete';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
interface InstanciaCompleta {
  id: string;
  instance_name: string;
  status: string;
  numero?: string;
  ativo: boolean;
  empresa_id?: string;
  empresa_nome?: string;
  webhook_status?: 'ativo' | 'inativo' | 'erro';
}
interface InstanceBulkActionsProps {
  instances: InstanciaCompleta[];
  selectedInstances: string[];
  onSelectionChange: (instanceIds: string[]) => void;
  onRefresh: () => void;
}
export function InstanceBulkActions({
  instances,
  selectedInstances,
  onSelectionChange,
  onRefresh
}: InstanceBulkActionsProps) {
  const [loading, setLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const {
    toast
  } = useToast();
  const {
    connectInstance,
    deleteInstance,
    configureCompleteWebhook
  } = useEvolutionAPIComplete();
  const selectedInstancesData = instances.filter(instance => selectedInstances.includes(instance.id));
  const handleSelectAll = () => {
    if (selectedInstances.length === instances.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(instances.map(instance => instance.id));
    }
  };
  const handleBulkConnect = async () => {
    setLoading(true);
    const disconnectedInstances = selectedInstancesData.filter(instance => instance.status === 'disconnected');
    if (disconnectedInstances.length === 0) {
      toast({
        title: "Nenhuma ação necessária",
        description: "Todas as instâncias selecionadas já estão conectadas"
      });
      setLoading(false);
      return;
    }
    let successCount = 0;
    let failureCount = 0;
    for (const instance of disconnectedInstances) {
      try {
        await connectInstance(instance.instance_name);
        successCount++;
      } catch (error) {
        console.error(`Erro ao conectar ${instance.instance_name}:`, error);
        failureCount++;
      }
    }
    toast({
      title: "Operação de conexão concluída",
      description: `${successCount} instâncias conectadas, ${failureCount} falharam`,
      variant: failureCount > 0 ? "destructive" : "default"
    });
    setLoading(false);
    onRefresh();
  };
  const handleBulkConfigureWebhook = async () => {
    setLoading(true);
    const inactiveWebhookInstances = selectedInstancesData.filter(instance => instance.webhook_status !== 'ativo');
    if (inactiveWebhookInstances.length === 0) {
      toast({
        title: "Nenhuma ação necessária",
        description: "Todas as instâncias selecionadas já têm webhook ativo"
      });
      setLoading(false);
      return;
    }
    let successCount = 0;
    let failureCount = 0;
    for (const instance of inactiveWebhookInstances) {
      try {
        await configureCompleteWebhook(instance.instance_name);
        successCount++;
      } catch (error) {
        console.error(`Erro ao configurar webhook ${instance.instance_name}:`, error);
        failureCount++;
      }
    }
    toast({
      title: "Configuração de webhooks concluída",
      description: `${successCount} webhooks configurados, ${failureCount} falharam`,
      variant: failureCount > 0 ? "destructive" : "default"
    });
    setLoading(false);
    onRefresh();
  };
  const handleBulkDelete = async () => {
    setLoading(true);
    setShowDeleteDialog(false);
    let successCount = 0;
    let failureCount = 0;
    for (const instance of selectedInstancesData) {
      try {
        await deleteInstance(instance.instance_name);
        successCount++;
      } catch (error) {
        console.error(`Erro ao deletar ${instance.instance_name}:`, error);
        failureCount++;
      }
    }
    toast({
      title: "Exclusão em lote concluída",
      description: `${successCount} instâncias excluídas, ${failureCount} falharam`,
      variant: failureCount > 0 ? "destructive" : "default"
    });
    onSelectionChange([]);
    setLoading(false);
    onRefresh();
  };
  const disconnectedCount = selectedInstancesData.filter(i => i.status === 'disconnected').length;
  const inactiveWebhookCount = selectedInstancesData.filter(i => i.webhook_status !== 'ativo').length;
  if (instances.length === 0) {
    return null;
  }
  return <>
      <Card>
        
        
      </Card>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Confirmar Exclusão em Lote
            </AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a excluir {selectedInstances.length} instância(s):
              <div className="mt-2 max-h-32 overflow-y-auto">
                <ul className="list-disc list-inside space-y-1">
                  {selectedInstancesData.map(instance => <li key={instance.id} className="text-sm">
                      <span className="font-mono">{instance.instance_name}</span>
                      {instance.empresa_nome && <span className="text-muted-foreground"> - {instance.empresa_nome}</span>}
                    </li>)}
                </ul>
              </div>
              <p className="mt-3 font-medium text-red-600">
                Esta ação não pode ser desfeita. As instâncias serão removidas tanto da Evolution API quanto do banco de dados.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-red-600 hover:bg-red-700">
              Excluir Todas
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>;
}