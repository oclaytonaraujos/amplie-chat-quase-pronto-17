import { useState, useRef, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Send, Bot, User } from 'lucide-react'

interface Message {
  id: string
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
  buttons?: { id: string; text: string }[]
  listItems?: { id: string; title: string; description?: string }[]
}

interface FlowTestDialogProps {
  open: boolean
  onClose: () => void
  flowData: {
    nodes: any[]
    edges: any[]
    flowName: string
  }
}

export function FlowTestDialog({ open, onClose, flowData }: FlowTestDialogProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [currentNodeId, setCurrentNodeId] = useState<string>('start')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (open) {
      // Inicializar conversa com mensagem de boas-vindas
      const startNode = flowData.nodes.find(node => node.id === 'start')
      if (startNode) {
        setMessages([{
          id: '1',
          text: 'Olá! Bem-vindo ao teste do fluxo de automação. Como posso ajudar você hoje?',
          sender: 'bot',
          timestamp: new Date()
        }])
        setCurrentNodeId('start')
      }
    } else {
      // Limpar ao fechar
      setMessages([])
      setInputValue('')
      setCurrentNodeId('start')
    }
  }, [open, flowData])

  const findNextNode = (fromNodeId: string, userInput?: string, buttonId?: string) => {
    const edges = flowData.edges.filter(edge => edge.source === fromNodeId)
    
    if (buttonId) {
      // Buscar edge específica para o botão
      const buttonEdge = edges.find(edge => edge.sourceHandle === buttonId)
      if (buttonEdge) {
        return flowData.nodes.find(node => node.id === buttonEdge.target)
      }
    }
    
    // Se não encontrou por botão, pegar a primeira edge disponível
    if (edges.length > 0) {
      return flowData.nodes.find(node => node.id === edges[0].target)
    }
    
    return null
  }

  const processNodeResponse = (node: any) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text: '',
      sender: 'bot',
      timestamp: new Date()
    }

    switch (node.type) {
      case 'textMessage':
        newMessage.text = node.data.message || 'Mensagem de texto'
        break
      
      case 'buttonMessage':
        newMessage.text = node.data.message || 'Escolha uma opção:'
        newMessage.buttons = node.data.buttons || [
          { id: '1', text: 'Opção 1' },
          { id: '2', text: 'Opção 2' }
        ]
        break
      
      case 'listMessage':
        newMessage.text = node.data.message || 'Selecione uma opção:'
        newMessage.listItems = (node.data.sections || []).flatMap((section: any) => 
          section.items || []
        )
        break
      
      case 'mediaMessage':
        newMessage.text = `📁 ${node.data.mediaType?.toUpperCase() || 'MÍDIA'}: ${node.data.caption || 'Arquivo enviado'}`
        break
      
      case 'userInput':
        newMessage.text = node.data.prompt || 'Por favor, digite sua resposta:'
        break
      
      case 'location':
        newMessage.text = node.data.message || 'Por favor, compartilhe sua localização.'
        break
      
      case 'contact':
        newMessage.text = node.data.message || 'Compartilhe o contato desejado.'
        break
      
      case 'poll':
        newMessage.text = node.data.question || 'Responda a enquete:'
        newMessage.buttons = node.data.options || [
          { id: '1', text: 'Opção 1' },
          { id: '2', text: 'Opção 2' }
        ]
        break
      
      case 'delay':
        newMessage.text = node.data.message || 'Aguarde um momento...'
        break
      
      case 'transfer':
        newMessage.text = `🔄 ${node.data.message || 'Transferindo você para um atendente humano...'}`
        break
      
      case 'aiAssistant':
        newMessage.text = '🤖 Assistente IA ativado. Como posso ajudar enquanto você aguarda?'
        break
      
      default:
        newMessage.text = 'Nó não implementado no teste'
    }

    return newMessage
  }

  const handleSendMessage = () => {
    if (!inputValue.trim()) return

    // Adicionar mensagem do usuário
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')

    // Processar próximo nó
    setTimeout(() => {
      const nextNode = findNextNode(currentNodeId, inputValue)
      if (nextNode) {
        const botMessage = processNodeResponse(nextNode)
        setMessages(prev => [...prev, botMessage])
        setCurrentNodeId(nextNode.id)
      } else {
        // Fim do fluxo
        const endMessage: Message = {
          id: Date.now().toString(),
          text: '✅ Fim do fluxo de teste. Obrigado por testar!',
          sender: 'bot',
          timestamp: new Date()
        }
        setMessages(prev => [...prev, endMessage])
      }
    }, 500)
  }

  const handleButtonClick = (buttonId: string, buttonText: string) => {
    // Adicionar mensagem do usuário com a opção selecionada
    const userMessage: Message = {
      id: Date.now().toString(),
      text: buttonText,
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])

    // Processar próximo nó baseado no botão clicado
    setTimeout(() => {
      const nextNode = findNextNode(currentNodeId, buttonText, `button-${buttonId}`)
      if (nextNode) {
        const botMessage = processNodeResponse(nextNode)
        setMessages(prev => [...prev, botMessage])
        setCurrentNodeId(nextNode.id)
      } else {
        // Fim do fluxo
        const endMessage: Message = {
          id: Date.now().toString(),
          text: '✅ Fim do fluxo de teste. Obrigado por testar!',
          sender: 'bot',
          timestamp: new Date()
        }
        setMessages(prev => [...prev, endMessage])
      }
    }, 500)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md h-[600px] flex flex-col p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            🧪 Teste do Fluxo: {flowData.flowName || 'Sem nome'}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.sender === 'bot' && (
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <Bot className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div className={`max-w-[80%] ${message.sender === 'user' ? 'order-first' : ''}`}>
                  <div
                    className={`p-3 rounded-lg ${
                      message.sender === 'user'
                        ? 'bg-primary text-primary-foreground ml-auto'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm">{message.text}</p>
                    
                    {/* Botões de resposta */}
                    {message.buttons && message.sender === 'bot' && (
                      <div className="mt-3 space-y-2">
                        {message.buttons.map((button) => (
                          <Button
                            key={button.id}
                            variant="outline"
                            size="sm"
                            className="w-full text-left justify-start"
                            onClick={() => handleButtonClick(button.id, button.text)}
                          >
                            {button.text}
                          </Button>
                        ))}
                      </div>
                    )}
                    
                    {/* Lista de opções */}
                    {message.listItems && message.sender === 'bot' && (
                      <div className="mt-3 space-y-2">
                        {message.listItems.map((item) => (
                          <Button
                            key={item.id}
                            variant="outline"
                            size="sm"
                            className="w-full text-left justify-start flex-col items-start h-auto py-2"
                            onClick={() => handleButtonClick(item.id, item.title)}
                          >
                            <span className="font-medium">{item.title}</span>
                            {item.description && (
                              <span className="text-xs text-muted-foreground">{item.description}</span>
                            )}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <p className="text-xs text-muted-foreground mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
                
                {message.sender === 'user' && (
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-secondary">
                      <User className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
          </div>
          <div ref={messagesEndRef} />
        </ScrollArea>

        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Digite sua mensagem..."
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1"
            />
            <Button onClick={handleSendMessage} size="icon">
              <Send className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="mt-2 flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setMessages([{
                  id: '1',
                  text: 'Olá! Bem-vindo ao teste do fluxo de automação. Como posso ajudar você hoje?',
                  sender: 'bot',
                  timestamp: new Date()
                }])
                setCurrentNodeId('start')
              }}
              className="text-xs"
            >
              🔄 Reiniciar Teste
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-xs"
            >
              ✖️ Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}