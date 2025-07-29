import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, Shield, Activity } from 'lucide-react';
import { useAdminData } from '@/hooks/useAdminData';

export function AdminSummary() {
  const { stats, loading } = useAdminData();

  const summaryCards = [
    {
      title: 'Total de Empresas',
      value: stats.totalEmpresas,
      subtitle: `${stats.empresasAtivas} ativas`,
      icon: Building2,
      color: 'text-blue-600'
    },
    {
      title: 'Total de Usuários',
      value: stats.totalUsuarios,
      subtitle: `${stats.usuariosOnline} online`,
      icon: Users,
      color: 'text-green-600'
    },
    {
      title: 'Taxa de Ativação',
      value: stats.totalEmpresas > 0 ? Math.round((stats.empresasAtivas / stats.totalEmpresas) * 100) : 0,
      subtitle: '% empresas ativas',
      icon: Activity,
      color: 'text-orange-600'
    },
    {
      title: 'Status do Sistema',
      value: 'Online',
      subtitle: 'Todos os serviços operando',
      icon: Shield,
      color: 'text-emerald-600'
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {summaryCards.map((card, index) => (
        <Card key={index} className="bg-white/50 backdrop-blur-sm border-white/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <card.icon className={`h-4 w-4 ${card.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {typeof card.value === 'number' && card.title !== 'Status do Sistema' 
                ? card.value 
                : card.value
              }
              {card.title === 'Taxa de Ativação' && '%'}
            </div>
            <p className="text-xs text-muted-foreground">
              {card.subtitle}
            </p>
            {card.title === 'Status do Sistema' && (
              <Badge variant="outline" className="mt-2 text-green-600 border-green-200">
                Operacional
              </Badge>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}