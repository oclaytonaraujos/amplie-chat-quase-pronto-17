import { useState, useEffect } from 'react'
import { Node } from '@xyflow/react'
import { 
  X, Plus, Trash2, MessageSquare, Image, Square, List, GitBranch, 
  UserPlus, Bot, Clock, Webhook, Keyboard, MapPin, User, BarChart3, 
  FileText, AlertCircle, CheckCircle, Info
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface NodePropertiesPanelProps {
  node: Node
  onClose: () => void
  onUpdateNode: (nodeId: string, newData: any) => void
  onDeleteNode?: (nodeId: string) => void
}

const departmentOptions = [
  'Vendas',
  'Suporte Técnico', 
  'Financeiro',
  'Recursos Humanos',
  'Atendimento Geral'
]

export function NodePropertiesPanel({ node, onClose, onUpdateNode, onDeleteNode }: NodePropertiesPanelProps) {
  const [formData, setFormData] = useState(node.data)

  useEffect(() => {
    setFormData(node.data)
  }, [node])

  const handleSave = () => {
    onUpdateNode(node.id, formData)
    onClose()
  }

  const updateFormData = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const getNodeInfo = () => {
    const nodeTypes = {
      start: {
        title: 'Nó de Início',
        description: 'Ponto de partida do fluxo de automação',
        icon: <div className="w-5 h-5 rounded-full bg-primary" />,
        color: 'text-primary',
        category: 'Sistema'
      },
      textMessage: {
        title: 'Mensagem de Texto',
        description: 'Envie mensagens de texto personalizadas aos seus clientes',
        icon: <MessageSquare className="h-5 w-5" />,
        color: 'text-blue-600',
        category: 'Mensagem'
      },
      mediaMessage: {
        title: 'Enviar Mídia',
        description: 'Compartilhe imagens, vídeos, documentos ou áudios',
        icon: <Image className="h-5 w-5" />,
        color: 'text-purple-600',
        category: 'Mensagem'
      },
      buttonMessage: {
        title: 'Botões de Resposta',
        description: 'Ofereça até 3 opções clicáveis para interação',
        icon: <Square className="h-5 w-5" />,
        color: 'text-orange-600',
        category: 'Interação'
      },
      listMessage: {
        title: 'Lista de Opções',
        description: 'Apresente uma lista organizada de seleções',
        icon: <List className="h-5 w-5" />,
        color: 'text-teal-600',
        category: 'Interação'
      },
      conditional: {
        title: 'Condicional',
        description: 'Crie ramificações inteligentes baseadas em condições',
        icon: <GitBranch className="h-5 w-5" />,
        color: 'text-yellow-600',
        category: 'Lógica'
      },
      transfer: {
        title: 'Transferir para Setor',
        description: 'Transfira a conversa para atendimento humano especializado',
        icon: <UserPlus className="h-5 w-5" />,
        color: 'text-red-600',
        category: 'Integração'
      },
      aiAssistant: {
        title: 'IA Provisória',
        description: 'Assistente temporário enquanto aguarda atendente',
        icon: <Bot className="h-5 w-5" />,
        color: 'text-indigo-600',
        category: 'Integração'
      },
      delay: {
        title: 'Aguardar',
        description: 'Adicione pausas estratégicas para melhor experiência',
        icon: <Clock className="h-5 w-5" />,
        color: 'text-slate-600',
        category: 'Lógica'
      },
      webhook: {
        title: 'Webhook',
        description: 'Integre com sistemas externos via chamadas de API',
        icon: <Webhook className="h-5 w-5" />,
        color: 'text-rose-600',
        category: 'Integração'
      },
      userInput: {
        title: 'Entrada do Usuário',
        description: 'Colete informações específicas do cliente',
        icon: <Keyboard className="h-5 w-5" />,
        color: 'text-green-600',
        category: 'Interação'
      },
      location: {
        title: 'Solicitar Localização',
        description: 'Solicite que o usuário compartilhe sua localização',
        icon: <MapPin className="h-5 w-5" />,
        color: 'text-pink-600',
        category: 'Interação'
      },
      contact: {
        title: 'Solicitar Contato',
        description: 'Peça ao usuário para compartilhar um contato',
        icon: <User className="h-5 w-5" />,
        color: 'text-violet-600',
        category: 'Interação'
      },
      poll: {
        title: 'Enquete',
        description: 'Crie enquetes interativas para coleta de feedback',
        icon: <BarChart3 className="h-5 w-5" />,
        color: 'text-cyan-600',
        category: 'Interação'
      },
      template: {
        title: 'Template WhatsApp',
        description: 'Use templates pré-aprovados do WhatsApp Business',
        icon: <FileText className="h-5 w-5" />,
        color: 'text-emerald-600',
        category: 'Mensagem'
      }
    }

    return nodeTypes[node.type as keyof typeof nodeTypes] || {
      title: 'Nó Personalizado',
      description: 'Configure as propriedades deste nó',
      icon: <div className="w-5 h-5 rounded bg-muted" />,
      color: 'text-muted-foreground',
      category: 'Outros'
    }
  }

  const renderNodeSettings = () => {
    switch (node.type) {
      case 'start':
        return (
          <div className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Este é o ponto de partida do seu fluxo. Todo cliente que iniciar uma conversa começará aqui. 
                Conecte este nó ao primeiro elemento da sua automação.
              </AlertDescription>
            </Alert>
          </div>
        )

      case 'textMessage':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="message" className="text-sm font-medium">Mensagem de Texto</Label>
              <Textarea
                id="message"
                value={String(formData.message || '')}
                onChange={(e) => updateFormData('message', e.target.value)}
                placeholder="Digite a mensagem que será enviada ao cliente..."
                className="mt-2"
                rows={4}
              />
              <div className="mt-2 p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  💡 <strong>Dica:</strong> Use variáveis como {`{{nome_cliente}}`}, {`{{telefone}}`} para personalizar a mensagem
                </p>
              </div>
            </div>
          </div>
        )

      case 'mediaMessage':
        return (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Certifique-se de que a URL da mídia seja acessível publicamente e esteja em formato suportado.
              </AlertDescription>
            </Alert>
            
            <div>
              <Label htmlFor="mediaType">Tipo de Mídia</Label>
              <Select
                value={String(formData.mediaType || 'image')}
                onValueChange={(value) => updateFormData('mediaType', value)}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="image">📷 Imagem (JPG, PNG, GIF)</SelectItem>
                  <SelectItem value="video">🎥 Vídeo (MP4, 3GP)</SelectItem>
                  <SelectItem value="audio">🎵 Áudio (MP3, OGG, WAV)</SelectItem>
                  <SelectItem value="document">📄 Documento (PDF, DOC, etc)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="mediaUrl">URL da Mídia *</Label>
              <Input
                id="mediaUrl"
                value={String(formData.mediaUrl || '')}
                onChange={(e) => updateFormData('mediaUrl', e.target.value)}
                placeholder="https://exemplo.com/arquivo.jpg"
                className="mt-2"
              />
            </div>
            
            <div>
              <Label htmlFor="caption">Legenda (opcional)</Label>
              <Textarea
                id="caption"
                value={String(formData.caption || '')}
                onChange={(e) => updateFormData('caption', e.target.value)}
                placeholder="Adicione uma legenda descritiva..."
                className="mt-2"
                rows={2}
              />
            </div>
          </div>
        )

      case 'buttonMessage':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="message">Mensagem Principal</Label>
              <Textarea
                id="message"
                value={String(formData.message || '')}
                onChange={(e) => updateFormData('message', e.target.value)}
                placeholder="Digite a mensagem com as opções..."
                className="mt-2"
                rows={3}
              />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label>Botões de Ação</Label>
                <Badge variant="secondary">Máximo 3 botões</Badge>
              </div>
              
              <div className="space-y-3">
                {(Array.isArray(formData.buttons) ? formData.buttons : []).map((button: any, index: number) => (
                  <div key={index} className="flex gap-2 items-center p-3 border rounded-lg bg-muted/30">
                    <span className="text-sm font-medium text-muted-foreground w-6">{index + 1}.</span>
                    <Input
                      value={button.text || ''}
                      onChange={(e) => {
                        const newButtons = [...(Array.isArray(formData.buttons) ? formData.buttons : [])]
                        newButtons[index] = { ...button, text: e.target.value }
                        updateFormData('buttons', newButtons)
                      }}
                      placeholder={`Texto do botão ${index + 1}`}
                      className="flex-1"
                    />
                    {Array.isArray(formData.buttons) && formData.buttons.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newButtons = Array.isArray(formData.buttons) ? formData.buttons.filter((_: any, i: number) => i !== index) : []
                          updateFormData('buttons', newButtons)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                
                {(!Array.isArray(formData.buttons) || formData.buttons.length < 3) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newButtons = [...(Array.isArray(formData.buttons) ? formData.buttons : []), { id: Date.now().toString(), text: '' }]
                      updateFormData('buttons', newButtons)
                    }}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Botão
                  </Button>
                )}
              </div>
            </div>
          </div>
        )

      case 'listMessage':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="message">Mensagem Principal</Label>
              <Textarea
                id="message"
                value={String(formData.message || '')}
                onChange={(e) => updateFormData('message', e.target.value)}
                placeholder="Selecione uma opção da lista abaixo:"
                className="mt-2"
                rows={2}
              />
            </div>
            
            <div>
              <Label htmlFor="buttonText">Texto do Botão da Lista</Label>
              <Input
                id="buttonText"
                value={String(formData.buttonText || '')}
                onChange={(e) => updateFormData('buttonText', e.target.value)}
                placeholder="Ver opções"
                className="mt-2"
              />
            </div>
            
            <div>
              <Label>Seções da Lista</Label>
              <div className="space-y-4 mt-3">
                {(Array.isArray(formData.sections) ? formData.sections : []).map((section: any, sectionIndex: number) => (
                  <Card key={sectionIndex} className="p-4">
                    <div className="flex gap-2 items-center mb-3">
                      <Input
                        value={section.title || ''}
                        onChange={(e) => {
                          const newSections = [...(Array.isArray(formData.sections) ? formData.sections : [])]
                          newSections[sectionIndex] = { ...section, title: e.target.value }
                          updateFormData('sections', newSections)
                        }}
                        placeholder={`Título da seção ${sectionIndex + 1}`}
                        className="flex-1 font-medium"
                      />
                      {Array.isArray(formData.sections) && formData.sections.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newSections = Array.isArray(formData.sections) ? formData.sections.filter((_: any, i: number) => i !== sectionIndex) : []
                            updateFormData('sections', newSections)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm">Itens da seção</Label>
                      {(Array.isArray(section.items) ? section.items : []).map((item: any, itemIndex: number) => (
                        <div key={itemIndex} className="flex gap-2 items-start p-2 border rounded bg-muted/20">
                          <div className="flex-1 space-y-2">
                            <Input
                              value={item.title || ''}
                              onChange={(e) => {
                                const newSections = [...(Array.isArray(formData.sections) ? formData.sections : [])]
                                const newItems = [...(Array.isArray(section.items) ? section.items : [])]
                                newItems[itemIndex] = { ...item, title: e.target.value }
                                newSections[sectionIndex] = { ...section, items: newItems }
                                updateFormData('sections', newSections)
                              }}
                              placeholder={`Título do item ${itemIndex + 1}`}
                              className="text-sm"
                            />
                            <Input
                              value={item.description || ''}
                              onChange={(e) => {
                                const newSections = [...(Array.isArray(formData.sections) ? formData.sections : [])]
                                const newItems = [...(Array.isArray(section.items) ? section.items : [])]
                                newItems[itemIndex] = { ...item, description: e.target.value }
                                newSections[sectionIndex] = { ...section, items: newItems }
                                updateFormData('sections', newSections)
                              }}
                              placeholder="Descrição (opcional)"
                              className="text-sm"
                            />
                          </div>
                          {Array.isArray(section.items) && section.items.length > 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const newSections = [...(Array.isArray(formData.sections) ? formData.sections : [])]
                                const newItems = Array.isArray(section.items) ? section.items.filter((_: any, i: number) => i !== itemIndex) : []
                                newSections[sectionIndex] = { ...section, items: newItems }
                                updateFormData('sections', newSections)
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newSections = [...(Array.isArray(formData.sections) ? formData.sections : [])]
                          const newItems = [...(Array.isArray(section.items) ? section.items : []), { id: Date.now().toString(), title: '', description: '' }]
                          newSections[sectionIndex] = { ...section, items: newItems }
                          updateFormData('sections', newSections)
                        }}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Item
                      </Button>
                    </div>
                  </Card>
                ))}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newSections = [...(Array.isArray(formData.sections) ? formData.sections : []), { 
                      title: '', 
                      items: [{ id: Date.now().toString(), title: '', description: '' }] 
                    }]
                    updateFormData('sections', newSections)
                  }}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Seção
                </Button>
              </div>
            </div>
          </div>
        )

      case 'conditional':
        return (
          <div className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Use condicionais para criar diferentes caminhos no fluxo baseados na resposta do usuário.
              </AlertDescription>
            </Alert>
            
            <div>
              <Label htmlFor="variable">Variável para Comparação</Label>
              <Input
                id="variable"
                value={String(formData.variable || '')}
                onChange={(e) => updateFormData('variable', e.target.value)}
                placeholder="{{ultima_resposta}}"
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use variáveis como {`{{ultima_resposta}}`}, {`{{nome_cliente}}`}, etc.
              </p>
            </div>
            
            <div>
              <Label htmlFor="condition">Tipo de Condição</Label>
              <Select
                value={String(formData.condition || 'contains')}
                onValueChange={(value) => updateFormData('condition', value)}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contains">📍 Contém o texto</SelectItem>
                  <SelectItem value="equals">🎯 É exatamente igual a</SelectItem>
                  <SelectItem value="starts_with">▶️ Começa com</SelectItem>
                  <SelectItem value="ends_with">⏹️ Termina com</SelectItem>
                  <SelectItem value="not_contains">❌ Não contém</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="value">Valor de Comparação</Label>
              <Input
                id="value"
                value={String(formData.value || '')}
                onChange={(e) => updateFormData('value', e.target.value)}
                placeholder="sim"
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                O valor que será comparado com a variável
              </p>
            </div>
          </div>
        )

      case 'transfer':
        return (
          <div className="space-y-4">
            <Alert>
              <UserPlus className="h-4 w-4" />
              <AlertDescription>
                Ao usar este nó, a conversa será transferida para um atendente humano do setor selecionado.
              </AlertDescription>
            </Alert>
            
            <div>
              <Label htmlFor="department">Setor de Destino</Label>
              <Select
                value={String(formData.department || '')}
                onValueChange={(value) => updateFormData('department', value)}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Selecione um setor" />
                </SelectTrigger>
                <SelectContent>
                  {departmentOptions.map(dept => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="message">Mensagem de Transferência</Label>
              <Textarea
                id="message"
                value={String(formData.message || '')}
                onChange={(e) => updateFormData('message', e.target.value)}
                placeholder="Transferindo você para nosso time de atendimento especializado..."
                className="mt-2"
                rows={2}
              />
            </div>
          </div>
        )

      case 'delay':
        return (
          <div className="space-y-4">
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                Use pausas para simular tempo de digitação ou criar uma experiência mais natural.
              </AlertDescription>
            </Alert>
            
            <div>
              <Label htmlFor="duration">Duração</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="duration"
                  type="number"
                  value={Number(formData.duration) || 2}
                  onChange={(e) => updateFormData('duration', parseInt(e.target.value) || 2)}
                  className="flex-1"
                  min={1}
                  max={300}
                />
                <Select
                  value={String(formData.unit || 'seconds')}
                  onValueChange={(value) => updateFormData('unit', value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="seconds">Segundos</SelectItem>
                    <SelectItem value="minutes">Minutos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="message">Mensagem Durante Espera (opcional)</Label>
              <Input
                id="message"
                value={String(formData.message || '')}
                onChange={(e) => updateFormData('message', e.target.value)}
                placeholder="Aguarde um momento..."
                className="mt-2"
              />
            </div>
          </div>
        )

      case 'userInput':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="inputType">Tipo de Entrada</Label>
              <Select
                value={String(formData.inputType || 'text')}
                onValueChange={(value) => updateFormData('inputType', value)}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">📝 Texto livre</SelectItem>
                  <SelectItem value="number">🔢 Número</SelectItem>
                  <SelectItem value="email">📧 E-mail</SelectItem>
                  <SelectItem value="phone">📱 Telefone</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="prompt">Pergunta/Solicitação</Label>
              <Textarea
                id="prompt"
                value={String(formData.prompt || '')}
                onChange={(e) => updateFormData('prompt', e.target.value)}
                placeholder="Por favor, digite seu nome completo:"
                className="mt-2"
                rows={2}
              />
            </div>
            
            <div>
              <Label htmlFor="validation">Validação (regex - opcional)</Label>
              <Input
                id="validation"
                value={String(formData.validation || '')}
                onChange={(e) => updateFormData('validation', e.target.value)}
                placeholder="^[a-zA-Z\s]+$"
                className="mt-2"
              />
            </div>
            
            <div>
              <Label htmlFor="errorMessage">Mensagem de Erro</Label>
              <Input
                id="errorMessage"
                value={String(formData.errorMessage || '')}
                onChange={(e) => updateFormData('errorMessage', e.target.value)}
                placeholder="Formato inválido. Tente novamente."
                className="mt-2"
              />
            </div>
          </div>
        )

      case 'webhook':
        return (
          <div className="space-y-4">
            <Alert>
              <Webhook className="h-4 w-4" />
              <AlertDescription>
                Configure webhooks para integrar com sistemas externos e trocar dados em tempo real.
              </AlertDescription>
            </Alert>
            
            <div>
              <Label htmlFor="url">URL do Webhook *</Label>
              <Input
                id="url"
                value={String(formData.url || '')}
                onChange={(e) => updateFormData('url', e.target.value)}
                placeholder="https://api.exemplo.com/webhook"
                className="mt-2"
              />
            </div>
            
            <div>
              <Label htmlFor="method">Método HTTP</Label>
              <Select
                value={String(formData.method || 'POST')}
                onValueChange={(value) => updateFormData('method', value)}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="PATCH">PATCH</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="payload">Dados (JSON)</Label>
              <Textarea
                id="payload"
                value={String(formData.payload || '')}
                onChange={(e) => updateFormData('payload', e.target.value)}
                placeholder='{"client_phone": "{{telefone}}", "message": "{{ultima_resposta}}"}'
                className="mt-2"
                rows={4}
              />
            </div>
          </div>
        )

      case 'location':
        return (
          <div className="space-y-4">
            <Alert>
              <MapPin className="h-4 w-4" />
              <AlertDescription>
                Solicita que o cliente compartilhe sua localização via WhatsApp.
              </AlertDescription>
            </Alert>
            
            <div>
              <Label htmlFor="message">Mensagem de Solicitação</Label>
              <Textarea
                id="message"
                value={String(formData.message || '')}
                onChange={(e) => updateFormData('message', e.target.value)}
                placeholder="Por favor, compartilhe sua localização para que possamos te ajudar melhor."
                className="mt-2"
                rows={2}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="required"
                checked={Boolean(formData.required)}
                onChange={(e) => updateFormData('required', e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="required" className="text-sm">
                Localização obrigatória para continuar
              </Label>
            </div>
          </div>
        )

      case 'contact':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="message">Mensagem de Solicitação</Label>
              <Textarea
                id="message"
                value={String(formData.message || '')}
                onChange={(e) => updateFormData('message', e.target.value)}
                placeholder="Compartilhe o contato da pessoa que você gostaria de indicar."
                className="mt-2"
                rows={2}
              />
            </div>
          </div>
        )

      case 'poll':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="question">Pergunta da Enquete</Label>
              <Input
                id="question"
                value={String(formData.question || '')}
                onChange={(e) => updateFormData('question', e.target.value)}
                placeholder="Qual sua preferência?"
                className="mt-2"
              />
            </div>
            
            <div>
              <Label>Opções da Enquete</Label>
              <div className="space-y-2 mt-2">
                {(Array.isArray(formData.options) ? formData.options : []).map((option: any, index: number) => (
                  <div key={index} className="flex gap-2 items-center">
                    <Input
                      value={option.text || ''}
                      onChange={(e) => {
                        const newOptions = [...(Array.isArray(formData.options) ? formData.options : [])]
                        newOptions[index] = { ...option, text: e.target.value }
                        updateFormData('options', newOptions)
                      }}
                      placeholder={`Opção ${index + 1}`}
                      className="flex-1"
                    />
                    {Array.isArray(formData.options) && formData.options.length > 2 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newOptions = Array.isArray(formData.options) ? formData.options.filter((_: any, i: number) => i !== index) : []
                          updateFormData('options', newOptions)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newOptions = [...(Array.isArray(formData.options) ? formData.options : []), { id: Date.now().toString(), text: '' }]
                    updateFormData('options', newOptions)
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Opção
                </Button>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="multipleAnswers"
                checked={Boolean(formData.multipleAnswers)}
                onChange={(e) => updateFormData('multipleAnswers', e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="multipleAnswers" className="text-sm">
                Permitir múltiplas respostas
              </Label>
            </div>
          </div>
        )

      case 'template':
        return (
          <div className="space-y-4">
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                Templates devem estar pré-aprovados pelo WhatsApp Business. Use apenas templates já cadastrados.
              </AlertDescription>
            </Alert>
            
            <div>
              <Label htmlFor="templateName">Nome do Template</Label>
              <Input
                id="templateName"
                value={String(formData.templateName || '')}
                onChange={(e) => updateFormData('templateName', e.target.value)}
                placeholder="nome_do_template"
                className="mt-2"
              />
            </div>
            
            <div>
              <Label htmlFor="language">Idioma</Label>
              <Select
                value={String(formData.language || 'pt_BR')}
                onValueChange={(value) => updateFormData('language', value)}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt_BR">🇧🇷 Português (Brasil)</SelectItem>
                  <SelectItem value="en_US">🇺🇸 Inglês (EUA)</SelectItem>
                  <SelectItem value="es_ES">🇪🇸 Espanhol</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Parâmetros do Template</Label>
              <div className="space-y-2 mt-2">
                {(Array.isArray(formData.parameters) ? formData.parameters : []).map((param: any, index: number) => (
                  <div key={index} className="flex gap-2 items-center">
                    <Input
                      value={param.value || ''}
                      onChange={(e) => {
                        const newParams = [...(Array.isArray(formData.parameters) ? formData.parameters : [])]
                        newParams[index] = { ...param, value: e.target.value }
                        updateFormData('parameters', newParams)
                      }}
                      placeholder={`Parâmetro ${index + 1}`}
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newParams = Array.isArray(formData.parameters) ? formData.parameters.filter((_: any, i: number) => i !== index) : []
                        updateFormData('parameters', newParams)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newParams = [...(Array.isArray(formData.parameters) ? formData.parameters : []), { value: '' }]
                    updateFormData('parameters', newParams)
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Parâmetro
                </Button>
              </div>
            </div>
          </div>
        )

      default:
        return (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Nenhuma configuração disponível para este tipo de nó.
            </AlertDescription>
          </Alert>
        )
    }
  }

  const nodeInfo = getNodeInfo()

  return (
    <div className="w-96 bg-background border-l border-border overflow-y-auto">
      {/* Header */}
      <div className="p-6 border-b border-border bg-gradient-to-r from-muted/30 to-muted/10">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg bg-background border-2 ${nodeInfo.color}`}>
            {nodeInfo.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-lg">{nodeInfo.title}</h3>
              <Badge variant="secondary" className="text-xs">
                {nodeInfo.category}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {nodeInfo.description}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              ⚙️ Configurações
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderNodeSettings()}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-6 pt-4 border-t border-border">
          <Button variant="outline" size="sm" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button size="sm" onClick={handleSave} className="flex-1">
            <CheckCircle className="h-4 w-4 mr-2" />
            Salvar
          </Button>
          {node.id !== 'start' && onDeleteNode && (
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={() => onDeleteNode(node.id)}
              className="flex-1"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}