import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AdminStats {
  totalEmpresas: number;
  totalUsuarios: number;
  empresasAtivas: number;
  usuariosOnline: number;
}

export function useAdminData() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats>({
    totalEmpresas: 0,
    totalUsuarios: 0,
    empresasAtivas: 0,
    usuariosOnline: 0,
  });

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      const [empresasResult, usuariosResult] = await Promise.all([
        supabase.from('empresas').select('id, ativo'),
        supabase.from('profiles').select('id, status')
      ]);

      if (empresasResult.data && usuariosResult.data) {
        setStats({
          totalEmpresas: empresasResult.data.length,
          totalUsuarios: usuariosResult.data.length,
          empresasAtivas: empresasResult.data.filter(e => e.ativo).length,
          usuariosOnline: usuariosResult.data.filter(u => u.status === 'online').length,
        });
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas administrativas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    loading,
    refresh: fetchStats
  };
}