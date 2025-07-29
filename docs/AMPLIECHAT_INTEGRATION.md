# AmplieChat - Guia de Integração e Funcionamento

## Visão Geral

O AmplieChat é uma plataforma completa de atendimento omnichannel que permite gerenciar conversas através de múltiplos canais de comunicação, com foco principal no WhatsApp através da integração com Evolution API.

## Arquitetura do Sistema

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   WhatsApp      │    │   Evolution     │    │   AmplieChat    │
│   Business      │◄──►│     API         │◄──►│   Platform      │
│   Account       │    │   (Webhook)     │    │   (Frontend)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │                        │
                              ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   Supabase      │    │   Edge          │
                       │   Database      │    │   Functions     │
                       └─────────────────┘    └─────────────────┘
```

## 1. Configurações Necessárias

### 1.1 Configuração da Evolution API

**Requisitos:**
- Servidor Evolution API rodando
- API Key válida
- Instância configurada

**Passos para configuração:**

1. **Acesse a aba WhatsApp no painel administrativo**
2. **Configure a Evolution API:**
   ```
   Nome da Instância: sua-instancia
   URL do Servidor: https://seu-servidor.com
   API Key: sua-api-key-aqui
   ```

3. **Configure o Webhook:**
   ```
   URL do Webhook: https://seu-projeto.supabase.co/functions/v1/whatsapp-webhook-evolution
   Eventos: MESSAGES_UPSERT, CONNECTION_UPDATE, QRCODE_UPDATED
   ```

### 1.2 Configuração do WhatsApp

1. **Gere o QR Code:**
   - Clique em "Conectar WhatsApp"
   - Escaneie o QR Code com o WhatsApp Business

2. **Verifique a conexão:**
   - Status deve mostrar "Conectado"
   - Último ping deve ser recente

### 1.3 Configuração do Supabase

**Variáveis de ambiente necessárias:**
```
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key (apenas para Edge Functions)
```

## 2. Fluxo de Mensagens

### 2.1 Recebimento de Mensagens (WhatsApp → AmplieChat)

```
1. Usuário envia mensagem no WhatsApp
2. Evolution API recebe a mensagem
3. Webhook é disparado para: /functions/v1/whatsapp-webhook-evolution
4. Edge Function processa a mensagem
5. Verifica se existe conversa ativa
6. Salva mensagem na tabela 'mensagens'
7. Atualiza conversa na tabela 'conversas'
8. Notifica frontend via Realtime
```

**Código do Webhook:**
```typescript
// supabase/functions/whatsapp-webhook-evolution/index.ts
export default async (req: Request) => {
  const payload = await req.json();
  
  if (payload.event === 'messages.upsert') {
    // Processar nova mensagem
    await processIncomingMessage(payload.data);
  }
};
```

### 2.2 Envio de Mensagens (AmplieChat → WhatsApp)

```
1. Agente digita mensagem no chat
2. Frontend chama Edge Function: /functions/v1/chatbot-sender-evolution
3. Edge Function valida dados
4. Faz chamada para Evolution API
5. Salva mensagem na tabela 'mensagens'
6. Retorna confirmação para frontend
```

**Código de Envio:**
```typescript
// Envio via Evolution API
const response = await fetch(`${serverUrl}/message/sendText/${instanceName}`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': apiKey
  },
  body: JSON.stringify({
    number: phoneNumber,
    text: message
  })
});
```

## 3. Componentes Principais

### 3.1 Hook useWhatsAppIntegration

**Localização:** `src/hooks/useWhatsAppIntegration.ts`

**Funcionalidades:**
- Carrega configurações da Evolution API
- Gerencia conexões WhatsApp
- Sincroniza status das conexões

**Uso:**
```typescript
const { connections, config, loading, sincronizarConexoes } = useWhatsAppIntegration();
```

### 3.2 Componente WhatsAppConnectionsReal

**Localização:** `src/components/whatsapp/WhatsAppConnectionsReal.tsx`

**Funcionalidades:**
- Interface para gerenciar conexões
- Exibir QR Code
- Verificar status da conexão
- Configurar webhooks

### 3.3 Hook useEvolutionApi

**Localização:** `src/hooks/useEvolutionApi.ts`

**Funcionalidades:**
- Comunicação direta com Evolution API
- Gerenciamento de instâncias
- Obtenção de QR Codes
- Verificação de status

## 4. Estrutura do Banco de Dados

### 4.1 Tabelas Principais

**evolution_api_config:**
```sql
- id: uuid
- empresa_id: uuid
- instance_name: text
- server_url: text
- api_key: text
- webhook_url: text
- ativo: boolean
```

**whatsapp_connections:**
```sql
- id: uuid
- nome: text
- numero: text
- status: text
- ativo: boolean
- qr_code: text
- ultimo_ping: timestamp
```

**conversas:**
```sql
- id: uuid
- empresa_id: uuid
- contato_id: uuid
- agente_id: uuid
- status: text
- canal: text (default: 'whatsapp')
```

**mensagens:**
```sql
- id: uuid
- conversa_id: uuid
- remetente_id: uuid
- remetente_tipo: text
- conteudo: text
- tipo_mensagem: text
- lida: boolean
```

## 5. Edge Functions

### 5.1 whatsapp-webhook-evolution

**Função:** Receber webhooks da Evolution API
**Eventos processados:**
- `MESSAGES_UPSERT`: Novas mensagens
- `CONNECTION_UPDATE`: Mudanças de status
- `QRCODE_UPDATED`: Novo QR Code

### 5.2 chatbot-sender-evolution

**Função:** Enviar mensagens via Evolution API
**Validações:**
- Configuração ativa
- Permissões do usuário
- Formato da mensagem

## 6. Configuração de Webhooks

### 6.1 URL do Webhook

```
https://seu-projeto.supabase.co/functions/v1/whatsapp-webhook-evolution
```

### 6.2 Eventos Suportados

```json
{
  "webhook": {
    "url": "https://seu-projeto.supabase.co/functions/v1/whatsapp-webhook-evolution",
    "events": [
      "MESSAGES_UPSERT",
      "CONNECTION_UPDATE", 
      "QRCODE_UPDATED"
    ]
  }
}
```

## 7. Segurança e Permissões

### 7.1 RLS (Row Level Security)

**Todas as tabelas possuem RLS ativo:**
- Usuários só acessam dados da própria empresa
- Super admins têm acesso completo
- Validação por `empresa_id`

### 7.2 Autenticação

**Edge Functions:**
- Verificam JWT token
- Validam permissões do usuário
- Verificam empresa_id

## 8. Monitoramento e Logs

### 8.1 Logs do Sistema

**Localização:** Supabase Dashboard → Edge Functions → Logs

**Tipos de logs:**
- Webhooks recebidos
- Mensagens processadas
- Erros de conexão
- Status das instâncias

### 8.2 Troubleshooting

**Problemas comuns:**

1. **Webhook não funciona:**
   - Verificar URL configurada
   - Checar logs da Edge Function
   - Validar eventos habilitados

2. **Mensagens não chegam:**
   - Verificar status da conexão
   - Checar configuração da Evolution API
   - Validar RLS policies

3. **QR Code não aparece:**
   - Verificar instância ativa
   - Checar API key
   - Validar URL do servidor

## 9. Integração Passo a Passo

### 9.1 Setup Inicial

1. **Configure Evolution API:**
   ```bash
   # Instalar Evolution API
   git clone https://github.com/EvolutionAPI/evolution-api
   cd evolution-api
   npm install
   npm run start:prod
   ```

2. **Configure AmplieChat:**
   - Acesse painel administrativo
   - Vá para aba WhatsApp
   - Preencha dados da Evolution API

3. **Teste a conexão:**
   - Clique em "Conectar WhatsApp"
   - Escaneie QR Code
   - Verifique status "Conectado"

### 9.2 Primeiros Testes

1. **Teste recebimento:**
   - Envie mensagem para número conectado
   - Verifique se aparece no painel

2. **Teste envio:**
   - Responda mensagem no painel
   - Confirme recebimento no WhatsApp

## 10. Suporte e Manutenção

### 10.1 Monitoramento Contínuo

- **Status das conexões:** Verificar diariamente
- **Logs de erro:** Analisar semanalmente  
- **Performance:** Monitorar mensalmente

### 10.2 Backup e Recuperação

- **Dados:** Backup automático Supabase
- **Configurações:** Exportar configurações mensalmente
- **Logs:** Retention de 30 dias

---

## Conclusão

O AmplieChat oferece uma solução robusta para atendimento via WhatsApp, com arquitetura escalável e monitoramento completo. Seguindo este guia, você terá uma integração funcional e confiável.

Para suporte técnico, consulte os logs do sistema ou entre em contato com a equipe de desenvolvimento.