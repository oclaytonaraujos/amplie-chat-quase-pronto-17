# Guia de Configuração Completo - AmpliE Chat Central

## 🚀 Configuração Inicial

### Pré-requisitos
- Node.js 18+
- Conta no Supabase
- Evolution API configurada
- Domínio com SSL (para produção)

### 1. Variáveis de Ambiente

```bash
# Copie o template
cp .env.example .env
```

Configure as seguintes variáveis:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima

# Evolution API Configuration
VITE_EVOLUTION_API_URL=https://sua-evolution-api.com
VITE_EVOLUTION_API_KEY=sua-chave-evolution
VITE_EVOLUTION_INSTANCE_NAME=sua-instancia
VITE_EVOLUTION_WEBHOOK_URL=https://seu-dominio.com/webhook/evolution-api

# Real-time Configuration (Opcional)
VITE_REALTIME_ENABLED=true
VITE_WEBSOCKET_TIMEOUT=30000
VITE_PRESENCE_ENABLED=true
```

### 2. Primeiro Acesso

1. Execute o projeto: `npm run dev`
2. Acesse `/auth` para fazer login
3. Use o email: `ampliemarketing.mkt@gmail.com`
4. Após login, você terá acesso como Super Admin

## 🏗️ Configuração do Supabase

### 1. Migrações do Banco

Execute as migrações na ordem cronológica:

```sql
-- Aplicar todas as migrações da pasta supabase/migrations/
-- Importante: manter a ordem cronológica dos arquivos
```

### 2. Edge Functions

Deploy das seguintes Edge Functions:

#### A. Realtime Gateway
```bash
supabase functions deploy realtime-gateway
```
**Funcionalidade**: Gateway WebSocket para comunicação bidirecional

#### B. Webhook Evolution API
```bash
supabase functions deploy whatsapp-webhook-evolution
```
**Funcionalidade**: Recebimento otimizado de webhooks da Evolution API

#### C. Message Processor
```bash
supabase functions deploy whatsapp-message-processor
```
**Funcionalidade**: Processamento assíncrono de mensagens

#### D. Queue Processor
```bash
supabase functions deploy chatbot-queue-processor
```
**Funcionalidade**: Processamento de filas com Dead Letter Queue

#### E. Chatbot Engine
```bash
supabase functions deploy chatbot-engine
```
**Funcionalidade**: Engine de processamento de chatbots

### 3. Configuração de Segurança (RLS)

Verifique se as políticas RLS estão ativas:

```sql
-- Verificar RLS ativo em todas as tabelas
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = false;

-- Se alguma tabela não tiver RLS, ativar:
ALTER TABLE nome_da_tabela ENABLE ROW LEVEL SECURITY;
```

### 4. Configuração de Secrets

No painel do Supabase, configure:
- `EVOLUTION_API_URL`
- `EVOLUTION_API_KEY`
- Outras chaves de API de terceiros

## 📱 Configuração WhatsApp (Evolution API)

### 1. Configuração da Evolution API

1. **Obter Credenciais**:
   - URL da API
   - API Key
   - Nome da instância

2. **Configurar Webhook**:
   ```
   URL: https://seu-dominio.com/functions/v1/whatsapp-webhook-evolution
   Eventos: messages.upsert, connection.update
   ```

### 2. Configuração no Sistema

1. Acesse "Configurações" → "WhatsApp"
2. Adicione as credenciais da Evolution API
3. Teste a conexão
4. Sincronize as instâncias disponíveis

### 3. Conectar WhatsApp

1. Na tela de instâncias, clique em "Conectar"
2. Escaneie o QR Code com WhatsApp Business
3. Aguarde confirmação de conexão
4. Configure webhook se não estiver automático

### 4. Teste de Funcionamento

1. Envie uma mensagem de teste via WhatsApp
2. Verifique se aparece no sistema
3. Responda via sistema
4. Confirme recebimento no WhatsApp

## 🔧 Configuração de Setores

### 1. Estrutura Organizacional

1. Acesse "Setores"
2. Crie setores para sua empresa:
   - **Vendas** (capacidade: 5 atendentes)
   - **Suporte** (capacidade: 3 atendentes)
   - **Financeiro** (capacidade: 2 atendentes)

### 2. Configuração de Capacidade

- **Capacidade Máxima**: Número máximo de atendentes simultâneos
- **Fila de Espera**: Ativar para setores com alta demanda
- **Horário de Funcionamento**: Definir horários de atendimento
- **Transferência Automática**: Configurar regras de transferência

### 3. Associação de Usuários

1. Acesse "Usuários"
2. Para cada usuário, defina:
   - Setor principal
   - Setores secundários (opcional)
   - Capacidade individual de atendimento

## 🤖 Configuração de Chatbots

### 1. Criar Primeiro Fluxo

1. Acesse "ChatBot" → "Novo Fluxo"
2. Defina nome: "Atendimento Inicial"
3. Configure gatilho: "Nova conversa"

### 2. Estrutura Básica do Fluxo

```
[Início] → [Mensagem de Boas-vindas] → [Menu de Opções] → [Condições] → [Transferência/Resposta]
```

#### A. Nó de Início
- Gatilho: Nova conversa
- Condições: Horário comercial

#### B. Mensagem de Boas-vindas
```
Olá! 👋 Bem-vindo à nossa empresa.
Como posso ajudá-lo hoje?
```

#### C. Menu de Opções
```
Escolha uma opção:
1️⃣ Vendas
2️⃣ Suporte
3️⃣ Financeiro
4️⃣ Falar com atendente
```

#### D. Condições de Roteamento
- Se resposta = "1" → Transferir para setor Vendas
- Se resposta = "2" → Transferir para setor Suporte
- Se resposta = "3" → Transferir para setor Financeiro
- Se resposta = "4" → Transferir para qualquer agente disponível

### 3. Configurações Avançadas

#### A. Horário de Funcionamento
```json
{
  "horarios": {
    "segunda_sexta": "08:00-18:00",
    "sabado": "08:00-12:00",
    "domingo": "fechado"
  },
  "fuso_horario": "America/Sao_Paulo"
}
```

#### B. Mensagem Fora do Horário
```
Olá! 🌙 Nosso atendimento está fechado.
Horário de funcionamento:
📅 Segunda a Sexta: 8h às 18h
📅 Sábado: 8h às 12h
📅 Domingo: Fechado

Deixe sua mensagem que retornaremos assim que possível!
```

### 4. Teste do Chatbot

1. Use o "Modo Teste" no editor
2. Simule diferentes cenários
3. Verifique todos os caminhos possíveis
4. Teste transferências entre setores
5. Ative apenas após testes completos

## 👥 Gestão de Usuários e Permissões

### 1. Cargos Disponíveis

#### 🔴 Super Admin
- **Permissões**: Acesso total ao sistema
- **Funcionalidades**:
  - Gestão de empresas
  - Configurações globais
  - Logs de sistema
  - Análise de performance

#### 🟠 Admin
- **Permissões**: Gestão completa da empresa
- **Funcionalidades**:
  - Gestão de usuários
  - Configurações da empresa
  - Relatórios completos
  - Configuração de chatbots

#### 🟡 Supervisor
- **Permissões**: Gestão de setores e agentes
- **Funcionalidades**:
  - Monitoramento de atendimentos
  - Transferência de conversas
  - Relatórios do setor
  - Configurações básicas

#### 🟢 Agente
- **Permissões**: Atendimento ao cliente
- **Funcionalidades**:
  - Atendimento via chat
  - Transferência de conversas
  - Histórico de atendimentos
  - Chat interno da equipe

### 2. Criando Usuários

1. **Acesse "Usuários" → "Novo Usuário"**

2. **Preencha os dados**:
   ```
   Nome Completo: João Silva
   Email: joao@empresa.com
   Cargo: agente
   Setor Principal: Vendas
   Setores Secundários: Suporte (opcional)
   ```

3. **Configurações Avançadas**:
   - Capacidade de atendimento simultâneo: 3
   - Horário de trabalho: 08:00-17:00
   - Transferência automática após: 30 min
   - Notificações: Ativadas

### 3. Permissões Granulares

#### Por Funcionalidade:
- ✅ Visualizar conversas
- ✅ Responder mensagens
- ✅ Transferir conversas
- ❌ Excluir conversas
- ❌ Configurar chatbots
- ❌ Acessar relatórios

#### Por Setor:
- Agente só vê conversas do seu setor
- Supervisor vê todos os setores que gerencia
- Admin vê toda a empresa

## 📊 Monitoramento e Métricas

### 1. Dashboard de Performance

#### Métricas Principais:
- **Conversas Ativas**: Em tempo real
- **Tempo Médio de Resposta**: Por setor/agente
- **Taxa de Resolução**: Percentual de tickets resolvidos
- **Satisfação do Cliente**: Baseado em feedback

#### Gráficos Disponíveis:
- Volume de mensagens por hora/dia
- Performance por agente
- Distribuição por setor
- Análise de chatbot (taxa de transferência para humanos)

### 2. Queue Monitoring

#### Métricas de Fila:
```typescript
interface QueueMetrics {
  tamanhoFila: number;        // Mensagens aguardando processamento
  taxaProcessamento: number;  // Mensagens/minuto
  latenciaMedia: number;      // Tempo médio de processamento
  taxaErro: number;          // % de mensagens falhadas
  dlqCount: number;          // Mensagens na Dead Letter Queue
}
```

#### Alertas Automáticos:
- Fila > 100 mensagens
- Taxa de erro > 5%
- Latência > 30 segundos
- DLQ com mensagens

### 3. Logs de Sistema

#### Tipos de Log:
- **Autenticação**: Login/logout de usuários
- **Atendimento**: Início/fim de conversas
- **Webhook**: Eventos da Evolution API
- **Chatbot**: Execução de fluxos
- **Sistema**: Erros e warnings

#### Acesso aos Logs:
1. Painel Super Admin → "Logs"
2. Filtros disponíveis:
   - Data/hora
   - Tipo de evento
   - Usuário
   - Empresa
   - Nível de severidade

## 🔒 Backup e Segurança

### 1. Backup Automático

#### Configuração do Supabase:
- **Backup Diário**: Automático via Supabase
- **Retenção**: 30 dias
- **Localização**: Multi-região

#### Backup Manual:
```sql
-- Backup de dados críticos
pg_dump --host=db.supabase.co --username=postgres --dbname=postgres > backup.sql
```

### 2. Segurança da Aplicação

#### Medidas Implementadas:
- **RLS**: Habilitado em todas as tabelas
- **JWT**: Tokens com expiração automática
- **HTTPS**: Obrigatório em produção
- **Rate Limiting**: Proteção contra abuse
- **Validação**: Sanitização de dados de entrada

#### Configurações de Segurança:
```env
# Rate Limiting
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=60000

# JWT
JWT_EXPIRATION=24h
JWT_REFRESH_EXPIRATION=7d

# CORS
CORS_ORIGIN=https://seu-dominio.com
```

### 3. Auditoria e Compliance

#### Logs de Auditoria:
- Todas as ações de usuários são logadas
- Histórico de alterações em dados sensíveis
- Acessos por IP e horário
- Tentativas de acesso não autorizado

#### Compliance LGPD:
- Dados pessoais criptografados
- Direito ao esquecimento implementado
- Logs de acesso a dados pessoais
- Política de retenção de dados

## 🚨 Troubleshooting

### Problemas Comuns

#### 1. WhatsApp não conecta
**Diagnóstico**:
```bash
# Verificar status da Evolution API
curl -X GET "https://sua-evolution-api.com/instance/status" \
  -H "apikey: sua-chave"

# Verificar logs do webhook
SELECT * FROM webhook_logs 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

**Soluções**:
- Verificar credenciais Z-API
- Confirmar webhook configurado
- Testar conectividade de rede
- Verificar certificado SSL

#### 2. Usuários não conseguem acessar
**Diagnóstico**:
```sql
-- Verificar usuário
SELECT * FROM auth.users WHERE email = 'usuario@exemplo.com';

-- Verificar perfil
SELECT * FROM profiles WHERE email = 'usuario@exemplo.com';

-- Verificar empresa
SELECT * FROM empresas WHERE id = 'uuid-da-empresa';
```

**Soluções**:
- Verificar permissões RLS
- Confirmar cargo do usuário
- Verificar empresa associada
- Resetar senha se necessário

#### 3. Chatbot não responde
**Diagnóstico**:
```sql
-- Verificar fluxos ativos
SELECT * FROM chatbot_flows WHERE ativo = true;

-- Verificar sessões
SELECT * FROM chatbot_sessions 
WHERE status = 'ativo' 
AND created_at > NOW() - INTERVAL '1 hour';

-- Verificar logs do chatbot
SELECT * FROM chatbot_logs 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

**Soluções**:
- Verificar se fluxo está ativo
- Testar condições de ativação
- Verificar configurações de horário
- Analisar logs de erro

#### 4. Mensagens em tempo real não funcionam
**Diagnóstico**:
```javascript
// Verificar conectividade WebSocket no console
const ws = new WebSocket('wss://seu-dominio.com/realtime');
ws.onopen = () => console.log('WebSocket conectado');
ws.onerror = (error) => console.error('Erro WebSocket:', error);

// Verificar presence system
console.log('Usuários online:', presenceState.onlineUsers);
```

**Soluções**:
- Verificar se realtime-gateway está deployed
- Confirmar configurações de SSL/TLS
- Testar conectividade de rede
- Verificar logs do Edge Functions

### Logs Úteis

#### 1. Logs de Autenticação
```sql
SELECT 
  au.email,
  au.created_at as login_time,
  au.last_sign_in_at,
  p.nome,
  p.cargo,
  e.nome as empresa
FROM auth.users au
JOIN profiles p ON au.id = p.id
JOIN empresas e ON p.empresa_id = e.id
WHERE au.email = 'usuario@exemplo.com';
```

#### 2. Logs de Chatbot
```sql
SELECT 
  cl.*,
  cf.nome as fluxo_nome,
  c.id as conversa_id
FROM chatbot_logs cl
JOIN chatbot_flows cf ON cl.flow_id = cf.id
JOIN conversas c ON cl.conversa_id = c.id
WHERE cl.created_at > NOW() - INTERVAL '24 hours'
ORDER BY cl.created_at DESC
LIMIT 50;
```

#### 3. Status das Conexões
```sql
SELECT 
  wc.*,
  e.nome as empresa_nome
FROM whatsapp_connections wc
JOIN empresas e ON wc.empresa_id = e.id
WHERE wc.ativo = true
ORDER BY wc.updated_at DESC;
```

#### 4. Performance da Fila
```sql
SELECT 
  message_type,
  COUNT(*) as total,
  AVG(EXTRACT(EPOCH FROM (processed_at - created_at))) as avg_processing_time,
  COUNT(*) FILTER (WHERE status = 'failed') as failed_count
FROM message_queue
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY message_type
ORDER BY total DESC;
```

---

## 📞 Suporte Técnico

### Contatos:
- **Email**: suporte@ampliemarketing.com
- **WhatsApp**: +55 (11) 99999-9999
- **Discord**: [Comunidade Lovable](https://discord.gg/lovable)

### Horário de Suporte:
- **Segunda a Sexta**: 8h às 18h
- **Sábado**: 8h às 12h
- **Emergências**: 24/7 via WhatsApp

### Documentação Adicional:
- [Arquitetura de Tempo Real](REALTIME_ARCHITECTURE.md)
- [Integração Evolution API](EVOLUTION_API_INTEGRATION.md)
- [Segurança](SECURITY.md)
- [Guia de Testes](TESTING.md)
```