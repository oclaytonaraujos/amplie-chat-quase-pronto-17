/**
 * Utilitários para compressão de dados e otimização de payloads
 */

// Função para comprimir objetos JSON removendo campos desnecessários
export function compressPayload<T extends Record<string, any>>(
  data: T,
  options: {
    removeEmpty?: boolean;
    removeNulls?: boolean;
    compressStrings?: boolean;
    maxStringLength?: number;
  } = {}
): Partial<T> {
  const {
    removeEmpty = true,
    removeNulls = true,
    compressStrings = true,
    maxStringLength = 1000
  } = options;

  const compressed: any = {};

  for (const [key, value] of Object.entries(data)) {
    // Pular valores vazios se configurado
    if (removeEmpty && (value === '' || value === undefined)) {
      continue;
    }
    
    // Pular valores nulos se configurado
    if (removeNulls && value === null) {
      continue;
    }

    // Comprimir strings longas
    if (compressStrings && typeof value === 'string' && value.length > maxStringLength) {
      compressed[key] = value.substring(0, maxStringLength) + '...';
      continue;
    }

    // Recursivamente comprimir objetos aninhados
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const compressedNested = compressPayload(value, options);
      if (Object.keys(compressedNested).length > 0) {
        compressed[key] = compressedNested;
      }
      continue;
    }

    // Comprimir arrays removendo elementos vazios
    if (Array.isArray(value)) {
      const compressedArray = value
        .filter(item => {
          if (removeEmpty && (item === '' || item === undefined)) return false;
          if (removeNulls && item === null) return false;
          return true;
        })
        .map(item => {
          if (item && typeof item === 'object') {
            return compressPayload(item, options);
          }
          return item;
        });
      
      if (compressedArray.length > 0) {
        compressed[key] = compressedArray;
      }
      continue;
    }

    compressed[key] = value;
  }

  return compressed;
}

// Função para otimizar mensagens antes do envio
export function optimizeMessagePayload(message: any) {
  return compressPayload(message, {
    removeEmpty: true,
    removeNulls: true,
    compressStrings: true,
    maxStringLength: 2000 // Mensagens podem ser um pouco maiores
  });
}

// Função para otimizar dados de conversa
export function optimizeConversaPayload(conversa: any) {
  const optimized = compressPayload(conversa, {
    removeEmpty: true,
    removeNulls: true,
    compressStrings: true,
    maxStringLength: 500
  });

  // Remover campos desnecessários para transferência
  const {
    mensagens, // Mensagens são carregadas separadamente
    agente, // Dados do agente são carregados separadamente
    contato, // Dados do contato são carregados separadamente
    ...rest
  } = optimized;

  return rest;
}

// Função para determinar se deve usar compressão baseado no tamanho
export function shouldCompress(data: any, threshold: number = 1024): boolean {
  const size = new Blob([JSON.stringify(data)]).size;
  return size > threshold;
}

// Função para calcular tamanho de dados em bytes
export function getDataSize(data: any): number {
  return new Blob([JSON.stringify(data)]).size;
}

// Função para comprimir dados usando algoritmo simples de diferença
export function createDeltaPayload<T extends Record<string, any>>(
  original: T,
  updated: T
): Partial<T> {
  const delta: any = {};

  for (const [key, value] of Object.entries(updated)) {
    if (original[key] !== value) {
      delta[key] = value;
    }
  }

  return delta;
}

// Função para aplicar delta payload
export function applyDeltaPayload<T extends Record<string, any>>(
  original: T,
  delta: Partial<T>
): T {
  return { ...original, ...delta };
}

// Função para otimizar listas grandes
export function optimizeListPayload<T>(
  items: T[],
  options: {
    limit?: number;
    sortBy?: keyof T;
    filterEmpty?: boolean;
  } = {}
): T[] {
  let optimized = [...items];

  // Filtrar itens vazios se configurado
  if (options.filterEmpty) {
    optimized = optimized.filter(item => {
      if (!item || typeof item !== 'object') return true;
      return Object.values(item).some(value => 
        value !== null && value !== undefined && value !== ''
      );
    });
  }

  // Ordenar se especificado
  if (options.sortBy) {
    optimized.sort((a, b) => {
      const aVal = a[options.sortBy!];
      const bVal = b[options.sortBy!];
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return aVal.localeCompare(bVal);
      }
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return aVal - bVal;
      }
      
      return 0;
    });
  }

  // Limitar quantidade se especificado
  if (options.limit && options.limit > 0) {
    optimized = optimized.slice(0, options.limit);
  }

  return optimized;
}

// Função para detectar mudanças relevantes
export function hasRelevantChanges<T extends Record<string, any>>(
  original: T,
  updated: T,
  ignoredFields: (keyof T)[] = []
): boolean {
  const relevantOriginal = { ...original };
  const relevantUpdated = { ...updated };

  // Remover campos ignorados
  ignoredFields.forEach(field => {
    delete relevantOriginal[field];
    delete relevantUpdated[field];
  });

  return JSON.stringify(relevantOriginal) !== JSON.stringify(relevantUpdated);
}

// Função para quebrar payloads grandes em chunks menores
export function chunkPayload<T>(
  items: T[],
  chunkSize: number = 50
): T[][] {
  const chunks: T[][] = [];
  
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }
  
  return chunks;
}

// Função para estimar custo de bandwidth
export function estimateBandwidthCost(data: any): {
  uncompressed: number;
  compressed: number;
  savings: number;
  savingsPercent: number;
} {
  const uncompressed = getDataSize(data);
  const compressed = getDataSize(compressPayload(data));
  const savings = uncompressed - compressed;
  const savingsPercent = uncompressed > 0 ? (savings / uncompressed) * 100 : 0;

  return {
    uncompressed,
    compressed,
    savings,
    savingsPercent
  };
}