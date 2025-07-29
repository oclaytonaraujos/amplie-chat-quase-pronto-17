
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { Usuario } from '@/hooks/useUsuarios';

export function useUsuariosData() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const { isSuperAdmin, loading: roleLoading } = useUserRole();

  const loadUsuarios = async () => {
    try {
      setLoading(true);
      console.log('Carregando usuários...');
      console.log('User:', user?.email);
      console.log('IsSuperAdmin:', isSuperAdmin);
      
      if (isSuperAdmin) {
        // Super admin pode ver todos os usuários
        console.log('Carregando todos os usuários (super admin)');
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Erro ao carregar usuários (super admin):', error);
          toast({
            title: "Erro ao carregar usuários",
            description: error.message,
            variant: "destructive",
          });
          return;
        }

        console.log('Usuários carregados (super admin):', data?.length);
        setUsuarios(data || []);
      } else {
        // Usuário normal - carrega apenas da sua empresa
        console.log('Carregando usuários da empresa');
        
        // Primeiro, obter a empresa_id do usuário atual
        const { data: currentProfile } = await supabase
          .from('profiles')
          .select('empresa_id')
          .eq('id', user?.id)
          .single();

        if (!currentProfile?.empresa_id) {
          console.error('Usuário não está associado a uma empresa');
          setUsuarios([]);
          return;
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('empresa_id', currentProfile.empresa_id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Erro ao carregar usuários da empresa:', error);
          toast({
            title: "Erro ao carregar usuários",
            description: error.message,
            variant: "destructive",
          });
          return;
        }

        console.log('Usuários da empresa carregados:', data?.length);
        setUsuarios(data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar usuários",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && !roleLoading) {
      loadUsuarios();
    }
  }, [user, isSuperAdmin, roleLoading]);

  return {
    usuarios,
    setUsuarios,
    loading,
    loadUsuarios,
    isSuperAdmin
  };
}
