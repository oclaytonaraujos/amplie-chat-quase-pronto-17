/**
 * Sistema padronizado de tratamento de erros
 */
import { logger } from './structured-logger';
import { toast } from '@/hooks/use-toast';

export type ErrorType = 
  | 'network'
  | 'authentication'
  | 'authorization'
  | 'validation'
  | 'database'
  | 'system'
  | 'unknown';

export interface AppError extends Error {
  type: ErrorType;
  code?: string;
  statusCode?: number;
  userMessage?: string;
  context?: Record<string, any>;
  retryable?: boolean;
}

export class StandardError extends Error implements AppError {
  public type: ErrorType;
  public code?: string;
  public statusCode?: number;
  public userMessage?: string;
  public context?: Record<string, any>;
  public retryable?: boolean;

  constructor(
    type: ErrorType,
    message: string,
    options: {
      code?: string;
      statusCode?: number;
      userMessage?: string;
      context?: Record<string, any>;
      retryable?: boolean;
      cause?: Error;
    } = {}
  ) {
    super(message);
    this.name = 'StandardError';
    this.type = type;
    this.code = options.code;
    this.statusCode = options.statusCode;
    this.userMessage = options.userMessage;
    this.context = options.context;
    this.retryable = options.retryable ?? false;
    
    if (options.cause) {
      (this as any).cause = options.cause;
    }
  }
}

// Mapear erros comuns para tipos padronizados
export function classifyError(error: any): AppError {
  if (error instanceof StandardError) {
    return error;
  }

  const message = error?.message || 'Erro desconhecido';
  const statusCode = error?.status || error?.statusCode;

  // Erros de autenticação
  if (
    message.includes('auth') ||
    message.includes('unauthorized') ||
    statusCode === 401
  ) {
    return new StandardError('authentication', message, {
      statusCode,
      userMessage: 'Erro de autenticação. Faça login novamente.',
      retryable: false
    });
  }

  // Erros de autorização
  if (
    message.includes('permission') ||
    message.includes('forbidden') ||
    statusCode === 403
  ) {
    return new StandardError('authorization', message, {
      statusCode,
      userMessage: 'Você não tem permissão para esta ação.',
      retryable: false
    });
  }

  // Erros de rede
  if (
    message.includes('network') ||
    message.includes('fetch') ||
    message.includes('timeout') ||
    statusCode >= 500
  ) {
    return new StandardError('network', message, {
      statusCode,
      userMessage: 'Erro de conexão. Verifique sua internet.',
      retryable: true
    });
  }

  // Erros de validação
  if (
    message.includes('validation') ||
    message.includes('invalid') ||
    statusCode === 400
  ) {
    return new StandardError('validation', message, {
      statusCode,
      userMessage: 'Dados inválidos. Verifique as informações.',
      retryable: false
    });
  }

  // Erros de banco de dados
  if (
    message.includes('database') ||
    message.includes('sql') ||
    message.includes('constraint')
  ) {
    return new StandardError('database', message, {
      statusCode,
      userMessage: 'Erro interno. Tente novamente em alguns minutos.',
      retryable: true
    });
  }

  // Erro desconhecido
  return new StandardError('unknown', message, {
    statusCode,
    userMessage: 'Erro inesperado. Tente novamente.',
    retryable: true
  });
}

// Handler principal de erros
export function handleError(
  error: any,
  context: {
    component?: string;
    action?: string;
    userId?: string;
    additionalContext?: Record<string, any>;
  } = {}
) {
  const classifiedError = classifyError(error);

  // Log do erro
  logger.error(classifiedError.message, {
    component: context.component,
    action: context.action,
    userId: context.userId,
    metadata: {
      errorType: classifiedError.type,
      errorCode: classifiedError.code,
      statusCode: classifiedError.statusCode,
      retryable: classifiedError.retryable,
      ...context.additionalContext,
      ...classifiedError.context
    }
  }, classifiedError);

  // Mostrar toast para o usuário
  if (classifiedError.userMessage) {
    toast({
      title: getErrorTitle(classifiedError.type),
      description: classifiedError.userMessage,
      variant: "destructive",
    });
  }

  return classifiedError;
}

// Títulos amigáveis para cada tipo de erro
function getErrorTitle(type: ErrorType): string {
  switch (type) {
    case 'network':
      return 'Erro de Conexão';
    case 'authentication':
      return 'Erro de Autenticação';
    case 'authorization':
      return 'Acesso Negado';
    case 'validation':
      return 'Dados Inválidos';
    case 'database':
      return 'Erro no Sistema';
    case 'system':
      return 'Erro do Sistema';
    default:
      return 'Erro Inesperado';
  }
}

// Hook para usar o tratamento de erros
export function useErrorHandler(defaultContext?: {
  component?: string;
  userId?: string;
}) {
  return {
    handleError: (error: any, additionalContext?: {
      action?: string;
      additionalContext?: Record<string, any>;
    }) => {
      return handleError(error, {
        ...defaultContext,
        ...additionalContext
      });
    },
    
    createError: (
      type: ErrorType,
      message: string,
      options?: {
        code?: string;
        userMessage?: string;
        context?: Record<string, any>;
        retryable?: boolean;
      }
    ) => {
      return new StandardError(type, message, options);
    }
  };
}

// Wrapper para operações assíncronas com tratamento automático de erro
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context: {
    component?: string;
    action?: string;
    userId?: string;
    successMessage?: string;
  }
): Promise<T> {
  try {
    const result = await operation();
    
    // Log de sucesso se especificado
    if (context.successMessage) {
      logger.info(context.successMessage, {
        component: context.component,
        action: context.action,
        userId: context.userId
      });
    }
    
    return result;
  } catch (error) {
    const handledError = handleError(error, context);
    throw handledError;
  }
}