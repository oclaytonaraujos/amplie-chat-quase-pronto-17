import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CreditCard, Download, Calendar, CheckCircle, AlertCircle } from 'lucide-react';
import { GerenciarPagamentoDialog } from '@/components/plano/GerenciarPagamentoDialog';

export default function PlanoFaturamento() {
  const planoAtual = {
    nome: 'Plano Premium',
    preco: 'R$ 99,90',
    periodo: 'mensal',
    dataRenovacao: '15 de Janeiro, 2024',
    status: 'ativo'
  };
  const historico = [{
    id: 1,
    data: '15/12/2023',
    descricao: 'Plano Premium - Dezembro 2023',
    valor: 'R$ 99,90',
    status: 'pago',
    downloadUrl: '#'
  }, {
    id: 2,
    data: '15/11/2023',
    descricao: 'Plano Premium - Novembro 2023',
    valor: 'R$ 99,90',
    status: 'pago',
    downloadUrl: '#'
  }, {
    id: 3,
    data: '15/10/2023',
    descricao: 'Plano Premium - Outubro 2023',
    valor: 'R$ 99,90',
    status: 'pago',
    downloadUrl: '#'
  }];
  const limites = [{
    recurso: 'Usuários',
    usado: 8,
    limite: 25
  }, {
    recurso: 'Contatos',
    usado: 1250,
    limite: 5000
  }, {
    recurso: 'Atendimentos/mês',
    usado: 340,
    limite: 1000
  }, {
    recurso: 'Armazenamento',
    usado: 2.5,
    limite: 10,
    unidade: 'GB'
  }];
  return <div className="space-y-6">
      {/* Plano Atual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-amplie-primary" />
            Plano Atual
          </CardTitle>
          <CardDescription>
            Gerencie seu plano e informações de faturamento
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">{planoAtual.nome}</h3>
              <p className="text-gray-600">
                {planoAtual.preco}/{planoAtual.periodo}
              </p>
            </div>
            <Badge variant="default" className="bg-green-100 text-green-800">
              <CheckCircle className="w-3 h-3 mr-1" />
              {planoAtual.status}
            </Badge>
          </div>
          
          <Separator />
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            Próxima renovação: {planoAtual.dataRenovacao}
          </div>
          
          <div className="flex gap-2">
            <GerenciarPagamentoDialog>
              <Button variant="outline">Gerenciar Pagamento</Button>
            </GerenciarPagamentoDialog>
          </div>
        </CardContent>
      </Card>

      {/* Uso do Plano */}
      <Card>
        <CardHeader>
          <CardTitle>Uso do Plano</CardTitle>
          <CardDescription>
            Acompanhe o uso dos recursos do seu plano
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {limites.map((item, index) => {
            const porcentagem = item.usado / item.limite * 100;
            const isQuaseEsgotado = porcentagem > 80;
            return <div key={index} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{item.recurso}</span>
                    <span className="text-gray-600">
                      {item.usado} / {item.limite} {item.unidade || ''}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className={`h-2 rounded-full ${isQuaseEsgotado ? 'bg-red-500' : 'bg-amplie-primary'}`} style={{
                  width: `${Math.min(porcentagem, 100)}%`
                }} />
                  </div>
                  {isQuaseEsgotado && <div className="flex items-center gap-1 text-xs text-red-600">
                      <AlertCircle className="w-3 h-3" />
                      Limite quase atingido
                    </div>}
                </div>;
          })}
          </div>
        </CardContent>
      </Card>

      {/* Histórico de Faturas */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Faturas</CardTitle>
          <CardDescription>
            Visualize e baixe suas faturas anteriores
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {historico.map(fatura => <div key={fatura.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{fatura.descricao}</div>
                  <div className="text-sm text-gray-600">{fatura.data}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="font-medium">{fatura.valor}</div>
                    <Badge variant="default" className="bg-green-100 text-green-800 text-xs">
                      {fatura.status}
                    </Badge>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => window.open(fatura.downloadUrl, '_blank')}>
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>)}
          </div>
        </CardContent>
      </Card>
    </div>;
}
