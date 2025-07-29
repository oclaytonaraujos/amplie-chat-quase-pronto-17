import { DragEvent } from 'react'
import { MessageSquare, Image, Square, List, GitBranch, UserPlus, Bot } from 'lucide-react'
import { Clock, MapPin, User, BarChart3, FileText, Webhook, Keyboard } from 'lucide-react'
import { Button } from '@/components/ui/button'

const nodeTypes = [
  {
    type: 'textMessage',
    label: 'Mensagem de Texto',
    icon: MessageSquare,
    description: 'Enviar mensagem de texto simples',
    color: 'text-blue-600',
    category: 'Mensagens'
  },
  {
    type: 'mediaMessage',
    label: 'Enviar Mídia',
    icon: Image,
    description: 'Enviar imagem, vídeo, documento ou áudio',
    color: 'text-purple-600',
    category: 'Mensagens'
  },
  {
    type: 'buttonMessage',
    label: 'Botões de Resposta',
    icon: Square,
    description: 'Mensagem com até 3 botões de opção',
    color: 'text-orange-600',
    category: 'Interação'
  },
  {
    type: 'listMessage',
    label: 'Lista de Opções',
    icon: List,
    description: 'Mensagem com lista de seleção',
    color: 'text-teal-600',
    category: 'Interação'
  },
  {
    type: 'poll',
    label: 'Enquete',
    icon: BarChart3,
    description: 'Criar enquete interativa',
    color: 'text-cyan-600',
    category: 'Interação'
  },
  {
    type: 'userInput',
    label: 'Entrada do Usuário',
    icon: Keyboard,
    description: 'Solicitar entrada de texto do usuário',
    color: 'text-green-600',
    category: 'Interação'
  },
  {
    type: 'location',
    label: 'Solicitar Localização',
    icon: MapPin,
    description: 'Solicitar localização do usuário',
    color: 'text-pink-600',
    category: 'Interação'
  },
  {
    type: 'contact',
    label: 'Solicitar Contato',
    icon: User,
    description: 'Solicitar compartilhamento de contato',
    color: 'text-violet-600',
    category: 'Interação'
  },
  {
    type: 'template',
    label: 'Template WhatsApp',
    icon: FileText,
    description: 'Usar template aprovado do WhatsApp',
    color: 'text-emerald-600',
    category: 'Mensagens'
  },
  {
    type: 'conditional',
    label: 'Condicional',
    icon: GitBranch,
    description: 'Ramifica o fluxo baseado em condições',
    color: 'text-yellow-600',
    category: 'Lógica'
  },
  {
    type: 'delay',
    label: 'Aguardar',
    icon: Clock,
    description: 'Adicionar pausa no fluxo',
    color: 'text-slate-600',
    category: 'Lógica'
  },
  {
    type: 'webhook',
    label: 'Webhook',
    icon: Webhook,
    description: 'Fazer chamada para API externa',
    color: 'text-rose-600',
    category: 'Integração'
  },
  {
    type: 'transfer',
    label: 'Transferir para Setor',
    icon: UserPlus,
    description: 'Transfere conversa para equipe humana',
    color: 'text-red-600',
    category: 'Integração'
  },
  {
    type: 'aiAssistant',
    label: 'IA Provisória',
    icon: Bot,
    description: 'Assistente IA enquanto aguarda atendente',
    color: 'text-indigo-600',
    category: 'Integração'
  }
]

const categories = ['Mensagens', 'Interação', 'Lógica', 'Integração']

interface NodePaletteProps {
  onClose?: () => void;
}

export function NodePalette({ onClose }: NodePaletteProps = {}) {
  const onDragStart = (event: DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType)
    event.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div className="w-80 bg-background border-r p-4 overflow-y-auto max-h-screen">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm text-foreground">Elementos do Fluxo</h3>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            ✕
          </Button>
        )}
      </div>
      
      {categories.map((category) => (
        <div key={category} className="mb-6">
          <h4 className="font-medium text-xs text-muted-foreground mb-3 uppercase tracking-wider">
            {category}
          </h4>
          <div className="space-y-2">
            {nodeTypes
              .filter((nodeType) => nodeType.category === category)
              .map((nodeType) => (
                <div
                  key={nodeType.type}
                  className="p-3 border border-border rounded-lg cursor-move hover:bg-muted/50 transition-colors bg-card group"
                  draggable
                  onDragStart={(event) => onDragStart(event, nodeType.type)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-muted ${nodeType.color} group-hover:scale-110 transition-transform`}>
                      <nodeType.icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm text-card-foreground">{nodeType.label}</div>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {nodeType.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      ))}
      
      <div className="mt-6 p-4 bg-muted/30 rounded-lg">
        <p className="text-xs text-muted-foreground">
          💡 <strong>Dica:</strong> Arraste os elementos para o canvas. Use Delete/Backspace para remover nós. Conecte as saídas dos botões/opções às entradas de outros nós.
        </p>
      </div>
    </div>
  )
}