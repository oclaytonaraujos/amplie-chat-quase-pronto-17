/**
 * Tipos unificados para o módulo de atendimento
 * Consolidação de todas as interfaces de conversa, mensagem e usuário
 */

// Base types
export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

// Status types
export type ConversaStatus = 'ativo' | 'em-atendimento' | 'pendente' | 'finalizado';
export type MessageStatus = 'enviando' | 'enviado' | 'entregue' | 'lido' | 'erro';
export type UserStatus = 'online' | 'offline' | 'ausente';
export type MessageType = 'texto' | 'imagem' | 'audio' | 'video' | 'documento' | 'contato';

// User interface
export interface Usuario extends BaseEntity {
  nome: string;
  email: string;
  avatar_url?: string;
  status: UserStatus;
  cargo: string;
  setor?: string;
  empresa_id: string;
  limite_atendimentos: number;
  aceita_novos_atendimentos: boolean;
  preferencia_setor?: string;
}

// Contact interface
export interface Contato extends BaseEntity {
  nome: string;
  telefone?: string;
  email?: string;
  empresa?: string;
  tags?: string[];
  observacoes?: string;
  status: 'ativo' | 'inativo';
  empresa_id: string;
}

// Message attachment interface
export interface MessageAttachment {
  tipo: MessageType;
  url?: string;
  nome?: string;
  tamanho?: number;
  mime_type?: string;
}

// Unified message interface
export interface Mensagem extends BaseEntity {
  conversa_id: string;
  conteudo: string;
  remetente_id?: string;
  remetente_nome: string;
  remetente_tipo: 'cliente' | 'agente' | 'sistema';
  tipo_mensagem: MessageType;
  status: MessageStatus;
  lida: boolean;
  metadata?: {
    attachment?: MessageAttachment;
    location?: {
      latitude: number;
      longitude: number;
      address?: string;
    };
    contact?: {
      name: string;
      phone: string;
    };
    quoted_message_id?: string;
    forwarded?: boolean;
    [key: string]: any;
  };
}

// Transfer information
export interface TransferInfo {
  de_agente_id?: string;
  de_agente_nome?: string;
  para_agente_id?: string;
  para_agente_nome?: string;
  para_setor?: string;
  motivo: string;
  data_transferencia: string;
  aceito?: boolean;
  aceito_em?: string;
}

// Unified conversation interface
export interface Conversa extends BaseEntity {
  empresa_id: string;
  contato_id: string;
  agente_id?: string;
  status: ConversaStatus;
  canal: 'whatsapp' | 'chat_interno' | 'email' | 'telefone';
  prioridade: 'baixa' | 'normal' | 'media' | 'alta';
  setor?: string;
  tags?: string[];
  
  // Related data
  contato?: Contato;
  agente?: Usuario;
  
  // Conversation metadata
  primeira_mensagem_em?: string;
  ultima_mensagem_em?: string;
  finalizada_em?: string;
  tempo_primeira_resposta?: number; // em segundos
  tempo_resolucao?: number; // em segundos
  
  // Transfer information
  transferencia?: TransferInfo;
  
  // Summary and notes
  resumo_atendimento?: string;
  notas_internas?: string;
  
  // Metrics
  total_mensagens?: number;
  mensagens_nao_lidas?: number;
  
  // Last message preview
  ultima_mensagem?: {
    conteudo: string;
    remetente_tipo: 'cliente' | 'agente' | 'sistema';
    created_at: string;
  };
}

// Pagination interface
export interface PaginationParams {
  page: number;
  limit: number;
  offset?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  totalPages: number;
}

// Filter interfaces
export interface ConversaFilters {
  status?: ConversaStatus[];
  agente_id?: string[];
  setor?: string[];
  canal?: string[];
  prioridade?: string[];
  data_inicio?: string;
  data_fim?: string;
  tags?: string[];
  search?: string;
}

export interface MessageFilters {
  conversa_id?: string;
  remetente_tipo?: ('cliente' | 'agente' | 'sistema')[];
  tipo_mensagem?: MessageType[];
  data_inicio?: string;
  data_fim?: string;
  search?: string;
}

// API Response interfaces
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

// Real-time event interfaces
export interface RealtimeEvent {
  type: 'nova_mensagem' | 'status_atualizado' | 'agente_atribuido' | 'transferencia' | 'typing';
  conversa_id: string;
  data: any;
  timestamp: string;
  user_id?: string;
}

// Cache interfaces
export interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
  key: string;
}

export interface CacheStats {
  totalItems: number;
  memoryUsage: number;
  hitRate: number;
  missRate: number;
  lastCleanup: number;
}

// Performance monitoring
export interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  metadata?: any;
}

export interface SystemHealth {
  database: 'healthy' | 'degraded' | 'down';
  realtime: 'connected' | 'disconnected' | 'error';
  cache: 'optimal' | 'slow' | 'error';
  overall: 'healthy' | 'degraded' | 'critical';
}

// Error handling
export interface ErrorLog {
  id: string;
  timestamp: string;
  level: 'error' | 'warn' | 'info';
  message: string;
  stack?: string;
  user_id?: string;
  context?: any;
}

// Retry configuration
export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryCondition?: (error: any) => boolean;
}