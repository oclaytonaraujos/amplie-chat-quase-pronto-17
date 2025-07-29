import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, Settings, Smartphone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface EvolutionApiGlobalConfig {
  id: string;
  api_key: string;
  server_url: string;
  webhook_base_url: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export default function EvolutionApiConfigTab() {
  const [config, setConfig] = useState<EvolutionApiGlobalConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    api_key: '',
    server_url: '',
    webhook_base_url: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('evolution_api_global_config')
        .select('*')
        .eq('ativo', true)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setConfig(data);
        setFormData({
          api_key: data.api_key,
          server_url: data.server_url,
          webhook_base_url: data.webhook_base_url || '',
        });
      }
    } catch (error) {
      console.error('Erro ao buscar configuração Evolution API:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar configuração Evolution API",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (config) {
        // Atualizar configuração existente
        const { error } = await supabase
          .from('evolution_api_global_config')
          .update(formData)
          .eq('id', config.id);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Configuração Evolution API atualizada com sucesso",
        });
      } else {
        // Criar nova configuração
        const { error } = await supabase
          .from('evolution_api_global_config')
          .insert([{ ...formData, ativo: true }]);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Configuração Evolution API criada com sucesso",
        });
      }

      setIsDialogOpen(false);
      fetchConfig();
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar configuração Evolution API",
        variant: "destructive",
      });
    }
  };

  const toggleConfigStatus = async () => {
    if (!config) return;

    try {
      const { error } = await supabase
        .from('evolution_api_global_config')
        .update({ ativo: !config.ativo })
        .eq('id', config.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Configuração ${config.ativo ? 'desativada' : 'ativada'} com sucesso`,
      });

      fetchConfig();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast({
        title: "Erro",
        description: "Erro ao alterar status da configuração",
        variant: "destructive",
      });
    }
  };

  const handleEdit = () => {
    if (config) {
      setFormData({
        api_key: config.api_key,
        server_url: config.server_url,
        webhook_base_url: config.webhook_base_url || '',
      });
      setIsDialogOpen(true);
    }
  };

  if (loading) {
    return <div className="text-center">Carregando configuração Evolution API...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Configuração Global Evolution API</h3>
          <p className="text-sm text-gray-600">Configure a integração global Evolution API do Amplie Chat</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setFormData({
                api_key: config?.api_key || '',
                server_url: config?.server_url || '',
                webhook_base_url: config?.webhook_base_url || '',
              });
            }}>
              <Settings className="h-4 w-4 mr-2" />
              {config ? 'Editar Configuração' : 'Nova Configuração'}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {config ? 'Editar Configuração Evolution API' : 'Nova Configuração Evolution API'}
              </DialogTitle>
              <DialogDescription>
                Configure a integração global Evolution API para o sistema
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="api_key">API Key Global</Label>
                <Input
                  id="api_key"
                  type="password"
                  value={formData.api_key}
                  onChange={(e) => setFormData(prev => ({ ...prev, api_key: e.target.value }))}
                  placeholder="Sua API Key da Evolution API"
                  required
                />
              </div>

              <div>
                <Label htmlFor="server_url">Server URL</Label>
                <Input
                  id="server_url"
                  value={formData.server_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, server_url: e.target.value }))}
                  placeholder="https://api.evolution-api.com"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="webhook_base_url">Webhook Base URL</Label>
                <Input
                  id="webhook_base_url"
                  value={formData.webhook_base_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, webhook_base_url: e.target.value }))}
                  placeholder="https://seu-webhook.com/evolution-api"
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {config ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {!config ? (
        <Card>
          <CardContent className="text-center py-8">
            <Settings className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma configuração Evolution API</h3>
            <p className="text-gray-500 mb-4">Configure a integração Evolution API para o sistema</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Configuração Global Evolution API</span>
              <div className="flex items-center gap-2">
                <Badge variant={config.ativo ? "default" : "secondary"}>
                  {config.ativo ? 'Ativo' : 'Inativo'}
                </Badge>
                <Switch
                  checked={config.ativo}
                  onCheckedChange={toggleConfigStatus}
                />
              </div>
            </CardTitle>
            <CardDescription>
              Configuração global da Evolution API para todas as instâncias do sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-500">Server URL</Label>
                <p className="text-sm text-blue-600 font-mono">{config.server_url}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Webhook Base URL</Label>
                <p className="text-sm">{config.webhook_base_url || 'Não configurado'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Data Criação</Label>
                <p className="text-sm">{new Date(config.created_at).toLocaleDateString('pt-BR')}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Última Atualização</Label>
                <p className="text-sm">{new Date(config.updated_at).toLocaleDateString('pt-BR')}</p>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button variant="outline" onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Editar Configuração
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}