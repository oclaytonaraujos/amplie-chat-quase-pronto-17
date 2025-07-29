import { useState, useCallback, useRef, DragEvent, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ReactFlow, Controls, Background, useNodesState, useEdgesState, addEdge, Connection, Edge, Node, ReactFlowProvider, useReactFlow, BackgroundVariant, Panel, MiniMap } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { Plus, CheckCircle, AlertTriangle, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useFlowValidation } from '@/hooks/useFlowValidation';
import { useAutoSave } from '@/hooks/useAutoSave';
import { FlowValidationPanel } from '@/components/flow/FlowValidationPanel';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useChatbotFlows } from '@/hooks/useChatbotFlows';

// Custom Nodes
import { TextMessageNode } from '@/components/flow/nodes/TextMessageNode';
import { MediaMessageNode } from '@/components/flow/nodes/MediaMessageNode';
import { ButtonMessageNode } from '@/components/flow/nodes/ButtonMessageNode';
import { ListMessageNode } from '@/components/flow/nodes/ListMessageNode';
import { ConditionalNode } from '@/components/flow/nodes/ConditionalNode';
import { TransferNode } from '@/components/flow/nodes/TransferNode';
import { AIAssistantNode } from '@/components/flow/nodes/AIAssistantNode';
import { StartNode } from '@/components/flow/nodes/StartNode';
import { DelayNode } from '@/components/flow/nodes/DelayNode';
import { WebhookNode } from '@/components/flow/nodes/WebhookNode';
import { UserInputNode } from '@/components/flow/nodes/UserInputNode';
import { LocationNode } from '@/components/flow/nodes/LocationNode';
import { ContactNode } from '@/components/flow/nodes/ContactNode';
import { PollNode } from '@/components/flow/nodes/PollNode';
import { TemplateNode } from '@/components/flow/nodes/TemplateNode';

// Sidebar and Panel
import { ImprovedNodePalette } from '@/components/flow/ImprovedNodePalette';
import { ImprovedNodePropertiesPanel } from '@/components/flow/ImprovedNodePropertiesPanel';
import { FlowTestDialog } from '@/components/flow/FlowTestDialog';
import { WhatsAppConnectionSelector, MultiWhatsAppConnectionSelector } from '@/components/flow/WhatsAppConnectionSelector';
const nodeTypes = {
  start: StartNode,
  textMessage: TextMessageNode,
  mediaMessage: MediaMessageNode,
  buttonMessage: ButtonMessageNode,
  listMessage: ListMessageNode,
  conditional: ConditionalNode,
  transfer: TransferNode,
  aiAssistant: AIAssistantNode,
  delay: DelayNode,
  webhook: WebhookNode,
  userInput: UserInputNode,
  location: LocationNode,
  contact: ContactNode,
  poll: PollNode,
  template: TemplateNode
};
let id = 0;
const getId = () => `node_${id++}`;
function FlowBuilderComponent() {
  const {
    id: flowId
  } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    screenToFlowPosition,
    fitView
  } = useReactFlow();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [flowName, setFlowName] = useState('');
  const [selectedWhatsAppConnections, setSelectedWhatsAppConnections] = useState<string[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isValidationPanelOpen, setIsValidationPanelOpen] = useState(false);
  
  // Validação do fluxo
  const validation = useFlowValidation(nodes, edges);
  
  // Hook para gerenciar gatilhos
  const { updateFlowTriggers } = useChatbotFlows();
  
  // Auto-salvamento
  const autoSave = useAutoSave(nodes, edges, flowName, {
    enabled: flowId !== 'new',
    onSave: async (nodes, edges, name) => {
      if (flowId !== 'new') {
        await saveFlowMutation.mutateAsync();
      }
    },
    onError: (error) => {
      toast({
        title: 'Erro no auto-salvamento',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Fetch flow data
  const {
    data: flow,
    isLoading
  } = useQuery({
    queryKey: ['chatbot-flow', flowId],
    queryFn: async () => {
      if (flowId === 'new') return null;
      const {
        data,
        error
      } = await supabase.from('automations').select('*').eq('id', flowId).single();
      if (error) throw error;
      return data;
    },
    enabled: !!flowId
  });

  // Initialize flow when data is loaded
  useEffect(() => {
    if (flow) {
      setFlowName(flow.name);
      // Converter whatsapp_connection_id para array se existir
      const connectionIds = flow.whatsapp_connection_id ? [flow.whatsapp_connection_id] : [];
      setSelectedWhatsAppConnections(connectionIds);
      // Initialize with start node if no nodes exist
      if (nodes.length === 0) {
        const startNode: Node = {
          id: 'start',
          type: 'start',
          position: {
            x: 250,
            y: 50
          },
          data: {
            label: 'Início do Fluxo'
          }
        };
        setNodes([startNode]);
      }
    } else if (flowId === 'new' && nodes.length === 0) {
      // Create initial start node for new flows
      const startNode: Node = {
        id: 'start',
        type: 'start',
        position: {
          x: 250,
          y: 50
        },
        data: {
          label: 'Início do Fluxo'
        }
      };
      setNodes([startNode]);
    }
  }, [flow, flowId, nodes.length, setNodes]);

  // Save flow mutation
  const saveFlowMutation = useMutation({
    mutationFn: async () => {
      const flowData = {
        nodes,
        edges
      };
      if (flowId === 'new') {
        // Get user's company
        const {
          data: profile
        } = await supabase.from('profiles').select('empresa_id').eq('id', (await supabase.auth.getUser()).data.user?.id).single();

        // Create new flow
        const {
          data,
          error
        } = await supabase.from('chatbot_flows').insert({
          nome: flowName,
          mensagem_inicial: 'Olá! Como posso ajudar você hoje?',
          status: 'inativo',
          empresa_id: profile?.empresa_id
        }).select().single();
        if (error) throw error;
        return data;
      } else {
        // Update existing flow
        const {
          data,
          error
        } = await supabase.from('chatbot_flows').update({
          nome: flowName,
          updated_at: new Date().toISOString()
        }).eq('id', flowId).select().single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: data => {
      toast({
        title: 'Sucesso',
        description: 'Fluxo salvo com sucesso!'
      });
      
      setHasUnsavedChanges(false);
      autoSave.markAsSaved();

      // If it was a new flow, navigate to edit mode
      if (flowId === 'new' && data) {
        navigate(`/chatbot/flow-builder/${data.id}`, {
          replace: true
        });
      }
      queryClient.invalidateQueries({
        queryKey: ['chatbot-flow']
      });
    },
    onError: error => {
      toast({
        title: 'Erro',
        description: `Erro ao salvar fluxo: ${error.message}`,
        variant: 'destructive'
      });
    }
  });
  const onConnect = useCallback((params: Connection | Edge) => setEdges(eds => addEdge(params, eds)), [setEdges]);
  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);
  const onDrop = useCallback((event: DragEvent) => {
    event.preventDefault();
    const type = event.dataTransfer.getData('application/reactflow');
    if (typeof type === 'undefined' || !type) {
      return;
    }
    const position = screenToFlowPosition({
      x: event.clientX,
      y: event.clientY
    });
    const newNode: Node = {
      id: getId(),
      type,
      position,
      data: getDefaultNodeData(type)
    };
    setNodes(nds => nds.concat(newNode));
    // Fechar a paleta após arrastar um elemento
    setIsPaletteOpen(false);
  }, [screenToFlowPosition, setNodes]);
  const onNodeClick = useCallback((_: any, node: Node) => {
    setSelectedNode(node);
  }, []);
  const onNodesDelete = useCallback((nodesToDelete: Node[]) => {
    const nodeIds = nodesToDelete.map(node => node.id);
    // Remover arestas conectadas aos nós deletados
    setEdges(eds => eds.filter(edge => !nodeIds.includes(edge.source) && !nodeIds.includes(edge.target)));
    // Fechar painel de propriedades se o nó selecionado foi deletado
    if (selectedNode && nodeIds.includes(selectedNode.id)) {
      setSelectedNode(null);
    }
  }, [selectedNode]);
  const updateNodeData = useCallback((nodeId: string, newData: any) => {
    setNodes(nds => nds.map(node => node.id === nodeId ? {
      ...node,
      data: {
        ...node.data,
        ...newData
      }
    } : node));
    setHasUnsavedChanges(true);
  }, [setNodes]);
  
  const selectNodeFromValidation = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      setSelectedNode(node);
      setIsValidationPanelOpen(false);
    }
  }, [nodes]);
  const deleteNode = useCallback((nodeId: string) => {
    if (nodeId === 'start') return; // Não permitir deletar o nó inicial

    setNodes(nds => nds.filter(node => node.id !== nodeId));
    setEdges(eds => eds.filter(edge => edge.source !== nodeId && edge.target !== nodeId));
    if (selectedNode && selectedNode.id === nodeId) {
      setSelectedNode(null);
    }
  }, [selectedNode, setNodes, setEdges]);
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Carregando fluxo...</p>
        </div>
      </div>;
  }
  return <div className="h-screen flex flex-col bg-gradient-to-br from-background to-muted/20">
      {/* Enhanced Header */}
      <div className="border-b p-4 bg-background/95 backdrop-blur-sm shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/chatbot')} className="gap-2">
              ← Voltar
            </Button>
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${autoSave.hasUnsavedChanges ? 'bg-orange-500 animate-pulse' : 'bg-primary'}`}></div>
              <Input 
                value={flowName} 
                onChange={e => {
                  setFlowName(e.target.value)
                  setHasUnsavedChanges(true)
                }} 
                placeholder="Nome do seu fluxo de automação" 
                className="w-80 font-medium" 
              />
              
              <MultiWhatsAppConnectionSelector
                value={selectedWhatsAppConnections}
                onValueChange={(values) => {
                  setSelectedWhatsAppConnections(values);
                  setHasUnsavedChanges(true);
                }}
                placeholder="Selecione uma ou mais conexões"
              />
              
              {/* Indicador de validação */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsValidationPanelOpen(!isValidationPanelOpen);
                  setSelectedNode(null);
                }}
                className={`gap-2 ${validation.isValid ? 'text-green-600' : 'text-red-600'}`}
              >
                {validation.isValid ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertTriangle className="h-4 w-4" />
                )}
                <span className="text-xs">
                  {validation.isValid ? 'Válido' : `${validation.errorCount} erro${validation.errorCount !== 1 ? 's' : ''}`}
                </span>
              </Button>

              {/* Botão de Gatilhos - Desabilitado */}
              {flowId !== 'new' && (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled
                  className="gap-2 text-muted-foreground opacity-50"
                >
                  <Zap className="h-4 w-4" />
                  <span className="text-xs">Gatilhos (Em breve)</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Improved Node Palette */}
        <ImprovedNodePalette 
          isOpen={isPaletteOpen}
          onToggle={() => setIsPaletteOpen(!isPaletteOpen)}
        />

        {/* Flow Canvas */}
        <div 
          className={`flex-1 relative overflow-hidden transition-all duration-300 ${
            isPaletteOpen ? 'lg:ml-80' : 'ml-0'
          } ${selectedNode || isValidationPanelOpen ? 'lg:mr-96' : 'mr-0'}`}
          ref={reactFlowWrapper}
        >
          <ReactFlow 
            nodes={nodes} 
            edges={edges} 
            onNodesChange={onNodesChange} 
            onEdgesChange={onEdgesChange} 
            onConnect={onConnect} 
            onDrop={onDrop} 
            onDragOver={onDragOver} 
            onNodeClick={onNodeClick} 
            onNodesDelete={onNodesDelete} 
            nodeTypes={nodeTypes} 
            defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
            attributionPosition="bottom-left" 
            deleteKeyCode={['Delete', 'Backspace']} 
            className="bg-gradient-to-br from-background to-muted/10"
           >
             <Background variant={BackgroundVariant.Dots} gap={20} size={1} className="opacity-40" />
             <Controls 
               className="bg-background/80 backdrop-blur-sm border rounded-lg shadow-sm" 
               showZoom={false}
               showFitView={false}
               showInteractive={false}
             />
              <MiniMap 
                nodeColor={(node) => {
                  switch (node.type) {
                    case 'start': return 'hsl(var(--primary))';
                    case 'textMessage': return '#3b82f6';
                    case 'buttonMessage': return '#ea580c';
                    case 'conditional': return '#eab308';
                    case 'transfer': return '#dc2626';
                    default: return '#6b7280';
                  }
                }}
                className="bg-background/60 backdrop-blur-sm border rounded-lg shadow-sm opacity-70 hover:opacity-100 transition-opacity"
                style={{ 
                  width: 120, 
                  height: 80,
                  position: 'fixed',
                  top: '24px',
                  right: '24px',
                  zIndex: 40
                }}
                pannable
                zoomable
              />
           </ReactFlow>

          {/* Floating Action Buttons */}
          <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-50">
            <Button 
              onClick={() => saveFlowMutation.mutate()}
              disabled={saveFlowMutation.isPending}
              className="shadow-lg"
            >
              {saveFlowMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setIsTestDialogOpen(true)}
              className="shadow-lg"
            >
              Testar Fluxo
            </Button>
          </div>
        </div>

        {/* Enhanced Properties Panel */}
        {selectedNode && !isValidationPanelOpen && (
          <ImprovedNodePropertiesPanel 
            node={selectedNode} 
            onClose={() => setSelectedNode(null)} 
            onUpdateNode={updateNodeData} 
            onDeleteNode={deleteNode} 
          />
        )}
        
        {/* Validation Panel */}
        {isValidationPanelOpen && (
          <FlowValidationPanel
            issues={validation.issues}
            isValid={validation.isValid}
            errorCount={validation.errorCount}
            warningCount={validation.warningCount}
            infoCount={validation.infoCount}
            onClose={() => setIsValidationPanelOpen(false)}
            onNodeSelect={selectNodeFromValidation}
          />
        )}

      </div>

      {/* Flow Test Dialog */}
      <FlowTestDialog 
        open={isTestDialogOpen}
        onClose={() => setIsTestDialogOpen(false)}
        flowData={{ nodes, edges, flowName }}
      />
    </div>;
}
function getDefaultNodeData(type: string) {
  switch (type) {
    case 'textMessage':
      return {
        message: 'Digite sua mensagem aqui...',
        variables: []
      };
    case 'mediaMessage':
      return {
        mediaType: 'image',
        mediaUrl: '',
        caption: '',
        filename: ''
      };
    case 'buttonMessage':
      return {
        message: 'Escolha uma opção:',
        buttons: [{
          id: '1',
          text: 'Opção 1'
        }, {
          id: '2',
          text: 'Opção 2'
        }]
      };
    case 'listMessage':
      return {
        message: 'Selecione uma opção:',
        buttonText: 'Ver opções',
        sections: [{
          title: 'Seção 1',
          items: [{
            id: '1',
            title: 'Item 1',
            description: 'Descrição do item 1'
          }]
        }]
      };
    case 'conditional':
      return {
        variable: '{{ultima_resposta}}',
        condition: 'contains',
        value: 'sim',
        truePath: null,
        falsePath: null
      };
    case 'transfer':
      return {
        department: 'Suporte',
        message: 'Transferindo você para um atendente...'
      };
    case 'aiAssistant':
      return {
        prompt: 'Você é um assistente útil. Ajude o cliente enquanto ele aguarda.',
        timeout: 300,
        fallbackMessage: 'Vou transferir você para um atendente humano.'
      };
    case 'delay':
      return {
        duration: 2,
        unit: 'seconds',
        message: 'Aguarde...'
      };
    case 'webhook':
      return {
        url: '',
        method: 'POST',
        headers: {},
        payload: '{}',
        successMessage: 'Dados enviados com sucesso!',
        errorMessage: 'Erro ao processar solicitação.'
      };
    case 'userInput':
      return {
        inputType: 'text',
        prompt: 'Por favor, digite sua resposta:',
        validation: '',
        errorMessage: 'Entrada inválida. Tente novamente.'
      };
    case 'location':
      return {
        message: 'Por favor, compartilhe sua localização.',
        required: true
      };
    case 'contact':
      return {
        message: 'Compartilhe o contato desejado.',
        required: false
      };
    case 'poll':
      return {
        question: 'Qual sua preferência?',
        options: [{
          id: '1',
          text: 'Opção 1'
        }, {
          id: '2',
          text: 'Opção 2'
        }],
        multipleAnswers: false
      };
    case 'template':
      return {
        templateName: '',
        language: 'pt_BR',
        parameters: []
      };
    default:
      return {
        label: 'Nó configurável'
      };
  }
}
export default function FlowBuilder() {
  return <ReactFlowProvider>
      <FlowBuilderComponent />
    </ReactFlowProvider>;
}