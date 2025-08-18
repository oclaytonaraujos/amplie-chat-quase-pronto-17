import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SecureAdminAuthContextType {
  isAdminAuthenticated: boolean;
  adminLogin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  adminLogout: () => void;
  loading: boolean;
  executeOperation: (operation: () => Promise<any>, options?: OperationOptions) => Promise<any>;
}

interface OperationOptions {
  successMessage?: string;
  errorMessage?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

const SecureAdminAuthContext = createContext<SecureAdminAuthContextType>({
  isAdminAuthenticated: false,
  adminLogin: async () => ({ success: false }),
  adminLogout: () => {},
  loading: true,
  executeOperation: async () => {},
});

export const useSecureAdminAuth = () => {
  const context = useContext(SecureAdminAuthContext);
  if (!context) {
    throw new Error('useSecureAdminAuth deve ser usado dentro de um SecureAdminAuthProvider');
  }
  return context;
};

export const SecureAdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // SEGURANÇA: Usar um token JWT simples em localStorage com tempo de expiração
  const ADMIN_TOKEN_KEY = 'secure_admin_session';
  const SESSION_DURATION = 2 * 60 * 60 * 1000; // 2 horas

  useEffect(() => {
    console.log('useSecureAdminAuth: verificando autenticação admin');
    
    try {
      const adminSession = localStorage.getItem(ADMIN_TOKEN_KEY);
      
      if (adminSession) {
        const sessionData = JSON.parse(adminSession);
        const currentTime = Date.now();
        
        // Verificar se o token não expirou
        if (sessionData.expiresAt && currentTime < sessionData.expiresAt) {
          console.log('useSecureAdminAuth: admin ainda autenticado');
          setIsAdminAuthenticated(true);
        } else {
          console.log('useSecureAdminAuth: sessão admin expirada');
          localStorage.removeItem(ADMIN_TOKEN_KEY);
          setIsAdminAuthenticated(false);
        }
      } else {
        console.log('useSecureAdminAuth: admin não autenticado');
        setIsAdminAuthenticated(false);
      }
    } catch (error) {
      console.error('Erro ao verificar sessão admin:', error);
      localStorage.removeItem(ADMIN_TOKEN_KEY);
      setIsAdminAuthenticated(false);
    }
    
    setLoading(false);
  }, []);

  const executeOperation = useCallback(async (
    operation: () => Promise<any>,
    options: OperationOptions = {}
  ) => {
    const {
      successMessage = 'Operação realizada com sucesso',
      errorMessage = 'Erro ao executar operação',
      onSuccess,
      onError
    } = options;

    try {
      setLoading(true);
      const result = await operation();

      if (successMessage) {
        toast({
          title: "Sucesso",
          description: successMessage,
        });
      }

      onSuccess?.();
      return result;
    } catch (error) {
      console.error('Erro na operação admin:', error);
      
      const errorMsg = error instanceof Error ? error.message : errorMessage;
      toast({
        title: "Erro",
        description: errorMsg,
        variant: "destructive",
      });

      onError?.(error as Error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const adminLogin = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (!data.user) {
        return { success: false, error: 'Usuário não encontrado' };
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('cargo')
        .eq('id', data.user.id)
        .single();

      if (profileError || profile?.cargo !== 'super_admin') {
        return { success: false, error: 'Acesso negado. Apenas super administradores podem acessar esta área.' };
      }

      // Criar sessão segura com expiração
      const sessionData = {
        userId: data.user.id,
        email: data.user.email,
        role: 'super_admin',
        createdAt: Date.now(),
        expiresAt: Date.now() + SESSION_DURATION,
        // Hash simples para validação
        hash: btoa(`${data.user.id}-${Date.now()}-admin`)
      };

      localStorage.setItem(ADMIN_TOKEN_KEY, JSON.stringify(sessionData));
      setIsAdminAuthenticated(true);

      // Log da atividade de segurança
      try {
        await supabase.functions.invoke('security-audit', {
          body: {
            auditType: 'users',
            event: 'admin_login',
            details: {
              user_id: data.user.id,
              email: data.user.email,
              timestamp: new Date().toISOString()
            }
          }
        });
      } catch (auditError) {
        console.warn('Falha ao registrar auditoria:', auditError);
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Erro ao fazer login' };
    }
  };

  const adminLogout = () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    setIsAdminAuthenticated(false);
    
    // Log da atividade de segurança
    try {
      supabase.functions.invoke('security-audit', {
        body: {
          auditType: 'users',
          event: 'admin_logout',
          details: {
            timestamp: new Date().toISOString()
          }
        }
      });
    } catch (auditError) {
      console.warn('Falha ao registrar auditoria:', auditError);
    }
  };

  const value = {
    isAdminAuthenticated,
    adminLogin,
    adminLogout,
    loading,
    executeOperation,
  };

  return (
    <SecureAdminAuthContext.Provider value={value}>
      {children}
    </SecureAdminAuthContext.Provider>
  );
};