import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreditCard, Calendar, Lock, Plus, Trash2, FileText } from 'lucide-react';

interface GerenciarPagamentoDialogProps {
  children: React.ReactNode;
}

export function GerenciarPagamentoDialog({ children }: GerenciarPagamentoDialogProps) {
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'boleto'>('card');

  const cartoesSalvos = [
    {
      id: 1,
      tipo: 'Visa',
      ultimos4: '4532',
      vencimento: '12/25',
      principal: true
    },
    {
      id: 2,
      tipo: 'Mastercard',
      ultimos4: '8976',
      vencimento: '08/26',
      principal: false
    }
  ];

  const handleSavePayment = () => {
    console.log('Salvando método de pagamento...');
    setIsAddingCard(false);
  };

  const handleDeleteCard = (cardId: number) => {
    console.log(`Removendo cartão ${cardId}`);
  };

  const handleSetPrincipal = (cardId: number) => {
    console.log(`Definindo cartão ${cardId} como principal`);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Pagamento</DialogTitle>
          <DialogDescription>
            Gerencie seus métodos de pagamento e informações de cobrança
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Seletor de Método de Pagamento */}
          <Card>
            <CardHeader>
              <CardTitle>Método de Pagamento</CardTitle>
              <CardDescription>
                Escolha como deseja pagar sua assinatura
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button
                  variant={paymentMethod === 'card' ? 'default' : 'outline'}
                  onClick={() => setPaymentMethod('card')}
                  className="flex-1"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Cartão de Crédito
                </Button>
                <Button
                  variant={paymentMethod === 'boleto' ? 'default' : 'outline'}
                  onClick={() => setPaymentMethod('boleto')}
                  className="flex-1"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Boleto Bancário
                </Button>
              </div>
            </CardContent>
          </Card>

          {paymentMethod === 'boleto' && (
            <Card className="border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-600">Pagamento via Boleto</CardTitle>
                <CardDescription>
                  O boleto será gerado automaticamente na data de vencimento
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">Como funciona:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• O boleto é enviado por email 3 dias antes do vencimento</li>
                    <li>• Prazo de pagamento: até 3 dias após o vencimento</li>
                    <li>• Confirmação automática em até 2 dias úteis</li>
                  </ul>
                </div>
                <div className="text-sm text-gray-600">
                  <p><strong>Próximo boleto:</strong> Será enviado em 12 de Janeiro, 2024</p>
                  <p><strong>Vencimento:</strong> 15 de Janeiro, 2024</p>
                  <p><strong>Valor:</strong> R$ 99,90</p>
                </div>
              </CardContent>
            </Card>
          )}

          {paymentMethod === 'card' && (
            <>
              {/* Cartões Salvos */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Métodos de Pagamento</span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setIsAddingCard(true)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Cartão
                    </Button>
                  </CardTitle>
                  <CardDescription>
                    Seus cartões de crédito salvos
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {cartoesSalvos.map((cartao) => (
                    <div key={cartao.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <CreditCard className="w-5 h-5 text-gray-400" />
                        <div>
                          <div className="font-medium">
                            {cartao.tipo} •••• {cartao.ultimos4}
                            {cartao.principal && (
                              <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                Principal
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            Vence em {cartao.vencimento}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!cartao.principal && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleSetPrincipal(cartao.id)}
                          >
                            Tornar principal
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteCard(cartao.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Adicionar Novo Cartão */}
              {isAddingCard && (
                <Card>
                  <CardHeader>
                    <CardTitle>Adicionar Novo Cartão</CardTitle>
                    <CardDescription>
                      Insira os dados do seu cartão de crédito
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <Label htmlFor="cardNumber">Número do Cartão</Label>
                        <Input id="cardNumber" placeholder="1234 5678 9012 3456" />
                      </div>
                      <div>
                        <Label htmlFor="expiryDate">Vencimento</Label>
                        <Input id="expiryDate" placeholder="MM/AA" />
                      </div>
                      <div>
                        <Label htmlFor="cvv">CVV</Label>
                        <Input id="cvv" placeholder="123" />
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor="cardName">Nome no Cartão</Label>
                        <Input id="cardName" placeholder="João Silva" />
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setIsAddingCard(false)}
                      >
                        Cancelar
                      </Button>
                      <Button onClick={handleSavePayment} className="bg-amplie-primary">
                        <Lock className="w-4 h-4 mr-2" />
                        Salvar Cartão
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Próxima Cobrança */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Próxima Cobrança
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">R$ 99,90</p>
                  <p className="text-sm text-gray-600">15 de Janeiro, 2024</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Método de pagamento</p>
                  <p className="font-medium">
                    {paymentMethod === 'card' ? 'Visa •••• 4532' : 'Boleto Bancário'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end mt-6">
          <DialogTrigger asChild>
            <Button variant="outline">Fechar</Button>
          </DialogTrigger>
        </div>
      </DialogContent>
    </Dialog>
  );
}
