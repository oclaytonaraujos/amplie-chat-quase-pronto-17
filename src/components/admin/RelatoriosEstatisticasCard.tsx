
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, MessageSquare, Smartphone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Estatisticas {
  totalEmpresas: number;
  empresasAtivas: number;
  totalUsuarios: number;
  usuariosOnline: number;
  totalConversas: number;
  conversasAtivas: number;
  conexoesWhatsapp: number;
  conexoesAtivas: number;
}

export default function RelatoriosEstatisticasCard() {
  const [stats, setStats] = useState<Estatisticas>({
    totalEmpresas: 0,
    empresasAtivas: 0,
    totalUsuarios: 0,
    usuariosOnline: 0,
    totalConversas: 0,
    conversasAtivas: 0,
    conexoesWhatsapp: 0,
    conexoesAtivas: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEstatisticas();
  }, []);

  const fetchEstatisticas = async () => {
    try {
      // Buscar estatísticas de empresas
      const { data: empresas, error: empresasError } = await supabase
        .from('empresas')
        .select('ativo');

      if (empresasError) throw empresasError;

      // Buscar estatísticas de usuários
      const { data: usuarios, error: usuariosError } = await supabase
        .from('profiles')
        .select('status');

      if (usuariosError) throw usuariosError;

      // Buscar estatísticas de conversas
      const { data: conversas, error: conversasError } = await supabase
        .from('conversas')
        .select('status');

      if (conversasError) throw conversasError;

      // Buscar estatísticas de conexões WhatsApp
      const { data: whatsapp, error: whatsappError } = await supabase
        .from('whatsapp_connections')
        .select('ativo, status');

      if (whatsappError) throw whatsappError;

      setStats({
        totalEmpresas: empresas?.length || 0,
        empresasAtivas: empresas?.filter(e => e.ativo).length || 0,
        totalUsuarios: usuarios?.length || 0,
        usuariosOnline: usuarios?.filter(u => u.status === 'online').length || 0,
        totalConversas: conversas?.length || 0,
        conversasAtivas: conversas?.filter(c => c.status === 'ativo').length || 0,
        conexoesWhatsapp: whatsapp?.length || 0,
        conexoesAtivas: whatsapp?.filter(w => w.status === 'conectado').length || 0
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Estatísticas da Plataforma</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">Carregando estatísticas...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Estatísticas da Plataforma</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 border rounded-lg">
            <Building2 className="h-8 w-8 mx-auto mb-2 text-blue-500" />
            <div className="text-2xl font-bold">{stats.totalEmpresas}</div>
            <div className="text-sm text-gray-600">Total de Empresas</div>
            <Badge variant="default" className="mt-1">
              {stats.empresasAtivas} ativas
            </Badge>
          </div>

          <div className="text-center p-4 border rounded-lg">
            <Users className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <div className="text-2xl font-bold">{stats.totalUsuarios}</div>
            <div className="text-sm text-gray-600">Total de Usuários</div>
            <Badge variant="default" className="mt-1">
              {stats.usuariosOnline} online
            </Badge>
          </div>

          <div className="text-center p-4 border rounded-lg">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 text-purple-500" />
            <div className="text-2xl font-bold">{stats.totalConversas}</div>
            <div className="text-sm text-gray-600">Total de Conversas</div>
            <Badge variant="default" className="mt-1">
              {stats.conversasAtivas} ativas
            </Badge>
          </div>

          <div className="text-center p-4 border rounded-lg">
            <Smartphone className="h-8 w-8 mx-auto mb-2 text-orange-500" />
            <div className="text-2xl font-bold">{stats.conexoesWhatsapp}</div>
            <div className="text-sm text-gray-600">Conexões WhatsApp</div>
            <Badge variant="default" className="mt-1">
              {stats.conexoesAtivas} ativas
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
