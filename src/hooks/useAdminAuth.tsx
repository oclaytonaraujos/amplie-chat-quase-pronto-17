import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

  useEffect(() => {
    console.log('useAdminAuth: verificando autenticação admin');
    const adminAuth = sessionStorage.getItem('admin_authenticated');
    const adminAuthTime = sessionStorage.getItem('admin_auth_time');
    
    console.log('useAdminAuth: sessionStorage', { adminAuth, adminAuthTime });
    
    if (adminAuth === 'true' && adminAuthTime) {
      const authTime = parseInt(adminAuthTime);
      const currentTime = Date.now();
      const twoHours = 2 * 60 * 60 * 1000;
      
      console.log('useAdminAuth: verificando tempo', { authTime, currentTime, diff: currentTime - authTime, twoHours });
      
      if (currentTime - authTime < twoHours) {
        console.log('useAdminAuth: admin ainda autenticado');
        setIsAdminAuthenticated(true);
      } else {
        console.log('useAdminAuth: admin auth expirado');
        sessionStorage.removeItem('admin_authenticated');
        sessionStorage.removeItem('admin_auth_time');
      }
    } else {
      console.log('useAdminAuth: admin não autenticado');
    }
    
    setLoading(false);
    console.log('useAdminAuth: loading definido para false');
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

      sessionStorage.setItem('admin_authenticated', 'true');
      sessionStorage.setItem('admin_auth_time', Date.now().toString());
      setIsAdminAuthenticated(true);

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Erro ao fazer login' };
    }
  };

  const adminLogout = () => {
    sessionStorage.removeItem('admin_authenticated');
    sessionStorage.removeItem('admin_auth_time');
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