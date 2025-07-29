import { useState, useEffect } from 'react'
import { Node } from '@xyflow/react'
import { 
  X, Plus, Trash2, MessageSquare, Image, Square, List, GitBranch, 
  UserPlus, Bot, Clock, Webhook, Keyboard, MapPin, User, BarChart3, 
  FileText, AlertCircle, CheckCircle, Info, Save, Upload, Link, 
  Settings, PlayCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

interface ImprovedNodePropertiesPanelProps {
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

export function ImprovedNodePropertiesPanel({ 
  node, 
  onClose, 
  onUpdateNode, 
  onDeleteNode 
}: ImprovedNodePropertiesPanelProps) {
  const [formData, setFormData] = useState(node.data)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  useEffect(() => {
    setFormData(node.data)
    setHasUnsavedChanges(false)
  }, [node])

  const handleSave = () => {
    onUpdateNode(node.id, formData)
    setHasUnsavedChanges(false)
  }

  const updateFormData = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }))
    setHasUnsavedChanges(true)
  }

  const getNodeInfo = () => {
    const nodeTypes = {
      start: {
        title: 'Nó de Início',
        description: 'Ponto de partida do fluxo de automação',
        icon: <div className="w-5 h-5 rounded-full bg-primary" />,
        color: 'text-primary',
        bgColor: 'bg-primary/10',
        category: 'Sistema'
      },
      textMessage: {
        title: 'Mensagem de Texto',
        description: 'Envie mensagens de texto personalizadas',
        icon: <MessageSquare className="h-5 w-5" />,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        category: 'Mensagem'
      },
      mediaMessage: {
        title: 'Enviar Mídia',
        description: 'Compartilhe imagens, vídeos, documentos',
        icon: <Image className="h-5 w-5" />,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        category: 'Mensagem'
      },
      buttonMessage: {
        title: 'Botões de Resposta',
        description: 'Ofereça até 3 opções clicáveis',
        icon: <Square className="h-5 w-5" />,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        category: 'Interação'
      },
      listMessage: {
        title: 'Lista de Opções',
        description: 'Apresente uma lista organizada',
        icon: <List className="h-5 w-5" />,
        color: 'text-teal-600',
        bgColor: 'bg-teal-50',
        category: 'Interação'
      },
      conditional: {
        title: 'Condicional',
        description: 'Crie ramificações inteligentes',
        icon: <GitBranch className="h-5 w-5" />,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        category: 'Lógica'
      },
      transfer: {
        title: 'Transferir para Setor',
        description: 'Transfira para atendimento humano',
        icon: <UserPlus className="h-5 w-5" />,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        category: 'Integração'
      },
      aiAssistant: {
        title: 'IA Provisória',
        description: 'Assistente temporário',
        icon: <Bot className="h-5 w-5" />,
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-50',
        category: 'Integração'
      },
      delay: {
        title: 'Aguardar',
        description: 'Adicione pausas estratégicas',
        icon: <Clock className="h-5 w-5" />,
        color: 'text-slate-600',
        bgColor: 'bg-slate-50',
        category: 'Lógica'
      },
      webhook: {
        title: 'Webhook',
        description: 'Integre com sistemas externos',
        icon: <Webhook className="h-5 w-5" />,
        color: 'text-rose-600',
        bgColor: 'bg-rose-50',
        category: 'Integração'
      },
      userInput: {
        title: 'Entrada do Usuário',
        description: 'Colete informações específicas',
        icon: <Keyboard className="h-5 w-5" />,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        category: 'Interação'
      },
      location: {
        title: 'Solicitar Localização',
        description: 'Solicite localização do usuário',
        icon: <MapPin className="h-5 w-5" />,
        color: 'text-pink-600',
        bgColor: 'bg-pink-50',
        category: 'Interação'
      },
      contact: {
        title: 'Solicitar Contato',
        description: 'Peça compartilhamento de contato',
        icon: <User className="h-5 w-5" />,
        color: 'text-violet-600',
        bgColor: 'bg-violet-50',
        category: 'Interação'
      },
      poll: {
        title: 'Enquete',
        description: 'Crie enquetes interativas',
        icon: <BarChart3 className="h-5 w-5" />,
        color: 'text-cyan-600',
        bgColor: 'bg-cyan-50',
        category: 'Interação'
      },
      template: {
        title: 'Template WhatsApp',
        description: 'Use templates pré-aprovados',
        icon: <FileText className="h-5 w-5" />,
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50',
        category: 'Mensagem'
      }
    }

    return nodeTypes[node.type as keyof typeof nodeTypes] || {
      title: 'Nó Personalizado',
      description: 'Configure as propriedades',
      icon: <div className="w-5 h-5 rounded bg-muted" />,
      color: 'text-muted-foreground',
      bgColor: 'bg-muted/50',
      category: 'Outros'
    }
  }

  const nodeInfo = getNodeInfo()

  const renderTextMessageSettings = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="message" className="text-sm font-medium flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Mensagem de Texto
        </Label>
        <Textarea
          id="message"
          value={String(formData.message || '')}
          onChange={(e) => updateFormData('message', e.target.value)}
          placeholder="Digite a mensagem que será enviada ao cliente..."
          className="mt-2 min-h-24 resize-none"
          rows={4}
        />
        <div className="mt-3 p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground">
            💡 <strong>Dica:</strong> Use variáveis como {`{{nome_cliente}}`}, {`{{telefone}}`} para personalização
          </p>
        </div>
      </div>
    </div>
  )

  const renderButtonMessageSettings = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="message" className="text-sm font-medium">Mensagem Principal</Label>
        <Textarea
          id="message"
          value={String(formData.message || '')}
          onChange={(e) => updateFormData('message', e.target.value)}
          placeholder="Digite a mensagem com as opções..."
          className="mt-2 resize-none"
          rows={3}
        />
      </div>
      
      <div>
        <div className="flex items-center justify-between mb-4">
          <Label className="text-sm font-medium">Botões de Ação</Label>
          <Badge variant="secondary" className="text-xs">Máximo 3 botões</Badge>
        </div>
        
        <div className="space-y-3">
          {(Array.isArray(formData.buttons) ? formData.buttons : []).map((button: any, index: number) => (
            <div key={index} className="flex gap-3 items-center p-3 border rounded-lg bg-muted/30">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-medium flex items-center justify-center">
                {index + 1}
              </div>
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
                    const newButtons = Array.isArray(formData.buttons) ? 
                      formData.buttons.filter((_: any, i: number) => i !== index) : []
                    updateFormData('buttons', newButtons)
                  }}
                  className="flex-shrink-0 text-destructive hover:text-destructive"
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
                const newButtons = [...(Array.isArray(formData.buttons) ? formData.buttons : []), 
                  { id: Date.now().toString(), text: '' }]
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

  const renderMediaMessageSettings = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="mediaType" className="text-sm font-medium flex items-center gap-2">
          <Image className="h-4 w-4" />
          Tipo de Mídia
        </Label>
        <Select value={String(formData.mediaType || 'image')} onValueChange={(value) => updateFormData('mediaType', value)}>
          <SelectTrigger className="mt-2">
            <SelectValue placeholder="Selecione o tipo de mídia" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="image">Imagem</SelectItem>
            <SelectItem value="video">Vídeo</SelectItem>
            <SelectItem value="audio">Áudio</SelectItem>
            <SelectItem value="document">Documento</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label htmlFor="mediaUrl" className="text-sm font-medium">URL da Mídia</Label>
        <Input
          id="mediaUrl"
          value={String(formData.mediaUrl || '')}
          onChange={(e) => updateFormData('mediaUrl', e.target.value)}
          placeholder="https://exemplo.com/arquivo.jpg"
          className="mt-2"
        />
      </div>
      
      <div>
        <Label htmlFor="caption" className="text-sm font-medium">Legenda (Opcional)</Label>
        <Textarea
          id="caption"
          value={String(formData.caption || '')}
          onChange={(e) => updateFormData('caption', e.target.value)}
          placeholder="Adicione uma legenda à sua mídia..."
          className="mt-2 resize-none"
          rows={3}
        />
      </div>
    </div>
  )

  const renderListMessageSettings = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="message" className="text-sm font-medium">Mensagem Principal</Label>
        <Textarea
          id="message"
          value={String(formData.message || '')}
          onChange={(e) => updateFormData('message', e.target.value)}
          placeholder="Digite a mensagem com as opções..."
          className="mt-2 resize-none"
          rows={3}
        />
      </div>
      
      <div>
        <Label htmlFor="buttonText" className="text-sm font-medium">Texto do Botão</Label>
        <Input
          id="buttonText"
          value={String(formData.buttonText || '')}
          onChange={(e) => updateFormData('buttonText', e.target.value)}
          placeholder="Ver opções"
          className="mt-2"
        />
      </div>
      
      <div>
        <div className="flex items-center justify-between mb-4">
          <Label className="text-sm font-medium">Seções da Lista</Label>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const newSections = [...(Array.isArray(formData.sections) ? formData.sections : []), 
                { title: '', items: [{ id: Date.now().toString(), title: '', description: '' }] }]
              updateFormData('sections', newSections)
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Seção
          </Button>
        </div>
        
        <div className="space-y-4">
          {(Array.isArray(formData.sections) ? formData.sections : []).map((section: any, sectionIndex: number) => (
            <Card key={sectionIndex} className="p-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Input
                    value={section.title || ''}
                    onChange={(e) => {
                      const newSections = [...(Array.isArray(formData.sections) ? formData.sections : [])]
                      newSections[sectionIndex] = { ...section, title: e.target.value }
                      updateFormData('sections', newSections)
                    }}
                    placeholder={`Título da seção ${sectionIndex + 1}`}
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const newSections = Array.isArray(formData.sections) ? 
                        formData.sections.filter((_: any, i: number) => i !== sectionIndex) : []
                      updateFormData('sections', newSections)
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                
                {(Array.isArray(section.items) ? section.items : []).map((item: any, itemIndex: number) => (
                  <div key={itemIndex} className="flex gap-2 ml-4">
                    <div className="flex-1 space-y-2">
                      <Input
                        value={item.title || ''}
                        onChange={(e) => {
                          const newSections = [...(Array.isArray(formData.sections) ? formData.sections : [])]
                          newSections[sectionIndex].items[itemIndex] = { ...item, title: e.target.value }
                          updateFormData('sections', newSections)
                        }}
                        placeholder="Título do item"
                      />
                      <Input
                        value={item.description || ''}
                        onChange={(e) => {
                          const newSections = [...(Array.isArray(formData.sections) ? formData.sections : [])]
                          newSections[sectionIndex].items[itemIndex] = { ...item, description: e.target.value }
                          updateFormData('sections', newSections)
                        }}
                        placeholder="Descrição do item"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newSections = [...(Array.isArray(formData.sections) ? formData.sections : [])]
                        newSections[sectionIndex].items = section.items.filter((_: any, i: number) => i !== itemIndex)
                        updateFormData('sections', newSections)
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
                    const newSections = [...(Array.isArray(formData.sections) ? formData.sections : [])]
                    newSections[sectionIndex].items.push({ id: Date.now().toString(), title: '', description: '' })
                    updateFormData('sections', newSections)
                  }}
                  className="ml-4"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Item
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )

  const renderConditionalSettings = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="variable" className="text-sm font-medium">Variável</Label>
        <Input
          id="variable"
          value={String(formData.variable || '')}
          onChange={(e) => updateFormData('variable', e.target.value)}
          placeholder="{{ultima_resposta}}"
          className="mt-2"
        />
      </div>
      
      <div>
        <Label htmlFor="condition" className="text-sm font-medium">Condição</Label>
        <Select value={String(formData.condition || 'contains')} onValueChange={(value) => updateFormData('condition', value)}>
          <SelectTrigger className="mt-2">
            <SelectValue placeholder="Selecione a condição" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="equals">É igual a</SelectItem>
            <SelectItem value="contains">Contém</SelectItem>
            <SelectItem value="starts_with">Começa com</SelectItem>
            <SelectItem value="ends_with">Termina com</SelectItem>
            <SelectItem value="not_equals">Não é igual a</SelectItem>
            <SelectItem value="not_contains">Não contém</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label htmlFor="value" className="text-sm font-medium">Valor</Label>
        <Input
          id="value"
          value={String(formData.value || '')}
          onChange={(e) => updateFormData('value', e.target.value)}
          placeholder="sim"
          className="mt-2"
        />
      </div>
    </div>
  )

  const renderTransferSettings = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="department" className="text-sm font-medium">Setor de Destino</Label>
        <Select value={String(formData.department || '')} onValueChange={(value) => updateFormData('department', value)}>
          <SelectTrigger className="mt-2">
            <SelectValue placeholder="Selecione o setor" />
          </SelectTrigger>
          <SelectContent>
            {departmentOptions.map((dept) => (
              <SelectItem key={dept} value={dept}>{dept}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label htmlFor="message" className="text-sm font-medium">Mensagem de Transferência</Label>
        <Textarea
          id="message"
          value={String(formData.message || '')}
          onChange={(e) => updateFormData('message', e.target.value)}
          placeholder="Transferindo você para um atendente..."
          className="mt-2 resize-none"
          rows={3}
        />
      </div>
    </div>
  )

  const renderWebhookSettings = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="url" className="text-sm font-medium flex items-center gap-2">
          <Link className="h-4 w-4" />
          URL do Webhook
        </Label>
        <Input
          id="url"
          value={String(formData.url || '')}
          onChange={(e) => updateFormData('url', e.target.value)}
          placeholder="https://api.exemplo.com/webhook"
          className="mt-2"
        />
      </div>
      
      <div>
        <Label htmlFor="method" className="text-sm font-medium">Método HTTP</Label>
        <Select value={String(formData.method || 'POST')} onValueChange={(value) => updateFormData('method', value)}>
          <SelectTrigger className="mt-2">
            <SelectValue placeholder="Selecione o método" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="GET">GET</SelectItem>
            <SelectItem value="POST">POST</SelectItem>
            <SelectItem value="PUT">PUT</SelectItem>
            <SelectItem value="PATCH">PATCH</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label htmlFor="payload" className="text-sm font-medium">Corpo da Requisição (JSON)</Label>
        <Textarea
          id="payload"
          value={String(formData.payload || '')}
          onChange={(e) => updateFormData('payload', e.target.value)}
          placeholder='{"usuario": "{{nome_cliente}}", "telefone": "{{telefone}}"}'
          className="mt-2 resize-none font-mono text-sm"
          rows={4}
        />
      </div>
      
      <div>
        <Label htmlFor="successMessage" className="text-sm font-medium">Mensagem de Sucesso</Label>
        <Input
          id="successMessage"
          value={String(formData.successMessage || '')}
          onChange={(e) => updateFormData('successMessage', e.target.value)}
          placeholder="Dados enviados com sucesso!"
          className="mt-2"
        />
      </div>
      
      <div>
        <Label htmlFor="errorMessage" className="text-sm font-medium">Mensagem de Erro</Label>
        <Input
          id="errorMessage"
          value={String(formData.errorMessage || '')}
          onChange={(e) => updateFormData('errorMessage', e.target.value)}
          placeholder="Erro ao processar solicitação."
          className="mt-2"
        />
      </div>
    </div>
  )

  const renderDelaySettings = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="duration" className="text-sm font-medium flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Duração
        </Label>
        <div className="flex gap-2 mt-2">
          <Input
            id="duration"
            type="number"
            value={String(formData.duration || '')}
            onChange={(e) => updateFormData('duration', parseInt(e.target.value) || 0)}
            placeholder="2"
            className="flex-1"
          />
          <Select value={String(formData.unit || 'seconds')} onValueChange={(value) => updateFormData('unit', value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="seconds">Segundos</SelectItem>
              <SelectItem value="minutes">Minutos</SelectItem>
              <SelectItem value="hours">Horas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div>
        <Label htmlFor="message" className="text-sm font-medium">Mensagem Durante Espera (Opcional)</Label>
        <Input
          id="message"
          value={String(formData.message || '')}
          onChange={(e) => updateFormData('message', e.target.value)}
          placeholder="Aguarde..."
          className="mt-2"
        />
      </div>
    </div>
  )

  const renderUserInputSettings = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="inputType" className="text-sm font-medium">Tipo de Entrada</Label>
        <Select value={String(formData.inputType || 'text')} onValueChange={(value) => updateFormData('inputType', value)}>
          <SelectTrigger className="mt-2">
            <SelectValue placeholder="Selecione o tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="text">Texto</SelectItem>
            <SelectItem value="number">Número</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="phone">Telefone</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label htmlFor="prompt" className="text-sm font-medium">Pergunta</Label>
        <Textarea
          id="prompt"
          value={String(formData.prompt || '')}
          onChange={(e) => updateFormData('prompt', e.target.value)}
          placeholder="Por favor, digite sua resposta:"
          className="mt-2 resize-none"
          rows={3}
        />
      </div>
      
      <div>
        <Label htmlFor="validation" className="text-sm font-medium">Validação (Opcional)</Label>
        <Input
          id="validation"
          value={String(formData.validation || '')}
          onChange={(e) => updateFormData('validation', e.target.value)}
          placeholder="Regex ou regra de validação"
          className="mt-2"
        />
      </div>
      
      <div>
        <Label htmlFor="errorMessage" className="text-sm font-medium">Mensagem de Erro</Label>
        <Input
          id="errorMessage"
          value={String(formData.errorMessage || '')}
          onChange={(e) => updateFormData('errorMessage', e.target.value)}
          placeholder="Entrada inválida. Tente novamente."
          className="mt-2"
        />
      </div>
    </div>
  )

  const renderAIAssistantSettings = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="prompt" className="text-sm font-medium flex items-center gap-2">
          <Bot className="h-4 w-4" />
          Prompt do Assistente
        </Label>
        <Textarea
          id="prompt"
          value={String(formData.prompt || '')}
          onChange={(e) => updateFormData('prompt', e.target.value)}
          placeholder="Você é um assistente útil. Ajude o cliente enquanto ele aguarda..."
          className="mt-2 resize-none"
          rows={4}
        />
      </div>
      
      <div>
        <Label htmlFor="timeout" className="text-sm font-medium">Timeout (segundos)</Label>
        <Input
          id="timeout"
          type="number"
          value={String(formData.timeout || '')}
          onChange={(e) => updateFormData('timeout', parseInt(e.target.value) || 0)}
          placeholder="300"
          className="mt-2"
        />
      </div>
      
      <div>
        <Label htmlFor="fallbackMessage" className="text-sm font-medium">Mensagem de Fallback</Label>
        <Textarea
          id="fallbackMessage"
          value={String(formData.fallbackMessage || '')}
          onChange={(e) => updateFormData('fallbackMessage', e.target.value)}
          placeholder="Vou transferir você para um atendente humano."
          className="mt-2 resize-none"
          rows={3}
        />
      </div>
    </div>
  )

  const renderLocationSettings = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="message" className="text-sm font-medium flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Mensagem de Solicitação
        </Label>
        <Textarea
          id="message"
          value={String(formData.message || '')}
          onChange={(e) => updateFormData('message', e.target.value)}
          placeholder="Por favor, compartilhe sua localização."
          className="mt-2 resize-none"
          rows={3}
        />
      </div>
      
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="required"
          checked={Boolean(formData.required || false)}
          onChange={(e) => updateFormData('required', e.target.checked)}
          className="rounded border-gray-300"
        />
        <Label htmlFor="required" className="text-sm">Localização obrigatória</Label>
      </div>
    </div>
  )

  const renderContactSettings = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="message" className="text-sm font-medium flex items-center gap-2">
          <User className="h-4 w-4" />
          Mensagem de Solicitação
        </Label>
        <Textarea
          id="message"
          value={String(formData.message || '')}
          onChange={(e) => updateFormData('message', e.target.value)}
          placeholder="Compartilhe o contato desejado."
          className="mt-2 resize-none"
          rows={3}
        />
      </div>
      
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="required"
          checked={Boolean(formData.required || false)}
          onChange={(e) => updateFormData('required', e.target.checked)}
          className="rounded border-gray-300"
        />
        <Label htmlFor="required" className="text-sm">Contato obrigatório</Label>
      </div>
    </div>
  )

  const renderPollSettings = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="question" className="text-sm font-medium flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Pergunta da Enquete
        </Label>
        <Input
          id="question"
          value={String(formData.question || '')}
          onChange={(e) => updateFormData('question', e.target.value)}
          placeholder="Qual sua preferência?"
          className="mt-2"
        />
      </div>
      
      <div>
        <div className="flex items-center justify-between mb-4">
          <Label className="text-sm font-medium">Opções da Enquete</Label>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const newOptions = [...(Array.isArray(formData.options) ? formData.options : []), 
                { id: Date.now().toString(), text: '' }]
              updateFormData('options', newOptions)
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Opção
          </Button>
        </div>
        
        <div className="space-y-3">
          {(Array.isArray(formData.options) ? formData.options : []).map((option: any, index: number) => (
            <div key={index} className="flex gap-3 items-center p-3 border rounded-lg">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-medium flex items-center justify-center">
                {index + 1}
              </div>
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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const newOptions = Array.isArray(formData.options) ? 
                    formData.options.filter((_: any, i: number) => i !== index) : []
                  updateFormData('options', newOptions)
                }}
                className="flex-shrink-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="multipleAnswers"
          checked={Boolean(formData.multipleAnswers || false)}
          onChange={(e) => updateFormData('multipleAnswers', e.target.checked)}
          className="rounded border-gray-300"
        />
        <Label htmlFor="multipleAnswers" className="text-sm">Permitir múltiplas respostas</Label>
      </div>
    </div>
  )

  const renderTemplateSettings = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="templateName" className="text-sm font-medium flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Nome do Template
        </Label>
        <Input
          id="templateName"
          value={String(formData.templateName || '')}
          onChange={(e) => updateFormData('templateName', e.target.value)}
          placeholder="nome_do_template"
          className="mt-2"
        />
      </div>
      
      <div>
        <Label htmlFor="language" className="text-sm font-medium">Idioma</Label>
        <Select value={String(formData.language || 'pt_BR')} onValueChange={(value) => updateFormData('language', value)}>
          <SelectTrigger className="mt-2">
            <SelectValue placeholder="Selecione o idioma" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pt_BR">Português (BR)</SelectItem>
            <SelectItem value="en_US">English (US)</SelectItem>
            <SelectItem value="es_ES">Español</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <div className="flex items-center justify-between mb-4">
          <Label className="text-sm font-medium">Parâmetros</Label>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const newParameters = [...(Array.isArray(formData.parameters) ? formData.parameters : []), 
                { key: '', value: '' }]
              updateFormData('parameters', newParameters)
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Parâmetro
          </Button>
        </div>
        
        <div className="space-y-3">
          {(Array.isArray(formData.parameters) ? formData.parameters : []).map((param: any, index: number) => (
            <div key={index} className="flex gap-2">
              <Input
                value={param.key || ''}
                onChange={(e) => {
                  const newParameters = [...(Array.isArray(formData.parameters) ? formData.parameters : [])]
                  newParameters[index] = { ...param, key: e.target.value }
                  updateFormData('parameters', newParameters)
                }}
                placeholder="Chave"
                className="flex-1"
              />
              <Input
                value={param.value || ''}
                onChange={(e) => {
                  const newParameters = [...(Array.isArray(formData.parameters) ? formData.parameters : [])]
                  newParameters[index] = { ...param, value: e.target.value }
                  updateFormData('parameters', newParameters)
                }}
                placeholder="Valor"
                className="flex-1"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const newParameters = Array.isArray(formData.parameters) ? 
                    formData.parameters.filter((_: any, i: number) => i !== index) : []
                  updateFormData('parameters', newParameters)
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderNodeSettings = () => {
    switch (node.type) {
      case 'start':
        return (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Este é o ponto de partida do seu fluxo. Todo cliente que iniciar uma conversa começará aqui. 
              Conecte este nó ao primeiro elemento da sua automação.
            </AlertDescription>
          </Alert>
        )

      case 'textMessage':
        return renderTextMessageSettings()

      case 'buttonMessage':
        return renderButtonMessageSettings()

      case 'mediaMessage':
        return renderMediaMessageSettings()

      case 'listMessage':
        return renderListMessageSettings()

      case 'conditional':
        return renderConditionalSettings()

      case 'transfer':
        return renderTransferSettings()

      case 'webhook':
        return renderWebhookSettings()

      case 'delay':
        return renderDelaySettings()

      case 'userInput':
        return renderUserInputSettings()

      case 'aiAssistant':
        return renderAIAssistantSettings()

      case 'location':
        return renderLocationSettings()

      case 'contact':
        return renderContactSettings()

      case 'poll':
        return renderPollSettings()

      case 'template':
        return renderTemplateSettings()

      default:
        return (
          <div className="p-8 text-center text-muted-foreground">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              {nodeInfo.icon}
            </div>
            <p className="text-sm">
              Configurações específicas para este tipo de nó serão implementadas em breve.
            </p>
          </div>
        )
    }
  }

  const getValidationStatus = () => {
    switch (node.type) {
      case 'textMessage':
        return formData.message && String(formData.message).trim() ? 'valid' : 'invalid'
      case 'buttonMessage':
        return formData.message && Array.isArray(formData.buttons) && 
               formData.buttons.length > 0 && 
               formData.buttons.every((btn: any) => btn.text?.trim()) ? 'valid' : 'invalid'
      case 'mediaMessage':
        return formData.mediaUrl && String(formData.mediaUrl).trim() ? 'valid' : 'invalid'
      case 'listMessage':
        return formData.message && formData.buttonText && Array.isArray(formData.sections) && 
               formData.sections.length > 0 ? 'valid' : 'invalid'
      case 'conditional':
        return formData.variable && formData.condition && formData.value ? 'valid' : 'invalid'
      case 'transfer':
        return formData.department && formData.message ? 'valid' : 'invalid'
      case 'webhook':
        return formData.url && formData.method ? 'valid' : 'invalid'
      case 'delay':
        return formData.duration && formData.unit ? 'valid' : 'invalid'
      case 'userInput':
        return formData.prompt && String(formData.prompt).trim() ? 'valid' : 'invalid'
      case 'aiAssistant':
        return formData.prompt && String(formData.prompt).trim() ? 'valid' : 'invalid'
      case 'location':
        return formData.message && String(formData.message).trim() ? 'valid' : 'invalid'
      case 'contact':
        return formData.message && String(formData.message).trim() ? 'valid' : 'invalid'
      case 'poll':
        return formData.question && Array.isArray(formData.options) && 
               formData.options.length >= 2 ? 'valid' : 'invalid'
      case 'template':
        return formData.templateName && String(formData.templateName).trim() ? 'valid' : 'invalid'
      case 'start':
        return 'valid'
      default:
        return 'pending'
    }
  }

  const validationStatus = getValidationStatus()

  return (
    <div className="w-96 bg-background border-l shadow-xl h-full flex flex-col fixed right-0 top-0 z-50">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b bg-muted/30">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={cn("p-2 rounded-lg", nodeInfo.bgColor)}>
              <div className={nodeInfo.color}>
                {nodeInfo.icon}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-sm truncate">{nodeInfo.title}</h3>
                {validationStatus === 'valid' && (
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                )}
                {validationStatus === 'invalid' && (
                  <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">{nodeInfo.description}</p>
              <Badge variant="outline" className="mt-2 text-xs">
                {nodeInfo.category}
              </Badge>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="flex-shrink-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {renderNodeSettings()}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="flex-shrink-0 p-4 border-t bg-muted/30">
        <div className="flex flex-col gap-3">
          {/* Save Button */}
          {node.type !== 'start' && (
            <Button 
              onClick={handleSave} 
              disabled={!hasUnsavedChanges}
              className="w-full"
            >
              <Save className="h-4 w-4 mr-2" />
              {hasUnsavedChanges ? 'Salvar Alterações' : 'Salvo'}
            </Button>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose} className="flex-1">
              Fechar
            </Button>
            {onDeleteNode && node.id !== 'start' && (
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
    </div>
  )
}