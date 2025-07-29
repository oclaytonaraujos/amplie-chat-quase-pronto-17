
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, CreditCard } from 'lucide-react';

interface AlterarPlanoDialogProps {
  children: React.ReactNode;
}

export function AlterarPlanoDialog({ children }: AlterarPlanoDialogProps) {
  const [selectedPlan, setSelectedPlan] = useState<string>('premium');

  const planos = [
    {
      id: 'basico',
      nome: 'Plano Básico',
      preco: 'R$ 49,90',
      periodo: 'mensal',
      descricao: 'Ideal para pequenas empresas',
      recursos: [
        '5 usuários',
        '1.000 contatos',
        '200 atendimentos/mês',
        '2GB de armazenamento',
        'Suporte por email'
      ]
    },
    {
      id: 'premium',
      nome: 'Plano Premium',
      preco: 'R$ 99,90',
      periodo: 'mensal',
      descricao: 'Para empresas em crescimento',
      recursos: [
        '25 usuários',
        '5.000 contatos',
        '1.000 atendimentos/mês',
        '10GB de armazenamento',
        'Suporte prioritário',
        'Relatórios avançados'
      ],
      atual: true
    },
    {
      id: 'enterprise',
      nome: 'Plano Enterprise',
      preco: 'R$ 199,90',
      periodo: 'mensal',
      descricao: 'Para grandes empresas',
      recursos: [
        'Usuários ilimitados',
        'Contatos ilimitados',
        'Atendimentos ilimitados',
        '100GB de armazenamento',
        'Suporte 24/7',
        'Relatórios personalizados',
        'API completa'
      ]
    }
  ];

  const handleChangePlan = () => {
    console.log(`Alterando para o plano: ${selectedPlan}`);
    // Aqui seria implementada a lógica de alteração do plano
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Alterar Plano</DialogTitle>
          <DialogDescription>
            Escolha o plano que melhor atende às suas necessidades
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid md:grid-cols-3 gap-4 mt-4">
          {planos.map((plano) => (
            <Card 
              key={plano.id}
              className={`cursor-pointer transition-all ${
                selectedPlan === plano.id 
                  ? 'border-amplie-primary shadow-lg' 
                  : 'border-gray-200 hover:border-gray-300'
              } ${plano.atual ? 'ring-2 ring-green-200' : ''}`}
              onClick={() => setSelectedPlan(plano.id)}
            >
              <CardHeader className="text-center">
                <div className="flex items-center justify-center gap-2">
                  <CardTitle className="text-lg">{plano.nome}</CardTitle>
                  {plano.atual && (
                    <Badge className="bg-green-100 text-green-800">Atual</Badge>
                  )}
                </div>
                <CardDescription>{plano.descricao}</CardDescription>
                <div className="text-2xl font-bold text-amplie-primary">
                  {plano.preco}
                  <span className="text-sm text-gray-500">/{plano.periodo}</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {plano.recursos.map((recurso, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500" />
                      {recurso}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <DialogTrigger asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogTrigger>
          <Button onClick={handleChangePlan} className="bg-amplie-primary">
            <CreditCard className="w-4 h-4 mr-2" />
            Confirmar Alteração
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
