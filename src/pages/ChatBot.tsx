import { useState } from 'react';
import { Plus, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChatbotForm } from '@/components/chatbot/ChatbotForm';
import { ChatbotTable } from '@/components/chatbot/ChatbotTable';
import { EmptyState } from '@/components/chatbot/EmptyState';
import { ChatbotStateManager } from '@/components/admin/ChatbotStateManager';
import { ChatbotAnalytics } from '@/components/admin/ChatbotAnalytics';
import { useChatbotFlows, ChatbotFlow } from '@/hooks/useChatbotFlows';
export default function ChatBot() {
  const {
    flows,
    loading,
    deleteFlow,
    toggleFlowStatus,
    duplicateFlow
  } = useChatbotFlows();
  const [showForm, setShowForm] = useState(false);
  const [editingFlow, setEditingFlow] = useState<ChatbotFlow | null>(null);
  const handleEdit = (chatbot: ChatbotFlow) => {
    // Redirect to visual flow builder
    window.location.href = `/chatbot/flow-builder/${chatbot.id}`;
  };
  const handleDuplicate = async (chatbotId: string) => {
    await duplicateFlow(chatbotId);
  };
  const handleToggleStatus = async (chatbotId: string, currentStatus: string) => {
    await toggleFlowStatus(chatbotId, currentStatus);
  };
  const handleDelete = async (chatbotId: string) => {
    if (confirm('Tem certeza que deseja excluir este fluxo de chatbot?')) {
      await deleteFlow(chatbotId);
    }
  };
  const handleFormSubmit = (success: boolean) => {
    if (success) {
      setShowForm(false);
      setEditingFlow(null);
    }
  };
  const handleFormCancel = () => {
    setShowForm(false);
    setEditingFlow(null);
  };
  const handleCreateNew = () => {
    // Redirect to visual flow builder for new flow
    window.location.href = '/chatbot/flow-builder/new';
  };
  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amplie-primary mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando fluxos...</p>
        </div>
      </div>;
  }
  return <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          
          
        </div>
        <Button onClick={handleCreateNew} className="bg-amplie-primary hover:bg-amplie-primary-light">
          <Plus className="w-4 h-4 mr-2" />
          Novo Fluxo
        </Button>
      </div>

      <Tabs defaultValue="fluxos" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="fluxos">Fluxos</TabsTrigger>
          <TabsTrigger value="estados">Estados Ativos</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="configuracoes">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="fluxos" className="space-y-4">
          {flows.length === 0 ? <EmptyState onCreateNew={handleCreateNew} /> : <ChatbotTable chatbots={flows} onEdit={handleEdit} onDuplicate={handleDuplicate} onToggleStatus={handleToggleStatus} onDelete={handleDelete} />}
        </TabsContent>

        <TabsContent value="estados">
          <ChatbotStateManager />
        </TabsContent>

        <TabsContent value="analytics">
          <ChatbotAnalytics />
        </TabsContent>

        <TabsContent value="configuracoes" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Integrações</h3>
              <div className="space-y-2">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium">OpenAI (IA)</h4>
                  <p className="text-sm text-gray-600">Configure a chave da API para análise inteligente</p>
                  <p className="text-xs text-gray-500 mt-1">Status: ❓ Configure via Edge Functions</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium">CRM Integration</h4>
                  <p className="text-sm text-gray-600">Conecte com HubSpot, Salesforce ou Pipedrive</p>
                  <p className="text-xs text-gray-500 mt-1">Status: ❌ Não configurado</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium">Notificações</h4>
                  <p className="text-sm text-gray-600">Slack, Discord ou Email para alertas</p>
                  <p className="text-xs text-gray-500 mt-1">Status: ❌ Não configurado</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Configurações Avançadas</h3>
              <div className="space-y-2">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium">Tempo de Resposta</h4>
                  <p className="text-sm text-gray-600">Tempo máximo de espera por resposta</p>
                  <p className="text-xs text-gray-500 mt-1">Atual: 5 minutos</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium">Limpeza Automática</h4>
                  <p className="text-sm text-gray-600">Remove estados inativos automaticamente</p>
                  <p className="text-xs text-gray-500 mt-1">Atual: 24 horas</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium">Fallback Humano</h4>
                  <p className="text-sm text-gray-600">Transferir para humano após X tentativas</p>
                  <p className="text-xs text-gray-500 mt-1">Atual: 3 tentativas</p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              {editingFlow ? 'Editar Fluxo de Chatbot' : 'Criar Novo Fluxo'}
            </DialogTitle>
          </DialogHeader>
          
          <ChatbotForm flowId={editingFlow?.id} onSubmit={handleFormSubmit} onCancel={handleFormCancel} isEdit={!!editingFlow} />
        </DialogContent>
      </Dialog>
    </div>;
}