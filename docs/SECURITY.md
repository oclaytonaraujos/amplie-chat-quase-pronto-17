# Guia de Segurança - Amplie Chat

Este documento estabelece as práticas de segurança para o desenvolvimento e manutenção do projeto Amplie Chat.

## Configuração de Ambiente

### Variáveis de Ambiente

**✅ FAÇA:**
```typescript
// Use o utilitário centralizado
import { getSupabaseConfig } from '@/utils/envConfig';
const { url, anonKey } = getSupabaseConfig();
```

**❌ NÃO FAÇA:**
```typescript
// Acesso direto às variáveis
const url = import.meta.env.VITE_SUPABASE_URL;
```

### Dados Sensíveis

**Nunca commite:**
- Chaves de API privadas
- Tokens de acesso
- Senhas ou credenciais
- URLs de produção com credenciais
- Logs com informações pessoais

**Sempre use:**
- Secrets do Supabase para dados sensíveis
- Variáveis de ambiente para configuração
- Logger estruturado em vez de console.log

## Autenticação

### Limpeza de Estado

Use as funções utilitárias para evitar estados limbo:

```typescript
import { robustSignOut, robustSignIn, cleanupAuthState } from '@/utils/authCleanup';

// Para logout seguro
await robustSignOut();

// Para login com limpeza prévia
await robustSignIn(email, password);

// Para limpeza manual
cleanupAuthState();
```

### Políticas RLS (Row Level Security)

Todas as tabelas devem ter políticas RLS ativas:

```sql
-- Exemplo de política segura
CREATE POLICY "users_own_data" ON profiles
FOR ALL USING (auth.uid() = id);

-- Verificação de empresa
CREATE POLICY "company_data" ON empresa_table
FOR ALL USING (
  empresa_id = (
    SELECT empresa_id FROM profiles 
    WHERE id = auth.uid()
  )
);
```

## Logging e Monitoramento

### Logger Estruturado

**✅ FAÇA:**
```typescript
import { logger } from '@/utils/logger';

// Log estruturado com contexto
logger.error('Operation failed', {
  component: 'UserService',
  userId: user.id,
  action: 'updateProfile'
}, error);
```

**❌ NÃO FAÇA:**
```typescript
// Logs não estruturados
console.log('Error:', error);
console.error('Failed to update user', user.id, error);
```

### Informações Sensíveis

**Nunca logue:**
- Senhas ou tokens
- Dados pessoais completos
- Chaves de API
- Informações financeiras

**Sempre:**
- Use IDs em vez de dados completos
- Mascare informações sensíveis
- Configure níveis de log apropriados

## Validação de Dados

### Input Sanitization

```typescript
// Use Zod para validação
import { z } from 'zod';

const userSchema = z.object({
  email: z.string().email(),
  nome: z.string().min(2).max(100),
  telefone: z.string().regex(/^\d{10,15}$/)
});

// Valide sempre antes de processar
const validatedData = userSchema.parse(inputData);
```

### SQL Injection Prevention

- Use sempre queries parametrizadas do Supabase
- Nunca construa SQL com concatenação de strings
- Valide tipos de dados antes de queries

## Edge Functions

### Configuração Segura

```typescript
// Sempre valide headers e payloads
import { validateWebhookPayload } from '../_shared/validation.ts';

const payload = await req.json();
const validation = validateWebhookPayload(payload);

if (!validation.success) {
  return new Response('Invalid payload', { status: 400 });
}
```

### Secrets Management

```typescript
// Use Deno.env para secrets
const apiKey = Deno.env.get('OPENAI_API_KEY');
if (!apiKey) {
  throw new Error('Missing required API key');
}
```

## Comunicação Externa

### APIs Externas

**Sempre:**
- Use HTTPS para todas as comunicações
- Valide certificados SSL
- Implemente timeouts apropriados
- Use rate limiting

```typescript
// Exemplo seguro de chamada API
const response = await fetch(url, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${secureToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(validatedPayload),
  signal: AbortSignal.timeout(10000) // 10s timeout
});
```

### Webhooks

```typescript
// Sempre valide assinaturas de webhook
const signature = req.headers.get('x-signature');
const isValid = validateWebhookSignature(payload, signature, secret);

if (!isValid) {
  return new Response('Invalid signature', { status: 401 });
}
```

## Tratamento de Erros

### Logs de Erro Seguros

```typescript
try {
  await riskyOperation();
} catch (error) {
  // Log estruturado sem exposição de dados
  logger.error('Operation failed', {
    component: 'ServiceName',
    operation: 'operationName',
    userId: user.id // ID apenas, não dados completos
  }, error);
  
  // Resposta genérica para o usuário
  throw new Error('Operation failed. Please try again.');
}
```

### Não Exponha Detalhes Internos

**❌ NÃO FAÇA:**
```typescript
catch (error) {
  res.status(500).json({ error: error.message }); // Pode vazar info interna
}
```

**✅ FAÇA:**
```typescript
catch (error) {
  logger.error('Internal error', { component: 'API' }, error);
  res.status(500).json({ error: 'Internal server error' });
}
```

## Checklist de Segurança

### Antes de Commit

- [ ] Não há dados sensíveis no código
- [ ] Console.log substituído por logger estruturado
- [ ] Variáveis de ambiente configuradas corretamente
- [ ] Validação de input implementada
- [ ] Políticas RLS verificadas

### Antes de Deploy

- [ ] Secrets configurados no Supabase
- [ ] URLs de produção corretas
- [ ] Logs de debug desabilitados
- [ ] Rate limiting configurado
- [ ] Monitoramento ativo

### Revisão de Código

- [ ] Autenticação e autorização corretas
- [ ] Tratamento seguro de erros
- [ ] Validação adequada de dados
- [ ] Logs estruturados e seguros
- [ ] Sem vazamento de informações

## Incidentes de Segurança

### Em Caso de Vulnerabilidade

1. **Isolamento**: Desabilite funcionalidade afetada
2. **Comunicação**: Notifique equipe e usuários se necessário
3. **Correção**: Implemente fix com urgência
4. **Verificação**: Teste correção thoroughly
5. **Documentação**: Documente o incidente e lições aprendidas

### Contatos de Emergência

- **Equipe Técnica**: [email da equipe]
- **Admin Supabase**: [email do admin]
- **Responsável Segurança**: [email do responsável]

## Recursos e Ferramentas

### Análise de Segurança

```bash
# Auditoria de dependências
npm audit

# Verificação de secrets
git log --grep="password\|secret\|key" -i

# Scan de vulnerabilidades
npm audit fix
```

### Monitoramento

- Logs estruturados via Supabase Analytics
- Alertas de erro via logger
- Monitoramento de performance

### Documentação Adicional

- [Supabase Security Best Practices](https://supabase.com/docs/guides/security)
- [OWASP Security Guidelines](https://owasp.org/)
- [Deno Security Guide](https://deno.land/manual/basics/permissions)