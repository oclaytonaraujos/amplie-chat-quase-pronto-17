/**
 * Operações críticas com retry automático e circuit breaker
 */
import { supabase } from '@/integrations/supabase/client';
import { withSupabaseRetry, withNetworkRetry, withCircuitBreaker } from './retry-handler';
import { logger } from './structured-logger';

// Wrapper para consultas críticas do Supabase
export async function criticalSupabaseQuery<T>(
  queryFn: () => Promise<T>,
  context: string
): Promise<T> {
  return withCircuitBreaker(async () => {
    return withSupabaseRetry(queryFn, context);
  }, `supabase-${context}`);
}

// Operações de autenticação com retry
export const criticalAuth = {
  async signIn(email: string, password: string) {
    return criticalSupabaseQuery(async () => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      return data;
    }, 'auth-signin');
  },

  async signOut() {
    return criticalSupabaseQuery(async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    }, 'auth-signout');
  },

  async getSession() {
    return criticalSupabaseQuery(async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return data;
    }, 'auth-session');
  }
};

// Operações críticas de conversas
export const criticalConversas = {
  async list(empresaId: string) {
    return criticalSupabaseQuery(async () => {
      const { data, error } = await supabase
        .from('conversas')
        .select(`
          *,
          contatos (*),
          profiles (*)
        `)
        .eq('empresa_id', empresaId)
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }, 'conversas-list');
  },

  async assumir(conversaId: string, agenteId: string) {
    return criticalSupabaseQuery(async () => {
      const { data, error } = await supabase.rpc('assumir_conversa_atomico', {
        p_conversa_id: conversaId,
        p_agente_id: agenteId
      });
      
      if (error) throw error;
      return data;
    }, 'conversas-assumir');
  },

  async finalizar(conversaId: string, agenteId: string) {
    return criticalSupabaseQuery(async () => {
      const { data, error } = await supabase.rpc('finalizar_atendimento', {
        p_conversa_id: conversaId,
        p_agente_id: agenteId
      });
      
      if (error) throw error;
      return data;
    }, 'conversas-finalizar');
  }
};

// Operações críticas de mensagens
export const criticalMensagens = {
  async list(conversaId: string, offset = 0, limit = 50) {
    return criticalSupabaseQuery(async () => {
      const { data, error } = await supabase
        .from('mensagens')
        .select('*')
        .eq('conversa_id', conversaId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (error) throw error;
      return data;
    }, 'mensagens-list');
  },

  async send(mensagem: any) {
    return criticalSupabaseQuery(async () => {
      const { data, error } = await supabase
        .from('mensagens')
        .insert([mensagem])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }, 'mensagens-send');
  }
};

// Operações críticas de perfil
export const criticalProfile = {
  async get(userId: string) {
    return criticalSupabaseQuery(async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      return data;
    }, 'profile-get');
  },

  async update(userId: string, updates: any) {
    return criticalSupabaseQuery(async () => {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }, 'profile-update');
  }
};

// Operações críticas de notificações
export const criticalNotifications = {
  async create(notification: any) {
    return criticalSupabaseQuery(async () => {
      const { data, error } = await supabase.rpc('create_notification', notification);
      if (error) throw error;
      return data;
    }, 'notifications-create');
  },

  async markAsRead(notificationId: string) {
    return criticalSupabaseQuery(async () => {
      const { data, error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);
      
      if (error) throw error;
      return data;
    }, 'notifications-read');
  }
};

// Wrapper para chamadas de API externa críticas
export async function criticalApiCall<T>(
  apiCall: () => Promise<T>,
  context: string
): Promise<T> {
  return withCircuitBreaker(async () => {
    return withNetworkRetry(apiCall, context);
  }, `api-${context}`);
}

// Monitor de operações críticas
export class CriticalOperationsMonitor {
  private static metrics = new Map<string, {
    success: number;
    failure: number;
    totalTime: number;
    lastError?: string;
  }>();

  static recordOperation(context: string, success: boolean, duration: number, error?: Error) {
    const current = this.metrics.get(context) || {
      success: 0,
      failure: 0,
      totalTime: 0
    };

    if (success) {
      current.success++;
    } else {
      current.failure++;
      current.lastError = error?.message;
    }

    current.totalTime += duration;
    this.metrics.set(context, current);

    // Log métricas periodicamente
    if ((current.success + current.failure) % 10 === 0) {
      logger.info('Critical operations metrics', {
        component: 'CriticalOperationsMonitor',
        metadata: {
          context,
          successRate: current.success / (current.success + current.failure),
          avgDuration: current.totalTime / (current.success + current.failure),
          totalOperations: current.success + current.failure
        }
      });
    }
  }

  static getMetrics() {
    return Object.fromEntries(this.metrics);
  }
}

// Decorator para instrumentar operações críticas
export function instrumentCriticalOperation(context: string) {
  return function <T extends (...args: any[]) => Promise<any>>(
    target: any,
    propertyName: string,
    descriptor: TypedPropertyDescriptor<T>
  ) {
    const method = descriptor.value!;

    descriptor.value = (async function (...args: any[]) {
      const startTime = performance.now();
      try {
        const result = await method.apply(this, args);
        const duration = performance.now() - startTime;
        CriticalOperationsMonitor.recordOperation(context, true, duration);
        return result;
      } catch (error) {
        const duration = performance.now() - startTime;
        CriticalOperationsMonitor.recordOperation(context, false, duration, error as Error);
        throw error;
      }
    }) as T;

    return descriptor;
  };
}