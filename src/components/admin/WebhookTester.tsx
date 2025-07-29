import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Send, Check, X, Loader2, TestTube } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface WebhookTestResult {
  success: boolean;
  status: number;
  data?: any;
  error?: string;
  timestamp: Date;
}

export function WebhookTester() {
  const [instanceName, setInstanceName] = useState('');
  const [testEvent, setTestEvent] = useState('MESSAGES_UPSERT');
  const [testPayload, setTestPayload] = useState(JSON.stringify({
    event: "MESSAGES_UPSERT",
    instance: "test-instance",
    data: {
      key: {
        remoteJid: "5511999999999@s.whatsapp.net",
        fromMe: false,
        id: "test-message-id"
      },
      pushName: "Test User",
      message: {
        conversation: "Esta é uma mensagem de teste"
      },
      messageTimestamp: Date.now()
    }
  }, null, 2));
  const [testing, setTesting] = useState(false);
  const [lastResult, setLastResult] = useState<WebhookTestResult | null>(null);
  const { toast } = useToast();

  const testWebhook = async () => {
    if (!instanceName.trim()) {
      toast({
        title: "Erro",
        description: "Digite o nome da instância",
        variant: "destructive",
      });
      return;
    }

    let payload;
    try {
      payload = JSON.parse(testPayload);
      payload.instance = instanceName; // Garantir que usa a instância correta
    } catch (error) {
      toast({
        title: "Erro",
        description: "JSON inválido no payload de teste",
        variant: "destructive",
      });
      return;
    }

    setTesting(true);
    setLastResult(null);

    try {
      const webhookUrl = 'https://obtpghqvrygzcukdaiej.supabase.co/functions/v1/whatsapp-webhook-evolution';
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const responseData = await response.json();

      const result: WebhookTestResult = {
        success: response.ok,
        status: response.status,
        data: responseData,
        timestamp: new Date()
      };

      if (!response.ok) {
        result.error = responseData.error || `HTTP ${response.status}`;
      }

      setLastResult(result);

      if (result.success) {
        toast({
          title: "Webhook testado com sucesso",
          description: "O webhook respondeu corretamente",
        });
      } else {
        toast({
          title: "Erro no teste do webhook",
          description: result.error || "Webhook retornou erro",
          variant: "destructive",
        });
      }

    } catch (error) {
      const result: WebhookTestResult = {
        success: false,
        status: 0,
        error: (error as Error).message,
        timestamp: new Date()
      };

      setLastResult(result);

      toast({
        title: "Erro ao testar webhook",
        description: "Não foi possível conectar com o webhook",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleEventChange = (event: string) => {
    setTestEvent(event);
    
    // Atualizar payload baseado no evento selecionado
    const basePayload = JSON.parse(testPayload);
    basePayload.event = event;
    
    // Payload específicos para diferentes eventos
    switch (event) {
      case 'QRCODE_UPDATED':
        basePayload.data = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
        break;
      case 'CONNECTION_UPDATE':
        basePayload.data = { state: 'open' };
        break;
      case 'APPLICATION_STARTUP':
        basePayload.data = { status: 'ready' };
        break;
      default:
        // Manter dados padrão de mensagem
        break;
    }
    
    setTestPayload(JSON.stringify(basePayload, null, 2));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Testador de Webhook
        </CardTitle>
        <CardDescription>
          Teste o webhook Evolution API com eventos simulados
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="instanceName">Nome da Instância</Label>
            <Input
              id="instanceName"
              value={instanceName}
              onChange={(e) => setInstanceName(e.target.value)}
              placeholder="nome-da-instancia"
            />
          </div>
          <div>
            <Label htmlFor="testEvent">Tipo de Evento</Label>
            <select
              id="testEvent"
              value={testEvent}
              onChange={(e) => handleEventChange(e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              <option value="MESSAGES_UPSERT">MESSAGES_UPSERT</option>
              <option value="QRCODE_UPDATED">QRCODE_UPDATED</option>
              <option value="CONNECTION_UPDATE">CONNECTION_UPDATE</option>
              <option value="APPLICATION_STARTUP">APPLICATION_STARTUP</option>
              <option value="CONTACTS_UPSERT">CONTACTS_UPSERT</option>
              <option value="CHATS_UPSERT">CHATS_UPSERT</option>
            </select>
          </div>
        </div>

        <div>
          <Label htmlFor="testPayload">Payload de Teste (JSON)</Label>
          <Textarea
            id="testPayload"
            value={testPayload}
            onChange={(e) => setTestPayload(e.target.value)}
            rows={10}
            className="font-mono text-sm"
          />
        </div>

        <Button 
          onClick={testWebhook} 
          disabled={testing || !instanceName.trim()}
          className="w-full"
        >
          {testing ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Send className="h-4 w-4 mr-2" />
          )}
          {testing ? 'Testando...' : 'Testar Webhook'}
        </Button>

        {lastResult && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h4 className="font-medium">Resultado do Teste:</h4>
              <Badge variant={lastResult.success ? "default" : "destructive"}>
                {lastResult.success ? (
                  <Check className="w-3 h-3 mr-1" />
                ) : (
                  <X className="w-3 h-3 mr-1" />
                )}
                {lastResult.success ? 'Sucesso' : 'Erro'}
              </Badge>
            </div>

            <div className="text-sm space-y-2">
              <div>
                <span className="font-medium">Status HTTP:</span> {lastResult.status}
              </div>
              <div>
                <span className="font-medium">Timestamp:</span> {lastResult.timestamp.toLocaleString()}
              </div>
              
              {lastResult.error && (
                <Alert variant="destructive">
                  <X className="h-4 w-4" />
                  <AlertDescription>{lastResult.error}</AlertDescription>
                </Alert>
              )}
              
              {lastResult.data && (
                <div>
                  <span className="font-medium">Resposta:</span>
                  <pre className="mt-1 p-3 bg-muted rounded text-xs overflow-auto">
                    {JSON.stringify(lastResult.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        <Alert>
          <TestTube className="h-4 w-4" />
          <AlertDescription>
            Este teste envia um evento simulado para o webhook e verifica se ele responde corretamente.
            Útil para verificar se a integração está funcionando antes de conectar WhatsApp real.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}