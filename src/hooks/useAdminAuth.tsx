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
    // Se ainda está carregando a autenticação principal, aguardar
    if (authLoading) {
      return;
    }

    // VERIFICAÇÃO ÚNICA: Se usuário está logado como super_admin no sistema principal
    if (user && profile && profile.cargo === 'super_admin') {
      setIsAdminAuthenticated(true);
      setLoading(false);
      return;
    }
    
    // Qualquer outro caso, não é admin
    setIsAdminAuthenticated(false);
    setLoading(false);
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