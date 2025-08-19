import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

interface Profile {
  id: string;
  nome: string;
  email: string;
  empresa_id: string;
  cargo: string;
  setor: string;
  status: string;
  avatar_url?: string;
  permissoes: any[];
  limite_atendimentos: number;
  aceita_novos_atendimentos: boolean;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isOfflineMode: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock data para modo offline/desenvolvimento
const mockProfile: Profile = {
  id: 'mock-user-id',
  nome: 'Admin Developer',
  email: 'ampliemarketing.mkt@gmail.com',
  empresa_id: 'mock-empresa-id',
  cargo: 'super_admin',
  setor: 'Desenvolvimento',
  status: 'online',
  permissoes: ['*'],
  limite_atendimentos: 999,
  aceita_novos_atendimentos: true,
};

export function OptimizedAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const { toast } = useToast();

  // Verificar se Supabase está disponível
  const checkSupabaseConnection = async (): Promise<boolean> => {
    try {
      const result = await Promise.race([
        supabase.from('profiles').select('id').limit(1),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('timeout')), 3000)
        )
      ]);
      return true;
    } catch (error) {
      console.warn('Supabase não disponível, ativando modo offline', error);
      return false;
    }
  };

  // Carregar perfil otimizado
  const loadProfile = async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error || !data) return null;

      return {
        id: data.id,
        nome: data.nome,
        email: data.email,
        empresa_id: data.empresa_id,
        cargo: data.cargo,
        setor: data.setor,
        status: data.status,
        avatar_url: data.avatar_url,
        permissoes: Array.isArray(data.permissoes) ? data.permissoes : [],
        limite_atendimentos: data.limite_atendimentos,
        aceita_novos_atendimentos: data.aceita_novos_atendimentos,
      };
    } catch (error) {
      logger.error('Erro ao carregar perfil', { userId }, error as Error);
      return null;
    }
  };

  const signIn = async (email: string, password: string) => {
    if (isOfflineMode) {
      // Modo offline - simular login
      if (email === 'ampliemarketing.mkt@gmail.com' || email === 'admin@dev.com') {
        setUser({ id: 'mock-user-id', email } as User);
        setProfile(mockProfile);
        setSession({ user: { id: 'mock-user-id', email } } as Session);
        toast({
          title: "Modo Desenvolvimento",
          description: "Login simulado - dados mockados",
        });
        return { success: true };
      }
      return { success: false, error: 'Credenciais inválidas (modo offline)' };
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Erro inesperado durante o login' };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      
      if (!isOfflineMode && profile) {
        await supabase
          .from('profiles')
          .update({ status: 'offline' })
          .eq('id', profile.id);
      }

      if (!isOfflineMode) {
        await supabase.auth.signOut();
      }

      setUser(null);
      setProfile(null);
      setSession(null);
      
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      });
    } catch (error) {
      logger.error('Erro no logout', {}, error as Error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!profile) return;

    if (isOfflineMode) {
      setProfile({ ...profile, ...updates });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id)
        .select()
        .single();

      if (error) throw error;

      setProfile({ ...profile, ...updates });
    } catch (error) {
      logger.error('Erro ao atualizar perfil', {}, error as Error);
      throw error;
    }
  };

  const isAdmin = profile?.cargo === 'admin' || profile?.cargo === 'super_admin';
  const isSuperAdmin = profile?.cargo === 'super_admin';

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        const supabaseAvailable = await checkSupabaseConnection();
        
        if (!supabaseAvailable) {
          setIsOfflineMode(true);
          setLoading(false);
          
          // Auto-login no modo offline para desenvolvimento
          if (process.env.NODE_ENV === 'development') {
            setUser({ id: 'mock-user-id', email: 'ampliemarketing.mkt@gmail.com' } as User);
            setProfile(mockProfile);
            setSession({ user: { id: 'mock-user-id', email: 'ampliemarketing.mkt@gmail.com' } } as Session);
          }
          return;
        }

        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (error) {
          logger.error('Erro ao obter sessão inicial', {}, error);
          setLoading(false);
          return;
        }

        if (session) {
          setSession(session);
          setUser(session.user);
          
          const existingProfile = await loadProfile(session.user.id);
          if (existingProfile && mounted) {
            setProfile(existingProfile);
          }
        }
      } catch (error) {
        if (mounted) {
          logger.error('Erro inesperado na inicialização', {}, error as Error);
          setIsOfflineMode(true);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initialize();

    // Auth state listener apenas se não estiver em modo offline
    let subscription: any;
    
    if (!isOfflineMode) {
      subscription = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (!mounted) return;
          
          setSession(session);
          setUser(session?.user ?? null);

          if (session?.user) {
            const existingProfile = await loadProfile(session.user.id);
            if (existingProfile && mounted) {
              setProfile(existingProfile);
            }
          } else {
            setProfile(null);
          }

          if (mounted) {
            setLoading(false);
          }
        }
      );
    }

    return () => {
      mounted = false;
      if (subscription) {
        subscription.data.subscription.unsubscribe();
      }
    };
  }, [isOfflineMode]);

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    signIn,
    signOut,
    updateProfile,
    isAdmin,
    isSuperAdmin,
    isOfflineMode
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useOptimizedAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useOptimizedAuth must be used within an OptimizedAuthProvider');
  }
  return context;
}