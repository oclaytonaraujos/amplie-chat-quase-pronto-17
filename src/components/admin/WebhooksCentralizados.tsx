import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Settings, Trash2, RefreshCw, AlertCircle, CheckCircle, Link } from 'lucide-react';

interface WebhookConfig {
  id: string;
  instance_id: string;
  empresa_id: string;
  webhook_url: string;
  webhook_events: string[];
  ativo: boolean;
  webhook_status: string;
  ultimo_teste?: string;
  ultimo_erro?: string;
  created_at: string;
  updated_at: string;
}

interface EvolutionInstance {
  id: string;
  instance_name: string;
  empresa_id: string;
  status: string;
  numero?: string;
  descricao?: string;
}

interface Empresa {
  id: string;
  nome: string;
}

const WEBHOOK_EVENTS = [
  'APPLICATION_STARTUP',
  'CALL',
  'CHATS_DELETE',
  'CHATS_SET',
  'CHATS_UPDATE',
  'CHATS_UPSERT',
  'CONNECTION_UPDATE',
  'CONTACTS_SET',
  'CONTACTS_UPDATE',
  'CONTACTS_UPSERT',
  'GROUP_PARTICIPANTS_UPDATE',
  'GROUP_UPDATE',
  'GROUPS_UPSERT',
  'LABELS_ASSOCIATION',
  'LABELS_EDIT',
  'LOGOUT_INSTANCE',
  'MESSAGES_DELETE',
  'MESSAGES_SET',
  'MESSAGES_UPDATE',
  'MESSAGES_UPSERT',
  'PRESENCE_UPDATE',
  'QRCODE_UPDATED',
  'REMOVE_INSTANCE',
  'SEND_MESSAGE',
  'TYPEBOT_CHANGE_STATUS',
  'TYPEBOT_START'
];

export function WebhooksCentralizados() {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [instances, setInstances] = useState<EvolutionInstance[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<WebhookConfig | null>(null);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string>('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>(WEBHOOK_EVENTS);
  const [webhookUrl, setWebhookUrl] = useState('https://obtpghqvrygzcukdaiej.supabase.co/functions/v1/whatsapp-webhook-evolution');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Carregar webhooks
      const { data: webhooksData, error: webhooksError } = await supabase
        .from('webhooks_config' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (webhooksError) throw webhooksError;

      // Carregar instâncias
      const { data: instancesData, error: instancesError } = await supabase
        .from('evolution_api_config')
        .select('id, instance_name, empresa_id, status, numero, descricao')
        .order('instance_name');

      if (instancesError) throw instancesError;

      // Carregar empresas
      const { data: empresasData, error: empresasError } = await supabase
        .from('empresas')
        .select('id, nome')
        .eq('ativo', true)
        .order('nome');

      if (empresasError) throw empresasError;

      setWebhooks((webhooksData as unknown as WebhookConfig[]) || []);
      setInstances(instancesData || []);
      setEmpresas(empresasData || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar dados dos webhooks",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWebhook = async () => {
    if (!selectedInstanceId) {
      toast({
        title: "Erro",
        description: "Selecione uma instância para o webhook",
        variant: "destructive",
      });
      return;
    }

    try {
      const selectedInstance = instances.find(i => i.id === selectedInstanceId);
      if (!selectedInstance) return;

      const { data, error } = await supabase
        .from('webhooks_config' as any)
        .insert({
          instance_id: selectedInstanceId,
          empresa_id: selectedInstance.empresa_id,
          webhook_url: webhookUrl,
          webhook_events: selectedEvents,
          ativo: true,
        })
        .select()
        .single();

      if (error) throw error;

      setWebhooks(prev => [data as unknown as WebhookConfig, ...prev]);
      setIsDialogOpen(false);
      resetForm();
      
      toast({
        title: "Sucesso",
        description: "Webhook criado com sucesso",
      });
    } catch (error) {
      console.error('Erro ao criar webhook:', error);
      toast({
        title: "Erro",
        description: "Falha ao criar webhook",
        variant: "destructive",
      });
    }
  };

  const handleUpdateWebhook = async () => {
    if (!selectedWebhook) return;

    try {
      const { data, error } = await supabase
        .from('webhooks_config' as any)
        .update({
          webhook_url: webhookUrl,
          webhook_events: selectedEvents,
          ativo: selectedWebhook.ativo,
        })
        .eq('id', selectedWebhook.id)
        .select()
        .single();

      if (error) throw error;

      setWebhooks(prev => prev.map(w => w.id === selectedWebhook.id ? data as unknown as WebhookConfig : w));
      setIsDialogOpen(false);
      resetForm();
      
      toast({
        title: "Sucesso",
        description: "Webhook atualizado com sucesso",
      });
    } catch (error) {
      console.error('Erro ao atualizar webhook:', error);
      toast({
        title: "Erro",
        description: "Falha ao atualizar webhook",
        variant: "destructive",
      });
    }
  };

  const handleDeleteWebhook = async (webhookId: string) => {
    try {
      const { error } = await supabase
        .from('webhooks_config' as any)
        .delete()
        .eq('id', webhookId);

      if (error) throw error;

      setWebhooks(prev => prev.filter(w => w.id !== webhookId));
      
      toast({
        title: "Sucesso",
        description: "Webhook excluído com sucesso",
      });
    } catch (error) {
      console.error('Erro ao excluir webhook:', error);
      toast({
        title: "Erro",
        description: "Falha ao excluir webhook",
        variant: "destructive",
      });
    }
  };

  const handleToggleWebhook = async (webhookId: string, ativo: boolean) => {
    try {
      const { error } = await supabase
        .from('webhooks_config' as any)
        .update({ ativo })
        .eq('id', webhookId);

      if (error) throw error;

      setWebhooks(prev => prev.map(w => w.id === webhookId ? { ...w, ativo } : w));
      
      toast({
        title: "Sucesso",
        description: `Webhook ${ativo ? 'ativado' : 'desativado'} com sucesso`,
      });
    } catch (error) {
      console.error('Erro ao alterar status do webhook:', error);
      toast({
        title: "Erro",
        description: "Falha ao alterar status do webhook",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setSelectedWebhook(null);
    setSelectedInstanceId('');
    setSelectedEvents(WEBHOOK_EVENTS);
    setWebhookUrl('https://obtpghqvrygzcukdaiej.supabase.co/functions/v1/whatsapp-webhook-evolution');
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (webhook: WebhookConfig) => {
    setSelectedWebhook(webhook);
    setSelectedInstanceId(webhook.instance_id);
    setSelectedEvents(webhook.webhook_events);
    setWebhookUrl(webhook.webhook_url);
    setIsDialogOpen(true);
  };

  const getInstanceName = (instanceId: string) => {
    const instance = instances.find(i => i.id === instanceId);
    return instance?.instance_name || 'Instância não encontrada';
  };

  const getEmpresaName = (empresaId: string) => {
    const empresa = empresas.find(e => e.id === empresaId);
    return empresa?.nome || 'Empresa não encontrada';
  };

  const getStatusBadge = (webhook: WebhookConfig) => {
    if (!webhook.ativo) {
      return <Badge variant="secondary">Inativo</Badge>;
    }

    switch (webhook.webhook_status) {
      case 'ativo':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Ativo</Badge>;
      case 'erro':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Erro</Badge>;
      default:
        return <Badge variant="outline">Pendente</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gerenciamento Centralizado de Webhooks</h2>
          <p className="text-muted-foreground">
            Configure e monitore todos os webhooks do sistema
          </p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Webhook
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Webhooks</CardTitle>
            <Link className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{webhooks.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Webhooks Ativos</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {webhooks.filter(w => w.ativo && w.webhook_status === 'ativo').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Com Erro</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {webhooks.filter(w => w.webhook_status === 'erro').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Webhooks Configurados</CardTitle>
          <CardDescription>
            Lista de todos os webhooks configurados no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Instância</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Eventos</TableHead>
                <TableHead>Última Atualização</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {webhooks.map((webhook) => (
                <TableRow key={webhook.id}>
                  <TableCell className="font-medium">
                    {getInstanceName(webhook.instance_id)}
                  </TableCell>
                  <TableCell>{getEmpresaName(webhook.empresa_id)}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {webhook.webhook_url}
                  </TableCell>
                  <TableCell>{getStatusBadge(webhook)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{webhook.webhook_events.length} eventos</Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(webhook.updated_at).toLocaleString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={webhook.ativo}
                        onCheckedChange={(checked) => handleToggleWebhook(webhook.id, checked)}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(webhook)}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteWebhook(webhook.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedWebhook ? 'Editar Webhook' : 'Criar Novo Webhook'}
            </DialogTitle>
            <DialogDescription>
              Configure o webhook para receber eventos da instância selecionada
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="instance">Instância</Label>
              <Select
                value={selectedInstanceId}
                onValueChange={setSelectedInstanceId}
                disabled={!!selectedWebhook}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma instância" />
                </SelectTrigger>
                <SelectContent>
                  {instances.filter(instance => 
                    !selectedWebhook && !webhooks.some(w => w.instance_id === instance.id)
                  ).map((instance) => (
                    <SelectItem key={instance.id} value={instance.id}>
                      {instance.instance_name} - {getEmpresaName(instance.empresa_id)}
                    </SelectItem>
                  ))}
                  {selectedWebhook && (
                    <SelectItem value={selectedInstanceId}>
                      {getInstanceName(selectedInstanceId)} - {getEmpresaName(selectedWebhook.empresa_id)}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">URL do Webhook</Label>
              <Input
                id="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://sua-url-webhook.com/endpoint"
              />
            </div>

            <div className="space-y-2">
              <Label>Eventos Habilitados ({selectedEvents.length}/{WEBHOOK_EVENTS.length})</Label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border rounded">
                {WEBHOOK_EVENTS.map((event) => (
                  <div key={event} className="flex items-center space-x-2">
                    <Switch
                      checked={selectedEvents.includes(event)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedEvents(prev => [...prev, event]);
                        } else {
                          setSelectedEvents(prev => prev.filter(e => e !== event));
                        }
                      }}
                    />
                    <Label className="text-xs">{event}</Label>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedEvents(WEBHOOK_EVENTS)}
                >
                  Selecionar Todos
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedEvents([])}
                >
                  Desmarcar Todos
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={selectedWebhook ? handleUpdateWebhook : handleCreateWebhook}>
              {selectedWebhook ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}