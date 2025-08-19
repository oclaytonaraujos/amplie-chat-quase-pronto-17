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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Converter dados do Supabase para interface Profile
  const convertToProfile = (data: any): Profile => {
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
  };

  // Carregar perfil do usuário
  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        logger.error('Erro ao carregar perfil do usuário', { userId }, error);
        return null;
      }

      if (!data) {
        logger.info('Perfil não encontrado, será criado automaticamente pelo trigger');
        return null;
      }

      logger.info('Perfil carregado com sucesso', { userId });
      const profile = convertToProfile(data);
      setProfile(profile);
      return profile;
    } catch (error) {
      logger.error('Erro inesperado ao carregar perfil', { userId }, error as Error);
      return null;
    }
  };

  // Aguardar criação automática do perfil pelo trigger
  const waitForProfileCreation = async (userId: string, maxAttempts = 10): Promise<Profile | null> => {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      logger.info(`Tentativa ${attempt} de carregar perfil criado automaticamente`, { userId });
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (!error && data) {
        logger.info('Perfil criado automaticamente encontrado', { userId });
        const profile = convertToProfile(data);
        setProfile(profile);
        return profile;
      }

      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 500 * attempt)); // Delay exponencial
      }
    }

    logger.error('Timeout aguardando criação automática do perfil', { userId });
    return null;
  };

  // Função de login
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        logger.error('Erro no login', {}, error);
        return { success: false, error: error.message };
      }

      logger.info('Login realizado com sucesso');
      return { success: true };
    } catch (error) {
      logger.error('Erro inesperado no login', {}, error as Error);
      return { success: false, error: 'Erro inesperado durante o login' };
    } finally {
      setLoading(false);
    }
  };

  // Função de logout
  const signOut = async () => {
    try {
      setLoading(true);
      
      // Atualizar status para offline antes de fazer logout
      if (profile) {
        await supabase
          .from('profiles')
          .update({ status: 'offline' })
          .eq('id', profile.id);
      }

      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
      setProfile(null);
      setSession(null);
      
      logger.info('Logout realizado com sucesso');
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      });
    } catch (error) {
      logger.error('Erro no logout', {}, error as Error);
      toast({
        title: "Erro no logout",
        description: "Ocorreu um erro ao fazer logout.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Atualizar perfil
  const updateProfile = async (updates: Partial<Profile>) => {
    if (!profile) return;

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

      const updatedProfile = convertToProfile(data);
      setProfile(updatedProfile);
      logger.info('Perfil atualizado com sucesso');
    } catch (error) {
      logger.error('Erro ao atualizar perfil', {}, error as Error);
      throw error;
    }
  };

  // Verificar se é admin
  const isAdmin = profile?.cargo === 'admin' || profile?.cargo === 'super_admin';
  const isSuperAdmin = profile?.cargo === 'super_admin';

  // Gerenciar estado da sessão
  useEffect(() => {
    // Obter sessão inicial
    const getInitialSession = async () => {
      try {
        console.log('[AuthContext] Obtendo sessão inicial...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[AuthContext] Erro ao obter sessão inicial:', error);
          logger.error('Erro ao obter sessão inicial', {}, error);
          setLoading(false);
          return;
        }

        console.log('[AuthContext] Sessão obtida:', { hasSession: !!session, userEmail: session?.user?.email });

        if (session) {
          setSession(session);
          setUser(session.user);
          
          console.log('[AuthContext] Carregando perfil do usuário...');
          // Carregar perfil (será criado automaticamente pelo trigger se não existir)
          const existingProfile = await loadProfile(session.user.id);
          if (!existingProfile) {
            console.log('[AuthContext] Perfil não encontrado, aguardando criação automática...');
            // Aguardar criação automática pelo trigger
            await waitForProfileCreation(session.user.id);
          }
        } else {
          console.log('[AuthContext] Nenhuma sessão ativa encontrada');
        }
      } catch (error) {
        console.error('[AuthContext] Erro inesperado ao obter sessão:', error);
        logger.error('Erro inesperado ao obter sessão', {}, error as Error);
      } finally {
        console.log('[AuthContext] Finalizando carregamento inicial');
        setLoading(false);
      }
    };

    getInitialSession();

    // Escutar mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        logger.info('Auth state changed');
        
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Carregar perfil primeiro
          const existingProfile = await loadProfile(session.user.id);
          let finalProfile = existingProfile;
          
          if (!finalProfile) {
            // Aguardar criação automática pelo trigger
            finalProfile = await waitForProfileCreation(session.user.id);
          }

          // Atualizar status para online após perfil estar carregado
          if (finalProfile) {
            await supabase
              .from('profiles')
              .update({ 
                status: 'online',
                last_login_at: new Date().toISOString()
              })
              .eq('id', session.user.id);
          }
        } else {
          setProfile(null);
        }

        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Real-time subscription para mudanças no perfil
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`profile_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`
        },
        (payload) => {
          logger.info('Perfil atualizado via realtime');
          const updatedProfile = convertToProfile(payload.new);
          setProfile(updatedProfile);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    signIn,
    signOut,
    updateProfile,
    isAdmin,
    isSuperAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}