
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, ExternalLink, Zap, Bot } from 'lucide-react';
import { WhatsAppManager } from '@/components/whatsapp/WhatsAppManager';
import { N8nConfigDialog } from '@/components/admin/N8nConfigDialog';
import { WebhookConfigurationCenter } from '@/components/admin/WebhookConfigurationCenter';
import { ChatbotStateManager } from '@/components/admin/ChatbotStateManager';
import { WebhookMonitoring } from '@/components/admin/WebhookMonitoring';
import { WebhookTester } from '@/components/admin/WebhookTester';

export function WhatsAppTab() {
  const [showN8nConfig, setShowN8nConfig] = useState(false);

  return (
    <div className="space-y-8 p-2">
      {/* Configuração n8n */}
      <Card className="rounded-2xl shadow-lg border-0">
        <CardHeader className="p-6">
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Configuração n8n + Evolution API
          </CardTitle>
          <CardDescription>
            Configure a integração completa entre n8n e Evolution API para gerenciar mensagens do WhatsApp
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                O n8n atua como middleware entre o Amplie Chat e a Evolution API, permitindo flexibilidade 
                total no envio e recebimento de mensagens WhatsApp.
              </p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>✅ Suporte a texto, imagens e documentos</span>
                <span>✅ Workflows configuráveis</span>
                <span>✅ Escalabilidade</span>
              </div>
            </div>
            <Button onClick={() => setShowN8nConfig(true)} className="rounded-xl">
              <Settings className="w-4 h-4 mr-2" />
              Configurar Integração
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Configuração de Webhooks */}
      <Card className="rounded-2xl shadow-lg border-0">
        <CardHeader className="p-6">
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Centro de Configuração de Webhooks
          </CardTitle>
          <CardDescription>
            Configure todos os webhooks do sistema em um local centralizado
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <WebhookConfigurationCenter />
        </CardContent>
      </Card>

      {/* Monitoramento de Webhooks Evolution API */}
      <WebhookMonitoring />

      {/* Testador de Webhook */}
      <WebhookTester />

      {/* Gerenciador de Estados do Chatbot */}
      <Card className="rounded-2xl shadow-lg border-0">
        <CardHeader className="p-6">
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Sistema de Chatbot Inteligente
          </CardTitle>
          <CardDescription>
            Arquitetura de 3 camadas: Router → Engine → Sender com estado persistente
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                <h4 className="font-medium text-primary">1. Chatbot Router</h4>
                <p className="text-muted-foreground text-xs mt-1">
                  Decide se a mensagem vai para o bot ou para humano
                </p>
              </div>
              <div className="p-4 bg-accent/5 rounded-xl border border-accent/10">
                <h4 className="font-medium text-accent">2. Chatbot Engine</h4>
                <p className="text-muted-foreground text-xs mt-1">
                  Processa a lógica conversacional e fluxos
                </p>
              </div>
              <div className="p-4 bg-secondary/5 rounded-xl border border-secondary/10">
                <h4 className="font-medium text-secondary-foreground">3. Chatbot Sender</h4>
                <p className="text-muted-foreground text-xs mt-1">
                  Envia mensagens formatadas via Evolution API
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>🧠 Estado persistente</span>
              <span>🔄 Fluxos condicionais</span>
              <span>👥 Transferência inteligente</span>
              <span>📊 Contexto preservado</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <ChatbotStateManager />

      {/* Gerenciamento de Instâncias no Admin já está em IntegracoesCentralizadas */}

      {/* Links Úteis */}
      <Card className="rounded-2xl shadow-lg border-0">
        <CardHeader className="p-6">
          <CardTitle>Links Úteis</CardTitle>
          <CardDescription>
            Recursos externos para configuração completa
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 border rounded-xl">
              <div>
                <h4 className="font-medium">n8n Cloud</h4>
                <p className="text-sm text-muted-foreground">Plataforma de automação</p>
              </div>
              <Button variant="outline" size="sm" asChild className="rounded-xl">
                <a href="https://n8n.io" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Acessar
                </a>
              </Button>
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-xl">
              <div>
                <h4 className="font-medium">Evolution API Dashboard</h4>
                <p className="text-sm text-muted-foreground">Painel de controle Evolution API</p>
              </div>
              <Button variant="outline" size="sm" asChild className="rounded-xl">
                <a href="https://doc.evolution-api.com" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Acessar
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Configuração N8n */}
      <N8nConfigDialog
        open={showN8nConfig}
        onOpenChange={setShowN8nConfig}
      />
    </div>
  );
}
