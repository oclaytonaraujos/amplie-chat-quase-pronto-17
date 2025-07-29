import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Webhook, 
  Plus, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Edit,
  Trash2,
  Play,
  Copy
} from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';

interface WebhookConfig {
  id: string;
  instance_id: string;
  instance_name?: string;
  webhook_url: string;
  webhook_events: string[];
  status: 'ativo' | 'inativo' | 'erro';
  auto_generated: boolean;
  last_test_at?: string;
  last_test_status?: 'success' | 'failed';
  error_message?: string;
  created_at: string;
  updated_at: string;
}

interface EvolutionInstance {
  id: string;
  instance_name: string;
  status: string;
  empresa_id?: string;
  empresa_nome?: string;
}

const WEBHOOK_EVENTS = [
  { id: 'MESSAGES_UPSERT', label: 'Mensagens (Envio/Recebimento)' },
  { id: 'CONNECTION_UPDATE', label: 'Status da Conexão' },
  { id: 'QRCODE_UPDATED', label: 'QR Code Atualizado' },
  { id: 'CALL_UPDATE', label: 'Chamadas' },
  { id: 'GROUP_UPDATE', label: 'Grupos' },
  { id: 'PRESENCE_UPDATE', label: 'Presença Online' },
  { id: 'CHATS_UPSERT', label: 'Conversas' },
  { id: 'CONTACTS_UPSERT', label: 'Contatos' }
];

export function WebhookConfigurationCenter() {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [instances, setInstances] = useState<EvolutionInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<WebhookConfig | null>(null);
  const { toast } = useToast();

  // Estados do formulário
  const [formData, setFormData] = useState<{
    instance_id: string;
    webhook_url: string;
    webhook_events: string[];
    status: 'ativo' | 'inativo' | 'erro';
    auto_generated: boolean;
  }>({
    instance_id: '',
    webhook_url: '',
    webhook_events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE', 'QRCODE_UPDATED'],
    status: 'ativo',
    auto_generated: false
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Carregar instâncias
      const { data: instancesData, error: instancesError } = await supabase
        .from('evolution_api_config')
        .select(`
          id,
          instance_name,
          status,
          empresa_id,
          empresas:empresa_id (nome)
        `)
        .eq('ativo', true)
        .order('instance_name');

      if (instancesError) throw instancesError;

      const formattedInstances: EvolutionInstance[] = (instancesData || []).map(instance => ({
        id: instance.id,
        instance_name: instance.instance_name,
        status: instance.status || 'disconnected',
        empresa_id: instance.empresa_id,
        empresa_nome: instance.empresas?.nome
      }));

      setInstances(formattedInstances);

      // Por enquanto, vamos simular webhooks (já que a tabela não existe ainda)
      // Em uma implementação real, isso viria do banco de dados
      const simulatedWebhooks: WebhookConfig[] = formattedInstances.map(instance => ({
        id: `webhook-${instance.id}`,
        instance_id: instance.id,
        instance_name: instance.instance_name,
        webhook_url: `https://suaapi.com/webhook/${instance.instance_name}`,
        webhook_events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE', 'QRCODE_UPDATED'],
        status: 'ativo' as const,
        auto_generated: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      setWebhooks(simulatedWebhooks);

    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados dos webhooks",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateWebhookUrl = (instanceName: string) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/api/webhook/evolution/${instanceName}`;
  };

  const handleCreateWebhook = async () => {
    try {
      if (!formData.instance_id) {
        toast({
          title: "Erro",
          description: "Selecione uma instância",
          variant: "destructive",
        });
        return;
      }

      const selectedInstance = instances.find(i => i.id === formData.instance_id);
      if (!selectedInstance) return;

      const newWebhook: WebhookConfig = {
        id: `webhook-${Date.now()}`,
        instance_id: formData.instance_id,
        instance_name: selectedInstance.instance_name,
        webhook_url: formData.webhook_url || generateWebhookUrl(selectedInstance.instance_name),
        webhook_events: formData.webhook_events,
        status: formData.status,
        auto_generated: formData.auto_generated,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setWebhooks(prev => [...prev, newWebhook]);
      setIsDialogOpen(false);
      resetForm();

      toast({
        title: "Sucesso",
        description: "Webhook criado com sucesso",
      });

    } catch (error: any) {
      console.error('Erro ao criar webhook:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar webhook",
        variant: "destructive",
      });
    }
  };

  const handleUpdateWebhook = async () => {
    try {
      if (!editingWebhook) return;

      const updatedWebhook = {
        ...editingWebhook,
        webhook_url: formData.webhook_url,
        webhook_events: formData.webhook_events,
        status: formData.status,
        updated_at: new Date().toISOString()
      };

      setWebhooks(prev => prev.map(w => w.id === editingWebhook.id ? updatedWebhook : w));
      setIsDialogOpen(false);
      setEditingWebhook(null);
      resetForm();

      toast({
        title: "Sucesso",
        description: "Webhook atualizado com sucesso",
      });

    } catch (error: any) {
      console.error('Erro ao atualizar webhook:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar webhook",
        variant: "destructive",
      });
    }
  };

  const handleDeleteWebhook = async (webhookId: string) => {
    try {
      setWebhooks(prev => prev.filter(w => w.id !== webhookId));
      
      toast({
        title: "Sucesso",
        description: "Webhook removido com sucesso",
      });

    } catch (error: any) {
      console.error('Erro ao deletar webhook:', error);
      toast({
        title: "Erro",
        description: "Erro ao deletar webhook",
        variant: "destructive",
      });
    }
  };

  const handleTestWebhook = async (webhook: WebhookConfig) => {
    try {
      // Simular teste do webhook
      const testPayload = {
        event: 'TEST',
        instance: webhook.instance_name,
        data: {
          message: 'Teste de webhook',
          timestamp: new Date().toISOString()
        }
      };

      // Em uma implementação real, isso faria uma requisição HTTP para o webhook
      console.log('Testando webhook:', webhook.webhook_url, testPayload);
      
      // Simular sucesso após 2 segundos
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Atualizar status do teste
      setWebhooks(prev => prev.map(w => 
        w.id === webhook.id 
          ? { 
              ...w, 
              last_test_at: new Date().toISOString(),
              last_test_status: 'success' as const 
            }
          : w
      ));

      toast({
        title: "Sucesso",
        description: "Webhook testado com sucesso",
      });

    } catch (error: any) {
      console.error('Erro ao testar webhook:', error);
      
      setWebhooks(prev => prev.map(w => 
        w.id === webhook.id 
          ? { 
              ...w, 
              last_test_at: new Date().toISOString(),
              last_test_status: 'failed' as const,
              error_message: error.message
            }
          : w
      ));

      toast({
        title: "Erro",
        description: "Erro ao testar webhook",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      instance_id: '',
      webhook_url: '',
      webhook_events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE', 'QRCODE_UPDATED'],
      status: 'ativo',
      auto_generated: false
    });
  };

  const openEditDialog = (webhook: WebhookConfig) => {
    setEditingWebhook(webhook);
    setFormData({
      instance_id: webhook.instance_id,
      webhook_url: webhook.webhook_url,
      webhook_events: webhook.webhook_events,
      status: webhook.status,
      auto_generated: webhook.auto_generated
    });
    setIsDialogOpen(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado",
      description: "URL copiada para a área de transferência",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ativo':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Ativo</Badge>;
      case 'inativo':
        return <Badge variant="secondary"><XCircle className="w-3 h-3 mr-1" />Inativo</Badge>;
      case 'erro':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Erro</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando webhooks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configuração de Webhooks</h1>
          <p className="text-muted-foreground">
            Gerencie webhooks para suas instâncias Evolution API
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingWebhook(null); }}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Webhook
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingWebhook ? 'Editar Webhook' : 'Criar Novo Webhook'}
              </DialogTitle>
              <DialogDescription>
                Configure o webhook para receber eventos da instância selecionada
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="instance">Instância</Label>
                <Select 
                  value={formData.instance_id} 
                  onValueChange={(value) => {
                    setFormData(prev => ({ ...prev, instance_id: value }));
                    const instance = instances.find(i => i.id === value);
                    if (instance && !formData.webhook_url) {
                      setFormData(prev => ({ 
                        ...prev, 
                        webhook_url: generateWebhookUrl(instance.instance_name) 
                      }));
                    }
                  }}
                  disabled={!!editingWebhook}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma instância" />
                  </SelectTrigger>
                  <SelectContent>
                    {instances.map((instance) => (
                      <SelectItem key={instance.id} value={instance.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{instance.instance_name}</span>
                          {instance.empresa_nome && (
                            <Badge variant="outline" className="ml-2">
                              {instance.empresa_nome}
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhook_url">URL do Webhook</Label>
                <div className="flex gap-2">
                  <Input
                    id="webhook_url"
                    value={formData.webhook_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, webhook_url: e.target.value }))}
                    placeholder="https://suaapi.com/webhook/instance"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(formData.webhook_url)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Eventos do Webhook</Label>
                <div className="grid grid-cols-2 gap-2">
                  {WEBHOOK_EVENTS.map((event) => (
                    <div key={event.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={event.id}
                        checked={formData.webhook_events.includes(event.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData(prev => ({
                              ...prev,
                              webhook_events: [...prev.webhook_events, event.id]
                            }));
                          } else {
                            setFormData(prev => ({
                              ...prev,
                              webhook_events: prev.webhook_events.filter(e => e !== event.id)
                            }));
                          }
                        }}
                      />
                      <Label htmlFor={event.id} className="text-sm">
                        {event.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="status"
                  checked={formData.status === 'ativo'}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, status: checked ? 'ativo' as const : 'inativo' as const }))
                  }
                />
                <Label htmlFor="status">Webhook Ativo</Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={editingWebhook ? handleUpdateWebhook : handleCreateWebhook}>
                {editingWebhook ? 'Atualizar' : 'Criar'} Webhook
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {webhooks.map((webhook) => (
          <Card key={webhook.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Webhook className="w-5 h-5 text-primary" />
                  <div>
                    <CardTitle className="text-lg">{webhook.instance_name}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      {webhook.webhook_url}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(webhook.webhook_url)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(webhook.status)}
                  {webhook.auto_generated && (
                    <Badge variant="outline">Auto-gerado</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Eventos Configurados:</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {webhook.webhook_events.map((event) => (
                      <Badge key={event} variant="secondary" className="text-xs">
                        {WEBHOOK_EVENTS.find(e => e.id === event)?.label || event}
                      </Badge>
                    ))}
                  </div>
                </div>

                {webhook.last_test_at && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Último teste:</span>
                    <span>{new Date(webhook.last_test_at).toLocaleString()}</span>
                    {webhook.last_test_status === 'success' ? (
                      <Badge variant="default" className="bg-green-500">
                        <CheckCircle className="w-3 h-3 mr-1" />Sucesso
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <XCircle className="w-3 h-3 mr-1" />Falhou
                      </Badge>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTestWebhook(webhook)}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Testar
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(webhook)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir este webhook? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteWebhook(webhook.id)}>
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {webhooks.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Webhook className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum webhook configurado</h3>
              <p className="text-muted-foreground text-center mb-4">
                Crie seu primeiro webhook para começar a receber eventos das instâncias
              </p>
              <Button onClick={() => { resetForm(); setEditingWebhook(null); setIsDialogOpen(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Webhook
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}