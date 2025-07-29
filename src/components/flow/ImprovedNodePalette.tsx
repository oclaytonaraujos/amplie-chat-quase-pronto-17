import { DragEvent, useState } from 'react'
import { MessageSquare, Image, Square, List, GitBranch, UserPlus, Bot } from 'lucide-react'
import { Clock, MapPin, User, BarChart3, FileText, Webhook, Keyboard, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const nodeTypes = [
  {
    type: 'textMessage',
    label: 'Mensagem de Texto',
    icon: MessageSquare,
    description: 'Enviar mensagem de texto simples',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    category: 'Mensagens'
  },
  {
    type: 'mediaMessage',
    label: 'Enviar Mídia',
    icon: Image,
    description: 'Enviar imagem, vídeo, documento ou áudio',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    category: 'Mensagens'
  },
  {
    type: 'template',
    label: 'Template WhatsApp',
    icon: FileText,
    description: 'Usar template aprovado do WhatsApp',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    category: 'Mensagens'
  },
  {
    type: 'buttonMessage',
    label: 'Botões de Resposta',
    icon: Square,
    description: 'Mensagem com até 3 botões de opção',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    category: 'Interação'
  },
  {
    type: 'listMessage',
    label: 'Lista de Opções',
    icon: List,
    description: 'Mensagem com lista de seleção',
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
    category: 'Interação'
  },
  {
    type: 'poll',
    label: 'Enquete',
    icon: BarChart3,
    description: 'Criar enquete interativa',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
    category: 'Interação'
  },
  {
    type: 'userInput',
    label: 'Entrada do Usuário',
    icon: Keyboard,
    description: 'Solicitar entrada de texto do usuário',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    category: 'Interação'
  },
  {
    type: 'location',
    label: 'Solicitar Localização',
    icon: MapPin,
    description: 'Solicitar localização do usuário',
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    category: 'Interação'
  },
  {
    type: 'contact',
    label: 'Solicitar Contato',
    icon: User,
    description: 'Solicitar compartilhamento de contato',
    color: 'text-violet-600',
    bgColor: 'bg-violet-50',
    category: 'Interação'
  },
  {
    type: 'conditional',
    label: 'Condicional',
    icon: GitBranch,
    description: 'Ramifica o fluxo baseado em condições',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    category: 'Lógica'
  },
  {
    type: 'delay',
    label: 'Aguardar',
    icon: Clock,
    description: 'Adicionar pausa no fluxo',
    color: 'text-slate-600',
    bgColor: 'bg-slate-50',
    category: 'Lógica'
  },
  {
    type: 'webhook',
    label: 'Webhook',
    icon: Webhook,
    description: 'Fazer chamada para API externa',
    color: 'text-rose-600',
    bgColor: 'bg-rose-50',
    category: 'Integração'
  },
  {
    type: 'transfer',
    label: 'Transferir para Setor',
    icon: UserPlus,
    description: 'Transfere conversa para equipe humana',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    category: 'Integração'
  },
  {
    type: 'aiAssistant',
    label: 'IA Provisória',
    icon: Bot,
    description: 'Assistente IA enquanto aguarda atendente',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    category: 'Integração'
  }
]

const categories = ['Mensagens', 'Interação', 'Lógica', 'Integração']

interface ImprovedNodePaletteProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function ImprovedNodePalette({ isOpen, onToggle }: ImprovedNodePaletteProps) {
  const [draggedNode, setDraggedNode] = useState<string | null>(null)

  const onDragStart = (event: DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType)
    event.dataTransfer.effectAllowed = 'move'
    setDraggedNode(nodeType)
  }

  const onDragEnd = () => {
    setDraggedNode(null)
  }

  return (
    <>
      {/* Sidebar */}
      <div 
        className={cn(
          "fixed left-0 top-0 h-full bg-background border-r shadow-lg z-40 transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{ width: '320px' }}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-4 border-b bg-muted/30">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-base text-foreground">Elementos do Fluxo</h3>
                <p className="text-xs text-muted-foreground mt-1">Arraste para o canvas</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggle}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {categories.map((category) => (
              <div key={category} className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline" className="text-xs font-medium">
                    {category}
                  </Badge>
                  <div className="flex-1 h-px bg-border" />
                </div>
                
                <div className="space-y-2">
                  {nodeTypes
                    .filter((nodeType) => nodeType.category === category)
                    .map((nodeType) => (
                      <div
                        key={nodeType.type}
                        className={cn(
                          "p-3 border border-border rounded-lg cursor-move transition-all duration-200",
                          "hover:border-primary/50 hover:shadow-sm active:scale-95",
                          "bg-card group",
                          draggedNode === nodeType.type && "opacity-50 scale-95"
                        )}
                        draggable
                        onDragStart={(event) => onDragStart(event, nodeType.type)}
                        onDragEnd={onDragEnd}
                      >
                        <div className="flex items-start gap-3">
                          <div 
                            className={cn(
                              "flex items-center justify-center w-10 h-10 rounded-lg transition-transform",
                              nodeType.bgColor,
                              "group-hover:scale-110"
                            )}
                          >
                            <nodeType.icon className={cn("h-5 w-5", nodeType.color)} />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-card-foreground mb-1">
                              {nodeType.label}
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {nodeType.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}

            {/* Tips */}
            <div className="mt-6 p-4 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border border-primary/20">
              <div className="text-xs text-primary/80 space-y-2">
                <p><strong>💡 Dicas:</strong></p>
                <ul className="space-y-1 ml-2">
                  <li>• Arraste elementos para criar nós</li>
                  <li>• Use Delete/Backspace para remover</li>
                  <li>• Conecte saídas às entradas</li>
                  <li>• Clique em um nó para configurar</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toggle Button - Always Visible */}
      {!isOpen && (
        <Button
          onClick={onToggle}
          className="fixed left-4 top-20 z-50 h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
          size="icon"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      )}

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={onToggle}
        />
      )}
    </>
  )
}