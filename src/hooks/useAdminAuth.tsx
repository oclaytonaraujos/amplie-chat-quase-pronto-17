import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface AdminAuthContextType {
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

const AdminAuthContext = createContext<AdminAuthContextType>({
  isAdminAuthenticated: false,
  adminLogin: async () => ({ success: false }),
  adminLogout: () => {},
  loading: true,
  executeOperation: async () => {},
});

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth deve ser usado dentro de um AdminAuthProvider');
  }
  return context;
};

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user, profile, loading: authLoading } = useAuth();

  useEffect(() => {
    console.log('useAdminAuth: verificando autenticação admin');
    
    // Se ainda está carregando a autenticação principal, aguardar
    if (authLoading) {
      return;
    }

    // PRIMEIRA VERIFICAÇÃO: Se usuário está logado como super_admin no sistema principal
    if (user && profile && profile.cargo === 'super_admin') {
      console.log('useAdminAuth: usuário logado como super_admin - autenticação automática');
      setIsAdminAuthenticated(true);
      setLoading(false);
      return;
    }
    
    // SEGUNDA VERIFICAÇÃO: Sessão admin específica no localStorage
    const ADMIN_TOKEN_KEY = 'secure_admin_session';
    const SESSION_DURATION = 2 * 60 * 60 * 1000; // 2 horas
    
    try {
      const adminSession = localStorage.getItem(ADMIN_TOKEN_KEY);
      
      if (adminSession) {
        const sessionData = JSON.parse(adminSession);
        const currentTime = Date.now();
        
        // Verificar se o token não expirou e tem estrutura válida
        if (sessionData.expiresAt && currentTime < sessionData.expiresAt && sessionData.hash) {
          console.log('useAdminAuth: admin ainda autenticado via sessão específica');
          setIsAdminAuthenticated(true);
        } else {
          console.log('useAdminAuth: sessão admin expirada ou inválida');
          localStorage.removeItem(ADMIN_TOKEN_KEY);
          setIsAdminAuthenticated(false);
        }
      } else {
        // Verificar se existe auth antiga no sessionStorage e migrar
        const oldAdminAuth = sessionStorage.getItem('admin_authenticated');
        const oldAdminAuthTime = sessionStorage.getItem('admin_auth_time');
        
        if (oldAdminAuth === 'true' && oldAdminAuthTime) {
          const authTime = parseInt(oldAdminAuthTime);
          const currentTime = Date.now();
          
          if (currentTime - authTime < SESSION_DURATION) {
            console.log('useAdminAuth: migrando sessão antiga');
            setIsAdminAuthenticated(true);
          }
          
          // Limpar dados antigos
          sessionStorage.removeItem('admin_authenticated');
          sessionStorage.removeItem('admin_auth_time');
        } else {
          console.log('useAdminAuth: admin não autenticado');
          setIsAdminAuthenticated(false);
        }
      }
    } catch (error) {
      console.error('Erro ao verificar sessão admin:', error);
      localStorage.removeItem(ADMIN_TOKEN_KEY);
      setIsAdminAuthenticated(false);
    }
    
    setLoading(false);
    console.log('useAdminAuth: loading definido para false');
  }, [user, profile, authLoading]);

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

      // SEGURANÇA: Criar sessão segura com token
      const ADMIN_TOKEN_KEY = 'secure_admin_session';
      const SESSION_DURATION = 2 * 60 * 60 * 1000; // 2 horas
      
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

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Erro ao fazer login' };
    }
  };

  const adminLogout = () => {
    // SEGURANÇA: Limpar todas as sessões
    localStorage.removeItem('secure_admin_session');
    sessionStorage.removeItem('admin_authenticated'); // Compatibilidade
    sessionStorage.removeItem('admin_auth_time'); // Compatibilidade
    setIsAdminAuthenticated(false);
  };

  const value = {
    isAdminAuthenticated,
    adminLogin,
    adminLogout,
    loading,
    executeOperation,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};