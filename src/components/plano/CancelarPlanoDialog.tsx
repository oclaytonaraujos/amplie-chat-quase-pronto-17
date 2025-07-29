
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Calendar, Users, Database } from 'lucide-react';

interface CancelarPlanoDialogProps {
  children: React.ReactNode;
}

export function CancelarPlanoDialog({ children }: CancelarPlanoDialogProps) {
  const [motivo, setMotivo] = useState('');
  const [confirmacao, setConfirmacao] = useState(false);

  const handleCancelPlan = () => {
    if (!confirmacao) {
      setConfirmacao(true);
      return;
    }
    
    console.log('Cancelando plano...', { motivo });
    // Aqui seria implementada a lógica de cancelamento
  };

  const impactos = [
    {
      icon: <Users className="w-5 h-5 text-orange-500" />,
      titulo: 'Acesso da Equipe',
      descricao: 'Todos os usuários perderão acesso em 15 de Janeiro, 2024'
    },
    {
      icon: <Database className="w-5 h-5 text-red-500" />,
      titulo: 'Dados e Configurações',
      descricao: 'Seus dados serão mantidos por 30 dias após o cancelamento'
    },
    {
      icon: <Calendar className="w-5 h-5 text-blue-500" />,
      titulo: 'Período de Uso',
      descricao: 'Você pode usar o plano até o fim do período pago'
    }
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            Cancelar Plano
          </DialogTitle>
          <DialogDescription>
            Tem certeza que deseja cancelar sua assinatura? Esta ação terá os seguintes impactos:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Impactos do Cancelamento */}
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600">Impactos do Cancelamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {impactos.map((impacto, index) => (
                <div key={index} className="flex items-start gap-3">
                  {impacto.icon}
                  <div>
                    <p className="font-medium">{impacto.titulo}</p>
                    <p className="text-sm text-gray-600">{impacto.descricao}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Motivo do Cancelamento */}
          <Card>
            <CardHeader>
              <CardTitle>Conte-nos o motivo (opcional)</CardTitle>
              <CardDescription>
                Suas informações nos ajudam a melhorar nossos serviços
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="motivo">Motivo do cancelamento</Label>
                <Textarea
                  id="motivo"
                  placeholder="Compartilhe conosco o que poderia ter sido melhor..."
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Alternativas */}
          <Card className="border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-600">Antes de cancelar...</CardTitle>
              <CardDescription>
                Considere essas alternativas que podem atender melhor às suas necessidades
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <div>
                  <p className="font-medium">Plano Básico</p>
                  <p className="text-sm text-gray-600">Funcionalidades essenciais por R$ 49,90/mês</p>
                </div>
                <Button variant="outline" size="sm">
                  Ver Detalhes
                </Button>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="font-medium">Pausa Temporária</p>
                  <p className="text-sm text-gray-600">Pause sua assinatura por até 3 meses</p>
                </div>
                <Button variant="outline" size="sm">
                  Pausar Plano
                </Button>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {!confirmacao ? (
            <div className="flex justify-end gap-2">
              <DialogTrigger asChild>
                <Button variant="outline">Manter Plano</Button>
              </DialogTrigger>
              <Button 
                variant="destructive" 
                onClick={handleCancelPlan}
              >
                Continuar Cancelamento
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="font-medium text-red-800">⚠️ Confirmação Final</p>
                <p className="text-sm text-red-600 mt-1">
                  Esta ação não pode ser desfeita. Seu plano será cancelado e você perderá acesso aos recursos premium.
                </p>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setConfirmacao(false)}>
                  Voltar
                </Button>
                <Button variant="destructive" onClick={handleCancelPlan}>
                  Confirmar Cancelamento
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
