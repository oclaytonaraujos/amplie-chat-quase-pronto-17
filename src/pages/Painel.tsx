
import { Settings, MessageSquare, Clock, Globe, Shield, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { WhatsAppConnectionManager } from '@/components/whatsapp/WhatsAppConnectionManager';

export default function Painel() {
  return (
    <div className="p-6 space-y-6">
      {/* Conexões WhatsApp */}
      <WhatsAppConnectionManager />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Controle de Atendimentos */}
        <div className="bg-card rounded-xl shadow-sm border p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Controle de Atendimentos</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Limite de Mensagens em Aberto por Agente
              </label>
              <Input 
                type="number" 
                min="1" 
                max="20" 
                defaultValue="5" 
                placeholder="5"
              />
              <p className="text-xs text-gray-500 mt-1">
                Número máximo de conversas ativas que cada agente pode ter simultaneamente
              </p>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-gray-700">Receber Transferências Mesmo no Limite</span>
                <p className="text-xs text-gray-500">Permitir que agentes recebam transferências mesmo atingindo o limite</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-gray-700">Distribuição Automática</span>
                <p className="text-xs text-gray-500">Distribuir novos atendimentos automaticamente entre agentes disponíveis</p>
              </div>
              <Switch />
            </div>
          </div>
        </div>

        {/* Mensagens Automáticas */}
        <div className="bg-card rounded-xl shadow-sm border p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-purple-100 rounded-lg">
              <MessageSquare className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Mensagens Automáticas</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mensagem de Boas-vindas</label>
              <Input placeholder="Olá! Como posso ajudá-lo hoje?" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fora do Expediente</label>
              <Input placeholder="Estamos fora do horário de atendimento..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Transferência de Setor</label>
              <Input placeholder="Você está sendo transferido para..." />
            </div>
          </div>
        </div>

        {/* Horário de Expediente */}
        <div className="bg-card rounded-xl shadow-sm border p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Horário de Expediente</h3>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Início</label>
                <Input type="time" defaultValue="08:00" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Término</label>
                <Input type="time" defaultValue="18:00" />
              </div>
            </div>
            <div className="space-y-3">
              {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map((dia) => (
                <div key={dia} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{dia}</span>
                  <Switch defaultChecked={!['Sábado', 'Domingo'].includes(dia)} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Configurações Gerais */}
        <div className="bg-card rounded-xl shadow-sm border p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Globe className="w-5 h-5 text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Configurações Gerais</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Idioma do Sistema</label>
              <select className="w-full p-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent bg-background">
                <option>Português (Brasil)</option>
                <option>English (US)</option>
                <option>Español</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Notificações Sonoras</span>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Atualização Automática</span>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Modo Escuro</span>
              <Switch />
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button className="px-8">
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
}
