import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, 
  Send, 
  Image, 
  FileText, 
  MapPin, 
  Phone, 
  Users,
  List,
  BarChart3,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useEvolutionAPIComplete } from '@/hooks/useEvolutionAPIComplete';

interface WhatsAppMessagingPanelProps {
  instanceName: string;
}

interface MessageForm {
  number: string;
  text: string;
  mediaUrl: string;
  caption: string;
  filename: string;
  latitude: string;
  longitude: string;
  locationName: string;
  contactName: string;
  contactPhone: string;
  listTitle: string;
  listDescription: string;
  pollQuestion: string;
  pollOptions: string[];
  buttonText: string;
  buttonFooter: string;
  buttons: Array<{ id: string; text: string }>;
}

export function WhatsAppMessagingPanel({ instanceName }: WhatsAppMessagingPanelProps) {
  const [activeTab, setActiveTab] = useState('text');
  const [loading, setLoading] = useState(false);
  const [messageForm, setMessageForm] = useState<MessageForm>({
    number: '',
    text: '',
    mediaUrl: '',
    caption: '',
    filename: '',
    latitude: '',
    longitude: '',
    locationName: '',
    contactName: '',
    contactPhone: '',
    listTitle: '',
    listDescription: '',
    pollQuestion: '',
    pollOptions: ['', ''],
    buttonText: '',
    buttonFooter: '',
    buttons: [{ id: '1', text: '' }, { id: '2', text: '' }]
  });

  const { toast } = useToast();
  const {
    sendText,
    sendButtons,
    sendMedia,
    sendAudio,
    sendLocation,
    sendContact,
    sendList,
    sendPoll,
    checkIsWhatsApp,
    isServiceAvailable
  } = useEvolutionAPIComplete();

  const updateForm = (field: keyof MessageForm, value: string) => {
    setMessageForm(prev => ({ ...prev, [field]: value }));
  };

  const addPollOption = () => {
    setMessageForm(prev => ({
      ...prev,
      pollOptions: [...prev.pollOptions, '']
    }));
  };

  const updatePollOption = (index: number, value: string) => {
    setMessageForm(prev => ({
      ...prev,
      pollOptions: prev.pollOptions.map((option, i) => i === index ? value : option)
    }));
  };

  const removePollOption = (index: number) => {
    if (messageForm.pollOptions.length > 2) {
      setMessageForm(prev => ({
        ...prev,
        pollOptions: prev.pollOptions.filter((_, i) => i !== index)
      }));
    }
  };

  const addButton = () => {
    const newId = (messageForm.buttons.length + 1).toString();
    setMessageForm(prev => ({
      ...prev,
      buttons: [...prev.buttons, { id: newId, text: '' }]
    }));
  };

  const updateButton = (index: number, field: 'id' | 'text', value: string) => {
    setMessageForm(prev => ({
      ...prev,
      buttons: prev.buttons.map((button, i) => 
        i === index ? { ...button, [field]: value } : button
      )
    }));
  };

  const removeButton = (index: number) => {
    if (messageForm.buttons.length > 1) {
      setMessageForm(prev => ({
        ...prev,
        buttons: prev.buttons.filter((_, i) => i !== index)
      }));
    }
  };

  const validateNumber = async (number: string) => {
    if (!number) return false;
    
    const cleanNumber = number.replace(/\D/g, '');
    if (cleanNumber.length < 10) return false;

    try {
      const result = await checkIsWhatsApp(instanceName, cleanNumber);
      return result?.isWhatsApp || false;
    } catch (error) {
      return false;
    }
  };

  const handleSendText = async () => {
    if (!messageForm.number || !messageForm.text) {
      toast({
        title: "Erro",
        description: "Número e texto são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const isValid = await validateNumber(messageForm.number);
      if (!isValid) {
        throw new Error('Número não é um WhatsApp válido');
      }

      await sendText(instanceName, {
        number: messageForm.number,
        text: messageForm.text,
        linkPreview: true
      });

      toast({
        title: "Sucesso",
        description: "Mensagem de texto enviada",
      });

      setMessageForm(prev => ({ ...prev, text: '' }));
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : 'Erro ao enviar mensagem',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendMedia = async () => {
    if (!messageForm.number || !messageForm.mediaUrl) {
      toast({
        title: "Erro",
        description: "Número e URL da mídia são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const isValid = await validateNumber(messageForm.number);
      if (!isValid) {
        throw new Error('Número não é um WhatsApp válido');
      }

      await sendMedia(instanceName, {
        number: messageForm.number,
        media: messageForm.mediaUrl,
        caption: messageForm.caption,
        filename: messageForm.filename
      });

      toast({
        title: "Sucesso",
        description: "Mídia enviada",
      });

      setMessageForm(prev => ({ 
        ...prev, 
        mediaUrl: '', 
        caption: '', 
        filename: '' 
      }));
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : 'Erro ao enviar mídia',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendLocation = async () => {
    if (!messageForm.number || !messageForm.latitude || !messageForm.longitude) {
      toast({
        title: "Erro",
        description: "Número, latitude e longitude são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const isValid = await validateNumber(messageForm.number);
      if (!isValid) {
        throw new Error('Número não é um WhatsApp válido');
      }

      await sendLocation(instanceName, {
        number: messageForm.number,
        latitude: parseFloat(messageForm.latitude),
        longitude: parseFloat(messageForm.longitude),
        name: messageForm.locationName
      });

      toast({
        title: "Sucesso",
        description: "Localização enviada",
      });

      setMessageForm(prev => ({ 
        ...prev, 
        latitude: '', 
        longitude: '', 
        locationName: '' 
      }));
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : 'Erro ao enviar localização',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendContact = async () => {
    if (!messageForm.number || !messageForm.contactName || !messageForm.contactPhone) {
      toast({
        title: "Erro",
        description: "Todos os campos do contato são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const isValid = await validateNumber(messageForm.number);
      if (!isValid) {
        throw new Error('Número não é um WhatsApp válido');
      }

      await sendContact(instanceName, {
        number: messageForm.number,
        contact: {
          name: messageForm.contactName,
          phone: messageForm.contactPhone
        }
      });

      toast({
        title: "Sucesso",
        description: "Contato enviado",
      });

      setMessageForm(prev => ({ 
        ...prev, 
        contactName: '', 
        contactPhone: '' 
      }));
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : 'Erro ao enviar contato',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendPoll = async () => {
    const validOptions = messageForm.pollOptions.filter(option => option.trim() !== '');
    
    if (!messageForm.number || !messageForm.pollQuestion || validOptions.length < 2) {
      toast({
        title: "Erro",
        description: "Número, pergunta e pelo menos 2 opções são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const isValid = await validateNumber(messageForm.number);
      if (!isValid) {
        throw new Error('Número não é um WhatsApp válido');
      }

      await sendPoll(instanceName, {
        number: messageForm.number,
        question: messageForm.pollQuestion,
        options: validOptions
      });

      toast({
        title: "Sucesso",
        description: "Enquete enviada",
      });

      setMessageForm(prev => ({ 
        ...prev, 
        pollQuestion: '', 
        pollOptions: ['', ''] 
      }));
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : 'Erro ao enviar enquete',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendButtons = async () => {
    const validButtons = messageForm.buttons.filter(button => 
      button.id.trim() !== '' && button.text.trim() !== ''
    );
    
    if (!messageForm.number || !messageForm.buttonText || validButtons.length < 1) {
      toast({
        title: "Erro",
        description: "Número, texto e pelo menos 1 botão são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const isValid = await validateNumber(messageForm.number);
      if (!isValid) {
        throw new Error('Número não é um WhatsApp válido');
      }

      await sendButtons(instanceName, {
        number: messageForm.number,
        buttonMessage: {
          text: messageForm.buttonText,
          buttons: validButtons,
          footer: messageForm.buttonFooter || undefined
        }
      });

      toast({
        title: "Sucesso",
        description: "Mensagem com botões enviada",
      });

      setMessageForm(prev => ({ 
        ...prev, 
        buttonText: '', 
        buttonFooter: '',
        buttons: [{ id: '1', text: '' }, { id: '2', text: '' }]
      }));
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : 'Erro ao enviar mensagem com botões',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isServiceAvailable) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Serviço Evolution API não está disponível. Configure primeiro no painel administrativo.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Painel de Mensagens WhatsApp
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{instanceName}</Badge>
            {isServiceAvailable && (
              <Badge variant="default" className="bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                Conectado
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="recipient">Número do Destinatário</Label>
              <Input
                id="recipient"
                value={messageForm.number}
                onChange={(e) => updateForm('number', e.target.value)}
                placeholder="5511999999999"
                type="tel"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Digite o número com código do país (ex: 5511999999999)
              </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="text" className="flex items-center gap-1">
                  <MessageCircle className="w-4 h-4" />
                  Texto
                </TabsTrigger>
                <TabsTrigger value="buttons" className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  Botões
                </TabsTrigger>
                <TabsTrigger value="media" className="flex items-center gap-1">
                  <Image className="w-4 h-4" />
                  Mídia
                </TabsTrigger>
                <TabsTrigger value="location" className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  Local
                </TabsTrigger>
                <TabsTrigger value="contact" className="flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  Contato
                </TabsTrigger>
                <TabsTrigger value="poll" className="flex items-center gap-1">
                  <BarChart3 className="w-4 h-4" />
                  Enquete
                </TabsTrigger>
              </TabsList>

              <TabsContent value="text" className="space-y-4">
                <div>
                  <Label htmlFor="text-message">Mensagem</Label>
                  <Textarea
                    id="text-message"
                    value={messageForm.text}
                    onChange={(e) => updateForm('text', e.target.value)}
                    placeholder="Digite sua mensagem..."
                    rows={4}
                  />
                </div>
                <Button 
                  onClick={handleSendText} 
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Enviar Mensagem
                </Button>
              </TabsContent>

              <TabsContent value="buttons" className="space-y-4">
                <div>
                  <Label htmlFor="button-text">Texto da Mensagem</Label>
                  <Textarea
                    id="button-text"
                    value={messageForm.buttonText}
                    onChange={(e) => updateForm('buttonText', e.target.value)}
                    placeholder="Digite o texto da mensagem..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="button-footer">Rodapé (opcional)</Label>
                  <Input
                    id="button-footer"
                    value={messageForm.buttonFooter}
                    onChange={(e) => updateForm('buttonFooter', e.target.value)}
                    placeholder="Texto do rodapé"
                  />
                </div>
                <div>
                  <Label>Botões</Label>
                  <div className="space-y-2">
                    {messageForm.buttons.map((button, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={button.id}
                          onChange={(e) => updateButton(index, 'id', e.target.value)}
                          placeholder={`ID ${index + 1}`}
                          className="w-20"
                        />
                        <Input
                          value={button.text}
                          onChange={(e) => updateButton(index, 'text', e.target.value)}
                          placeholder={`Texto do botão ${index + 1}`}
                          className="flex-1"
                        />
                        {messageForm.buttons.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeButton(index)}
                          >
                            Remover
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addButton}
                    >
                      Adicionar Botão
                    </Button>
                  </div>
                </div>
                <Button 
                  onClick={handleSendButtons} 
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Users className="w-4 h-4 mr-2" />
                  )}
                  Enviar Mensagem com Botões
                </Button>
              </TabsContent>

              <TabsContent value="media" className="space-y-4">
                <div>
                  <Label htmlFor="media-url">URL da Mídia</Label>
                  <Input
                    id="media-url"
                    value={messageForm.mediaUrl}
                    onChange={(e) => updateForm('mediaUrl', e.target.value)}
                    placeholder="https://exemplo.com/imagem.jpg"
                  />
                </div>
                <div>
                  <Label htmlFor="media-caption">Legenda (opcional)</Label>
                  <Input
                    id="media-caption"
                    value={messageForm.caption}
                    onChange={(e) => updateForm('caption', e.target.value)}
                    placeholder="Legenda da mídia"
                  />
                </div>
                <div>
                  <Label htmlFor="media-filename">Nome do Arquivo (opcional)</Label>
                  <Input
                    id="media-filename"
                    value={messageForm.filename}
                    onChange={(e) => updateForm('filename', e.target.value)}
                    placeholder="documento.pdf"
                  />
                </div>
                <Button 
                  onClick={handleSendMedia} 
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Image className="w-4 h-4 mr-2" />
                  )}
                  Enviar Mídia
                </Button>
              </TabsContent>

              <TabsContent value="location" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="latitude">Latitude</Label>
                    <Input
                      id="latitude"
                      value={messageForm.latitude}
                      onChange={(e) => updateForm('latitude', e.target.value)}
                      placeholder="-23.5505"
                      type="number"
                      step="any"
                    />
                  </div>
                  <div>
                    <Label htmlFor="longitude">Longitude</Label>
                    <Input
                      id="longitude"
                      value={messageForm.longitude}
                      onChange={(e) => updateForm('longitude', e.target.value)}
                      placeholder="-46.6333"
                      type="number"
                      step="any"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="location-name">Nome do Local (opcional)</Label>
                  <Input
                    id="location-name"
                    value={messageForm.locationName}
                    onChange={(e) => updateForm('locationName', e.target.value)}
                    placeholder="São Paulo"
                  />
                </div>
                <Button 
                  onClick={handleSendLocation} 
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <MapPin className="w-4 h-4 mr-2" />
                  )}
                  Enviar Localização
                </Button>
              </TabsContent>

              <TabsContent value="contact" className="space-y-4">
                <div>
                  <Label htmlFor="contact-name">Nome do Contato</Label>
                  <Input
                    id="contact-name"
                    value={messageForm.contactName}
                    onChange={(e) => updateForm('contactName', e.target.value)}
                    placeholder="João Silva"
                  />
                </div>
                <div>
                  <Label htmlFor="contact-phone">Telefone do Contato</Label>
                  <Input
                    id="contact-phone"
                    value={messageForm.contactPhone}
                    onChange={(e) => updateForm('contactPhone', e.target.value)}
                    placeholder="5511988888888"
                    type="tel"
                  />
                </div>
                <Button 
                  onClick={handleSendContact} 
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Phone className="w-4 h-4 mr-2" />
                  )}
                  Enviar Contato
                </Button>
              </TabsContent>

              <TabsContent value="poll" className="space-y-4">
                <div>
                  <Label htmlFor="poll-question">Pergunta da Enquete</Label>
                  <Input
                    id="poll-question"
                    value={messageForm.pollQuestion}
                    onChange={(e) => updateForm('pollQuestion', e.target.value)}
                    placeholder="Qual sua cor favorita?"
                  />
                </div>
                <div>
                  <Label>Opções da Enquete</Label>
                  <div className="space-y-2">
                    {messageForm.pollOptions.map((option, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={option}
                          onChange={(e) => updatePollOption(index, e.target.value)}
                          placeholder={`Opção ${index + 1}`}
                        />
                        {messageForm.pollOptions.length > 2 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removePollOption(index)}
                          >
                            Remover
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addPollOption}
                    >
                      Adicionar Opção
                    </Button>
                  </div>
                </div>
                <Button 
                  onClick={handleSendPoll} 
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <BarChart3 className="w-4 h-4 mr-2" />
                  )}
                  Enviar Enquete
                </Button>
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
