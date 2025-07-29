# Guia de Testes - Amplie Chat

Este documento descreve como executar e contribuir com os testes do projeto Amplie Chat.

## Estrutura de Testes

O projeto utiliza **Vitest** como framework de testes, configurado para trabalhar com React e TypeScript.

### Configuração

- **Framework**: Vitest
- **Ambiente**: jsdom (para testes de componentes React)
- **Bibliotecas de teste**: 
  - `@testing-library/react` - para testes de componentes
  - `@testing-library/jest-dom` - matchers adicionais
  - `@testing-library/user-event` - simulação de eventos do usuário

### Estrutura de Arquivos

```
src/
├── components/
│   ├── ui/
│   │   └── __tests__/
│   │       ├── button.test.tsx
│   │       └── ...
│   └── setores/
│       └── __tests__/
│           ├── SetorCard.test.tsx
│           └── ...
├── services/
│   └── __tests__/
│       ├── setoresService.test.ts
│       └── ...
├── test/
│   └── setup.ts
└── ...

supabase/
└── functions/
    └── _tests/
        ├── integration.test.ts
        ├── nlp.test.ts
        ├── queue.test.ts
        ├── validation.test.ts
        └── run-tests.ts
```

## Executando Testes

### Testes Frontend (React/TypeScript)

```bash
# Executar todos os testes
npm run test

# Executar testes em modo watch
npm run test:watch

# Executar testes com coverage
npm run test:coverage

# Executar testes específicos
npm run test -- --grep "SetorCard"
```

### Testes Backend (Edge Functions)

```bash
# Navegar para o diretório de testes
cd supabase/functions/_tests

# Executar todos os testes backend
deno run --allow-net --allow-env --allow-read run-tests.ts

# Executar teste específico
deno test --allow-net --allow-env --allow-read nlp.test.ts
```

## Tipos de Testes

### 1. Testes de Componentes

Testam componentes React isoladamente:

```typescript
// Exemplo: src/components/ui/__tests__/button.test.tsx
import { render, screen } from '@testing-library/react';
import { Button } from '../button';

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });
});
```

### 2. Testes de Serviços

Testam lógica de negócio e integração com APIs:

```typescript
// Exemplo: src/services/__tests__/setoresService.test.ts
import { SetoresService } from '../setoresService';

describe('SetoresService', () => {
  it('should create a setor successfully', async () => {
    const result = await SetoresService.createSetor(setorData);
    expect(result).toEqual(expectedResult);
  });
});
```

### 3. Testes de Edge Functions

Testam funções serverless do Supabase:

```typescript
// Exemplo: supabase/functions/_tests/nlp.test.ts
Deno.test("NLPProcessor - process message", async () => {
  const processor = new NLPProcessor(mockSupabase, mockLogger);
  const result = await processor.processMessage("Hello", "123", "empresa-id");
  assertExists(result);
});
```

### 4. Testes de Integração

Testam fluxos completos da aplicação:

```typescript
// Exemplo: supabase/functions/_tests/integration.test.ts
Deno.test("Complete chatbot flow", async () => {
  // Testa fluxo completo de webhook → processamento → resposta
});
```

## Mocks e Fixtures

### Mocking do Supabase

```typescript
// Mock padrão para testes
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: mockData, error: null }))
      }))
    }))
  }
}));
```

### Dados de Teste

```typescript
// Fixtures para testes
const mockSetorData = {
  nome: 'Test Setor',
  cor: '#FF0000',
  capacidade_maxima: 10,
  ativo: true
};
```

## Boas Práticas

### 1. Nomenclatura

- Arquivos de teste: `*.test.ts` ou `*.test.tsx`
- Describe blocks: Descrevem o componente/função sendo testada
- Test cases: Descrevem comportamentos específicos

### 2. Estrutura de Testes

```typescript
describe('ComponentName', () => {
  beforeEach(() => {
    // Setup comum
  });

  it('should do something specific', () => {
    // Arrange
    // Act
    // Assert
  });
});
```

### 3. Coverage

Mantenha coverage mínimo de:
- **Componentes críticos**: 90%
- **Serviços de negócio**: 85%
- **Utilitários**: 80%

### 4. Testes de Edge Functions

- Use mocks apropriados para Supabase
- Teste cenários de erro e sucesso
- Valide payloads e responses

## Debugging de Testes

### Logs e Debug

```typescript
// Em desenvolvimento, use o logger estruturado
import { logger } from '@/utils/logger';

it('should debug test', () => {
  logger.debug('Test execution point', { 
    component: 'TestSuite',
    metadata: { testData }
  });
});
```

### Snapshots

```typescript
// Para componentes visuais
expect(container.firstChild).toMatchSnapshot();
```

## Integração Contínua

Os testes são executados automaticamente:

1. **Pre-commit**: Testes unitários básicos
2. **Pull Request**: Suite completa de testes
3. **Deploy**: Testes de integração e e2e

## Contribuindo com Testes

### Adicionando Novos Testes

1. Crie arquivo de teste na estrutura apropriada
2. Use mocks consistentes com o projeto
3. Documente casos de teste complexos
4. Mantenha testes independentes e idempotentes

### Atualizando Testes Existentes

1. Mantenha compatibilidade com testes existentes
2. Atualize mocks quando necessário
3. Documente mudanças significativas

## Comandos Úteis

```bash
# Verificar coverage
npm run test:coverage

# Executar testes específicos
npm run test -- SetorCard

# Debug de testes
npm run test -- --reporter=verbose

# Limpar cache de testes
npm run test -- --clearCache
```

## Problemas Comuns

### 1. Mock do Supabase

```typescript
// Problema: Mock incompleto
// Solução: Mock completo da cadeia de métodos
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: mockData, error: null }))
        }))
      }))
    }))
  }
}));
```

### 2. Testes Assíncronos

```typescript
// Use async/await corretamente
it('should handle async operations', async () => {
  const result = await asyncFunction();
  expect(result).toBeDefined();
});
```

### 3. Cleanup de Testes

```typescript
afterEach(() => {
  vi.clearAllMocks();
  cleanup(); // @testing-library/react
});
```

## Recursos Adicionais

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Deno Testing](https://deno.land/manual/testing)
- [Supabase Testing Guide](https://supabase.com/docs/guides/functions/testing)