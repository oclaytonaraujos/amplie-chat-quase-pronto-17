import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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
  const { toast } = useToast();

  const selectedInstancesData = instances.filter(instance => selectedInstances.includes(instance.id));

  const handleSelectAll = () => {
    if (selectedInstances.length === instances.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(instances.map(instance => instance.id));
    }
  };

  // Since Evolution API is removed, bulk actions now only work via n8n webhooks
  const handleBulkNotification = async () => {
    setLoading(true);
    
    toast({
      title: "Funcionalidade Migrada",
      description: "As ações em lote agora são processadas via n8n webhooks",
    });
    
    setLoading(false);
  };

  if (instances.length === 0) {
    return null;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            Ações em Lote via n8n
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
            <p>Ações em lote agora são processadas via n8n</p>
            <p className="text-sm">Configure seus fluxos n8n para gerenciar instâncias</p>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Funcionalidade Migrada
            </AlertDialogTitle>
            <AlertDialogDescription>
              As ações de exclusão em lote agora são processadas via n8n webhooks.
              Configure seus fluxos n8n para gerenciar as instâncias.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Entendi</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}