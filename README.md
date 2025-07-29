# AmpliE Chat Central - Sistema de Atendimento WhatsApp Multiatendente

Sistema completo de atendimento ao cliente via WhatsApp com chatbots inteligentes, automação de fluxos, gestão de equipes e **comunicação em tempo real bidirecional**.

## 🚀 Funcionalidades Principais

### 🎯 Atendimento em Tempo Real
- **Chat WhatsApp Integrado** - Atendimento direto via Evolution API
- **Comunicação Bidirecional** - WebSockets para atualizações instantâneas
- **Sistema de Presença** - Status online/offline de atendentes em tempo real
- **Indicadores de Digitação** - Feedback visual quando alguém está digitando
- **Kanban de Atendimentos** - Gestão visual dos tickets com updates automáticos
- **Transferência de Conversas** - Entre setores e agentes com notificações instantâneas

### 🤖 Chatbots e Automação Inteligente
- **Flow Builder Visual** - Criação de fluxos sem código com editor avançado
- **Chatbots com IA** - Atendimento automatizado com processamento de linguagem natural
- **Fila de Mensagens Robusta** - Processamento assíncrono com Dead Letter Queue
- **Triggers de Automação** - Ações baseadas em condições complexas
- **Integração Evolution API** - Webhooks otimizados para baixa latência

### 👥 Gestão Empresarial
- **Multi-empresas** - Suporte a várias organizações isoladas
- **Gestão de Usuários** - Controle granular de permissões e cargos
- **Setores Customizáveis** - Organização por departamentos com distribuição automática
- **Chat Interno** - Comunicação em tempo real entre a equipe
- **Monitoramento de Performance** - Métricas e analytics em tempo real

### ⚙️ Administração Avançada
- **Painel Super Admin** - Controle total do sistema multi-tenant
- **Gateway WebSocket** - Comunicação bidirecional otimizada
- **Logs e Auditoria** - Rastreamento completo de ações e eventos
- **Queue Monitoring** - Monitoramento de filas de mensagens em tempo real
- **Configurações Avançadas** - Personalização completa da plataforma

## 🏗️ Arquitetura do Sistema

### Stack Tecnológico
- **Frontend**: React 18 + TypeScript + Vite
- **UI/UX**: shadcn/ui + Tailwind CSS (Design System customizado)
- **Backend**: Supabase Edge Functions (Serverless)
- **Banco de Dados**: PostgreSQL (Supabase) com RLS
- **Tempo Real**: Supabase Realtime + WebSocket Gateway customizado
- **Autenticação**: Supabase Auth com perfis multi-empresa
- **WhatsApp**: Evolution API com webhooks otimizados
- **Filas**: Sistema de filas PostgreSQL com Dead Letter Queue

### Comunicação em Tempo Real

#### 📡 WebSocket Gateway (`realtime-gateway`)
- Autenticação de usuários e empresas
- Canais bidirecionais por atendente e conversa
- Sistema de presença distribuído
- Suporte a eventos de digitação e notificações

#### 🔄 Webhooks Otimizados
- Recebimento instantâneo de eventos da Evolution API
- Enfileiramento imediato para processamento assíncrono
- Respostas rápidas (< 100ms) para evitar timeouts
- Separação entre recebimento e processamento de eventos

#### 📋 Sistema de Filas Robustas
- Processamento assíncrono de mensagens
- Dead Letter Queue para mensagens falhadas
- Retry automático com backoff exponencial
- Monitoramento de performance em tempo real

## 🚀 Setup e Instalação

### Pré-requisitos
- Node.js 18+
- npm ou yarn
- Conta no Supabase
- Instância Evolution API configurada

### 1. Configuração Inicial

```bash
# Clone o repositório
git clone <seu-repo-url>
cd amplie-chat-central

# Instale dependências
npm install

# Configure variáveis de ambiente
cp .env.example .env
```

### 2. Configuração do Ambiente

Edite `.env` com suas credenciais:

```env
# Supabase
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima

# Evolution API
VITE_EVOLUTION_API_URL=https://sua-evolution-api.com
VITE_EVOLUTION_API_KEY=sua-chave-evolution
VITE_EVOLUTION_INSTANCE_NAME=sua-instancia
VITE_EVOLUTION_WEBHOOK_URL=https://seu-dominio.com/webhook/evolution-api
```

### 3. Configuração do Supabase

1. **Crie um projeto no Supabase**
2. **Execute as migrações** (ordem cronológica):
   ```bash
   # Aplicar todas as migrações da pasta supabase/migrations/
   ```
3. **Configure Edge Functions**:
   - `realtime-gateway` - Gateway WebSocket
   - `whatsapp-webhook-evolution` - Webhooks Evolution API
   - `chatbot-queue-processor` - Processador de filas
   - `whatsapp-message-processor` - Processador de mensagens

### 4. Primeiro Acesso

```bash
# Execute o projeto
npm run dev
```

1. Acesse `http://localhost:8080/auth`
2. Faça login com: `ampliemarketing.mkt@gmail.com`
3. Configure sua primeira instância WhatsApp
4. Crie setores e usuários

## 📖 Guias de Configuração

### WhatsApp via Evolution API

1. **Configurar Instância**:
   - Acesse "Configurações" → "WhatsApp"
   - Adicione credenciais da Evolution API
   - Configure webhook para `https://seu-dominio.com/webhook/evolution-api`

2. **Conectar WhatsApp**:
   - Gere QR Code na interface
   - Escaneie com WhatsApp Business
   - Aguarde confirmação de conexão

### Sistema de Chatbots

1. **Criar Fluxo**:
   - Acesse "ChatBot" → "Novo Fluxo"
   - Use o editor visual para criar nós
   - Configure condições e ações
   - Teste antes de ativar

2. **Tipos de Nós Disponíveis**:
   - **Início**: Ponto de entrada do fluxo
   - **Mensagem**: Envio de texto, mídia, botões
   - **Condição**: Lógica de decisão
   - **Entrada**: Captura de dados do usuário
   - **Webhook**: Integração externa
   - **Transferência**: Direcionamento para atendente

### Gestão de Usuários e Permissões

#### Cargos Disponíveis:
- **🔴 super_admin**: Acesso total ao sistema
- **🟠 admin**: Gestão completa da empresa
- **🟡 supervisor**: Gestão de setores e agentes
- **🟢 agente**: Atendimento ao cliente

#### Criação de Usuários:
1. Acesse "Usuários" → "Novo Usuário"
2. Defina nome, email e cargo
3. Associe a setores específicos
4. Configure permissões granulares

## 🔧 Recursos Avançados

### Monitoramento e Analytics

#### Queue Monitoring
- Tamanho da fila em tempo real
- Latência de processamento
- Taxa de erro e reprocessamento
- Dead Letter Queue statistics

#### Performance Dashboard
- Métricas de atendimento por agente
- Tempo médio de resposta
- Volume de mensagens por período
- Taxa de resolução de tickets

### Sistema de Presença

#### Funcionalidades:
- Status online/offline automático
- Indicadores de digitação por conversa
- Contagem de usuários online
- Sincronização entre múltiplas abas

#### Implementação:
```typescript
// Hook de presença
const { isOnline, onlineUsers, startTyping } = usePresenceSystem(empresaId);

// Context global
<PresenceProvider>
  <App />
</PresenceProvider>
```

### Comunicação Bidirecional

#### Canais WebSocket:
- `atendente:{userId}` - Notificações pessoais
- `conversa:{conversaId}` - Eventos da conversa
- `empresa:{empresaId}` - Notificações globais
- `presence:{empresaId}` - Sistema de presença

## 🧪 Testes e Qualidade

### Executar Testes

```bash
# Testes unitários
npm run test

# Testes com cobertura
npm run test:coverage

# Modo watch
npm run test:watch

# Testes E2E (em desenvolvimento)
npm run test:e2e
```

### Estrutura de Testes
- **Componentes UI**: `src/components/**/__tests__/`
- **Hooks**: Testes integrados com mocks do Supabase
- **Serviços**: `src/services/__tests__/`
- **Edge Functions**: `supabase/functions/_tests/`

## 📦 Deploy e Produção

### Build Otimizado

```bash
# Build de produção
npm run build

# Análise do bundle
npm run build:analyze

# Preview do build
npm run preview
```

### Deploy via Lovable

1. Conecte ao GitHub via botão no topo direito
2. Configure domínio customizado em Project → Settings
3. Configure variáveis de ambiente de produção
4. Publique via botão "Publish"

### Deploy Manual

O projeto pode ser deployado em qualquer plataforma que suporte:
- Aplicações React/Vite
- Supabase Edge Functions
- PostgreSQL (via Supabase)

## 🔒 Segurança e Compliance

### Medidas de Segurança
- **Autenticação obrigatória** para todas as funcionalidades
- **RLS (Row Level Security)** em todas as tabelas
- **Isolamento multi-tenant** por empresa
- **Logs de auditoria** para ações críticas
- **Rate limiting** nas APIs e webhooks
- **Sanitização** de dados de entrada
- **HTTPS** obrigatório em produção

### Logs e Auditoria
- Autenticação e autorização
- Operações CRUD críticas
- Webhook events e processamento
- Erros e exceptions
- Performance metrics

## 📊 Estrutura do Banco de Dados

### Tabelas Principais

#### Gestão de Usuários
- `profiles` - Perfis de usuários
- `empresas` - Organizações multi-tenant
- `setores` - Departamentos organizacionais

#### Atendimento
- `conversas` - Tickets de atendimento
- `mensagens` - Histórico de mensagens
- `contatos` - Base de clientes
- `whatsapp_connections` - Instâncias WhatsApp

#### Automação
- `chatbot_flows` - Fluxos de chatbot
- `chatbot_sessions` - Sessões ativas
- `automation_triggers` - Triggers de automação
- `message_queue` - Fila de mensagens
- `failed_messages` - Dead Letter Queue

#### Sistema
- `system_logs` - Logs de auditoria
- `webhook_logs` - Logs de webhooks
- `performance_metrics` - Métricas de performance

## 🔗 Integrações

### Evolution API
- Webhook events em tempo real
- Envio de mensagens (texto, mídia, botões)
- Gestão de instâncias
- Status de conexão

### Supabase Realtime
- Atualizações de banco em tempo real
- Sistema de presença
- Broadcast de eventos customizados
- Canais por empresa e conversa

### N8N (Opcional)
- Workflows avançados
- Integrações com CRM
- Automações complexas
- APIs de terceiros

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/NovaFuncionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/NovaFuncionalidade`)
5. Abra um Pull Request

### Padrões de Código
- TypeScript obrigatório
- ESLint + Prettier configurados
- Testes unitários para novas funcionalidades
- Documentação atualizada

## 📚 Documentação Adicional

- [Guia de Setup Detalhado](docs/SETUP.md)
- [Integração Evolution API](docs/EVOLUTION_API_INTEGRATION.md)
- [Documentação de Segurança](docs/SECURITY.md)
- [Guia de Testes](docs/TESTING.md)

## 📞 Suporte e Comunidade

- **Email**: suporte@ampliemarketing.com
- **WhatsApp**: +55 (11) 99999-9999
- **Discord**: [Comunidade Lovable](https://discord.gg/lovable)
- **Documentação**: [Docs Oficiais](https://docs.lovable.dev)

## 📝 Licença

Este projeto está sob a licença MIT. Consulte o arquivo `LICENSE` para mais detalhes.

---

**AmpliE Chat Central** - Construído com ❤️ usando [Lovable](https://lovable.dev)