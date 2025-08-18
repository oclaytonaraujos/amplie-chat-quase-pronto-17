/**
 * Hook para gerenciar perfil do usuário via Supabase
 */
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
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
  created_at?: string;
  updated_at?: string;
}

interface UseSupabaseProfileReturn {
  profile: Profile | null;
  loading: boolean;
  error: Error | null;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export function useSupabaseProfile(): UseSupabaseProfileReturn {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Carregar perfil do usuário
  const loadProfile = async (userId: string): Promise<Profile | null> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (queryError) {
        if (queryError.code === 'PGRST116') {
          // Perfil não encontrado - pode estar sendo criado pelo trigger
          logger.info('Profile not found, waiting for trigger creation', {
            component: 'useSupabaseProfile',
            metadata: { userId }
          });
          return null;
        }
        throw queryError;
      }

      if (!data) {
        throw new Error('Profile data is null');
      }

      const profileData: Profile = {
        id: data.id,
        nome: data.nome || '',
        email: data.email || '',
        empresa_id: data.empresa_id || '',
        cargo: data.cargo || 'usuario',
        setor: data.setor || '',
        status: data.status || 'online',
        avatar_url: data.avatar_url,
        permissoes: Array.isArray(data.permissoes) ? data.permissoes : [],
        limite_atendimentos: data.limite_atendimentos || 5,
        aceita_novos_atendimentos: data.aceita_novos_atendimentos !== false,
        created_at: data.created_at,
        updated_at: data.updated_at
      };

      setProfile(profileData);
      
      logger.info('Profile loaded successfully', {
        component: 'useSupabaseProfile',
        metadata: { 
          userId,
          cargo: profileData.cargo,
          empresa_id: profileData.empresa_id 
        }
      });

      return profileData;
    } catch (err) {
      const error = err as Error;
      setError(error);
      
      logger.error('Failed to load profile', {
        component: 'useSupabaseProfile',
        metadata: { userId }
      }, error);
      
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Aguardar criação do perfil pelo trigger
  const waitForProfileCreation = async (userId: string, maxAttempts: number = 10): Promise<Profile | null> => {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      logger.info(`Waiting for profile creation - attempt ${attempt}/${maxAttempts}`, {
        component: 'useSupabaseProfile',
        metadata: { userId, attempt }
      });

      const profile = await loadProfile(userId);
      if (profile) {
        return profile;
      }

      if (attempt < maxAttempts) {
        // Delay exponencial
        const delay = Math.min(500 * attempt, 3000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    const error = new Error(`Profile not created after ${maxAttempts} attempts`);
    setError(error);
    logger.error('Profile creation timeout', {
      component: 'useSupabaseProfile',
      metadata: { userId, maxAttempts }
    }, error);

    return null;
  };

  // Atualizar perfil
  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user || !profile) {
      throw new Error('No user or profile to update');
    }

    try {
      setError(null);

      const { data, error: updateError } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single();

      if (updateError) throw updateError;

      if (data) {
        const updatedProfile: Profile = {
          ...profile,
          ...updates,
          updated_at: data.updated_at
        };
        
        setProfile(updatedProfile);
        
        logger.info('Profile updated successfully', {
          component: 'useSupabaseProfile',
          metadata: { 
            userId: user.id,
            updatedFields: Object.keys(updates)
          }
        });
      }
    } catch (err) {
      const error = err as Error;
      setError(error);
      
      logger.error('Failed to update profile', {
        component: 'useSupabaseProfile',
        metadata: { userId: user?.id }
      }, error);
      
      throw error;
    }
  };

  // Refresh do perfil
  const refreshProfile = async () => {
    if (!user) return;
    
    await loadProfile(user.id);
  };

  // Carregar perfil quando usuário muda
  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      setError(null);
      return;
    }

    const loadUserProfile = async () => {
      const existingProfile = await loadProfile(user.id);
      
      if (!existingProfile) {
        // Tentar aguardar criação pelo trigger
        await waitForProfileCreation(user.id);
      }
    };

    loadUserProfile();
  }, [user]);

  // Subscription para mudanças em tempo real
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
          logger.info('Profile updated via realtime', {
            component: 'useSupabaseProfile',
            metadata: { userId: user.id }
          });

          if (payload.new) {
            const updatedProfile: Profile = {
              id: payload.new.id,
              nome: payload.new.nome || '',
              email: payload.new.email || '',
              empresa_id: payload.new.empresa_id || '',
              cargo: payload.new.cargo || 'usuario',
              setor: payload.new.setor || '',
              status: payload.new.status || 'online',
              avatar_url: payload.new.avatar_url,
              permissoes: Array.isArray(payload.new.permissoes) ? payload.new.permissoes : [],
              limite_atendimentos: payload.new.limite_atendimentos || 5,
              aceita_novos_atendimentos: payload.new.aceita_novos_atendimentos !== false,
              created_at: payload.new.created_at,
              updated_at: payload.new.updated_at
            };

            setProfile(updatedProfile);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    profile,
    loading,
    error,
    updateProfile,
    refreshProfile
  };
}