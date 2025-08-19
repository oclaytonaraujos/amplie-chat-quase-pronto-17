
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, MessageSquare, Users, TrendingUp, Shield, Activity, Monitor } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function Painel() {
  const { user } = useAuth();

  const quickStats = [
    {
      title: "Conversas Ativas",
      value: "12",
      description: "Conversas em andamento",
      icon: MessageSquare,
      color: "text-blue-600"
    },
    {
      title: "Contatos",
      value: "234",
      description: "Total de contatos",
      icon: Users,
      color: "text-green-600"
    },
    {
      title: "Taxa de Resposta",
      value: "98%",
      description: "Últimas 24h",
      icon: TrendingUp,
      color: "text-purple-600"
    },
    {
      title: "Sistema",
      value: "Online",
      description: "Todos os serviços ativos",
      icon: Activity,
      color: "text-emerald-600"
    }
  ];

  const quickActions = [
    {
      title: "Atendimento",
      description: "Acesse a central de atendimento",
      href: "/atendimento",
      icon: MessageSquare
    },
    {
      title: "Contatos",
      description: "Gerencie seus contatos",
      href: "/contatos",
      icon: Users
    },
    {
      title: "Dashboard",
      description: "Veja métricas detalhadas",
      href: "/dashboard",
      icon: BarChart3
    },
    {
      title: "ChatBot",
      description: "Configure automações",
      href: "/chatbot",
      icon: Shield
    },
    {
      title: "Monitor de Eventos",
      description: "Sistema n8n em tempo real",
      href: "/events-monitor",
      icon: Monitor
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Bem-vindo de volta, {user?.user_metadata?.nome || user?.email?.split('@')[0]}!
        </h1>
        <p className="text-muted-foreground mt-2">
          Aqui está um resumo das suas atividades
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {quickStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
          <CardDescription>
            Acesse rapidamente as principais funcionalidades do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Link key={index} to={action.href}>
                  <Button 
                    variant="outline" 
                    className="h-auto w-full p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex flex-col items-center gap-2 text-center">
                      <Icon className="h-6 w-6" />
                      <div>
                        <div className="font-medium">{action.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {action.description}
                        </div>
                      </div>
                    </div>
                  </Button>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Atividade Recente</CardTitle>
          <CardDescription>
            Últimas ações no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-muted/20 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Sistema iniciado com sucesso</p>
                <p className="text-xs text-muted-foreground">Há 5 minutos</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-muted/20 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Usuário autenticado</p>
                <p className="text-xs text-muted-foreground">Há 6 minutos</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
