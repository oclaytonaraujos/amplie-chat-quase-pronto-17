
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Users, Bot, BarChart3, Shield, Zap } from 'lucide-react';

export default function Index() {
  console.log('Index page carregada com sucesso');
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <img 
                src="/lovable-uploads/eddc7fb8-220e-433f-89b2-915fbe2e2daf.png" 
                alt="Amplie Icon" 
                className="h-8 w-8 object-contain mr-3"
              />
              <img 
                src="/lovable-uploads/8ed7aa80-8a43-4375-a757-0f7dd486297f.png" 
                alt="Amplie Chat" 
                className="h-6 object-contain"
              />
            </div>
            <div className="space-x-4">
              <Link to="/auth">
                <Button variant="outline">Login</Button>
              </Link>
              <Link to="/auth">
                <Button>Começar Grátis</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Atendimento ao Cliente
            <span className="text-blue-600 block">Completo e Inteligente</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Transforme seu atendimento com nossa plataforma integrada de WhatsApp, 
            chatbots inteligentes e gestão completa de relacionamento com clientes.
          </p>
          <div className="space-x-4">
            <Link to="/auth">
              <Button size="lg" className="px-8 py-3">
                Começar Agora
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="px-8 py-3">
              Ver Demo
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Tudo que você precisa em uma plataforma
          </h2>
          <p className="text-lg text-gray-600">
            Recursos avançados para otimizar seu atendimento ao cliente
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <MessageSquare className="h-10 w-10 text-blue-600 mb-4" />
              <CardTitle>WhatsApp Integrado</CardTitle>
              <CardDescription>
                Conecte múltiplas contas do WhatsApp e centralize todos os atendimentos
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Bot className="h-10 w-10 text-green-600 mb-4" />
              <CardTitle>Chatbots Inteligentes</CardTitle>
              <CardDescription>
                Automatize respostas e qualifique leads com IA avançada
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-10 w-10 text-purple-600 mb-4" />
              <CardTitle>Gestão de Equipe</CardTitle>
              <CardDescription>
                Organize sua equipe em setores e acompanhe performance
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <BarChart3 className="h-10 w-10 text-orange-600 mb-4" />
              <CardTitle>Relatórios Avançados</CardTitle>
              <CardDescription>
                Dashboards completos com métricas de atendimento
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-10 w-10 text-red-600 mb-4" />
              <CardTitle>Segurança Total</CardTitle>
              <CardDescription>
                Dados protegidos e conformidade com LGPD
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="h-10 w-10 text-yellow-600 mb-4" />
              <CardTitle>Automações</CardTitle>
              <CardDescription>
                Integre com ferramentas como n8n para workflows avançados
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600 py-20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-4">
            Pronto para revolucionar seu atendimento?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Comece hoje mesmo e veja a diferença que uma plataforma completa pode fazer
          </p>
          <Link to="/auth">
            <Button size="lg" variant="secondary" className="px-8 py-3">
              Começar Gratuitamente
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <img 
                src="/lovable-uploads/eddc7fb8-220e-433f-89b2-915fbe2e2daf.png" 
                alt="Amplie Icon" 
                className="h-6 w-6 object-contain mr-2 filter brightness-0 invert"
              />
              <img 
                src="/lovable-uploads/8ed7aa80-8a43-4375-a757-0f7dd486297f.png" 
                alt="Amplie Chat" 
                className="h-4 object-contain filter brightness-0 invert"
              />
            </div>
            <p className="text-gray-400">
              © 2024 Amplie Chat. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
