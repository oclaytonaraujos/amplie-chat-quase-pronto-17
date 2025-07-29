
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Profile {
  id: string;
  nome: string;
  email: string;
  cargo: string;
  empresa_id: string;
  setor: string;
  status: string;
}

export function useSupabaseProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        console.log('Buscando perfil para usuário:', user.email);
        
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Erro ao buscar perfil:', error);
          
          // Se o perfil não existe, aguardar um pouco e tentar novamente
          if (error.code === 'PGRST116') {
            console.log('Perfil não encontrado, aguardando criação...');
            setTimeout(() => {
              fetchProfile();
            }, 2000);
            return;
          }
          
          setProfile(null);
        } else {
          console.log('Perfil encontrado:', data);
          setProfile(data);
          
          // Log adicional para super_admin
          if (data.cargo === 'super_admin') {
            console.log('✅ Usuário identificado como Super Admin:', data.email);
          }
        }
      } catch (error) {
        console.error('Erro inesperado ao buscar perfil:', error);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [user]);

  return { profile, loading };
}
