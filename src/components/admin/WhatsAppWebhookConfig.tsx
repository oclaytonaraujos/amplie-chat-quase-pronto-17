import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';

// Este componente é obsoleto na nova arquitetura com configuração global Evolution API
// Mantido apenas para compatibilidade, mas não funciona mais

interface WhatsAppWebhookConfigProps {
  connectionId: string;
  currentWebhookUrl?: string;
  onUpdate?: () => void;
}

export function WhatsAppWebhookConfig({ connectionId, currentWebhookUrl, onUpdate }: WhatsAppWebhookConfigProps) {
  return (
    <Alert>
      <InfoIcon className="h-4 w-4" />
      <AlertDescription>
        A configuração de webhook por conexão foi substituída pela configuração global da Evolution API.
        Configure no painel de administração.
      </AlertDescription>
    </Alert>
  );
}

export function WhatsAppConnectionWebhookCard({ connection }: { connection: any }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span>Configuração de Envio</span>
        </CardTitle>
        <CardDescription>
          As mensagens agora são enviadas através da configuração global da Evolution API.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertDescription>
            Configuração centralizada através do painel de administração.
            Não é mais necessário configurar webhook individual por conexão.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}