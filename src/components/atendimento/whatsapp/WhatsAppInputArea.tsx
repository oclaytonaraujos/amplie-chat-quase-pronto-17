
import React, { useState, useRef } from 'react';
import { 
  Send, 
  Paperclip, 
  Smile, 
  Mic, 
  Camera, 
  Image as ImageIcon, 
  FileText, 
  MapPin, 
  User, 
  X,
  Play,
  Pause,
  Square,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface WhatsAppInputAreaProps {
  onSendMessage: (message: {
    type: 'texto' | 'imagem' | 'audio' | 'video' | 'documento' | 'localizacao' | 'contato' | 'botoes' | 'lista';
    content: string;
    file?: File;
    metadata?: any;
  }) => void;
  replyingTo?: {
    id: string;
    content: string;
    sender: string;
    type: string;
  } | null;
  onCancelReply?: () => void;
  disabled?: boolean;
}

export function WhatsAppInputArea({
  onSendMessage,
  replyingTo,
  onCancelReply,
  disabled = false
}: WhatsAppInputAreaProps) {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [showButtonsDialog, setShowButtonsDialog] = useState(false);
  const [showListDialog, setShowListDialog] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const handleSendText = () => {
    if (!message.trim()) return;
    
    onSendMessage({
      type: 'texto',
      content: message,
      metadata: replyingTo ? { quotedMessage: replyingTo } : undefined
    });
    
    setMessage('');
    onCancelReply?.();
  };

  const handleFileSelect = (type: 'image' | 'document' | 'video') => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = type === 'image' ? 'image/*' : 
                                   type === 'video' ? 'video/*' : 
                                   '.pdf,.doc,.docx,.txt,.xlsx,.xls';
      fileInputRef.current.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          const messageType = type === 'image' ? 'imagem' : 
                            type === 'video' ? 'video' : 'documento';
          onSendMessage({
            type: messageType,
            content: message || '',
            file,
            metadata: replyingTo ? { quotedMessage: replyingTo } : undefined
          });
          setMessage('');
          onCancelReply?.();
        }
      };
      fileInputRef.current.click();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        const audioFile = new File([audioBlob], 'audio.wav', { type: 'audio/wav' });
        
        onSendMessage({
          type: 'audio',
          content: '',
          file: audioFile,
          metadata: { 
            duration: recordingTime,
            ...(replyingTo ? { quotedMessage: replyingTo } : {})
          }
        });
        
        stream.getTracks().forEach(track => track.stop());
        onCancelReply?.();
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível acessar o microfone",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setRecordingTime(0);
      
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
  };

  const handleSendLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          onSendMessage({
            type: 'localizacao',
            content: 'Localização atual',
            metadata: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              ...(replyingTo ? { quotedMessage: replyingTo } : {})
            }
          });
          setShowLocationDialog(false);
          onCancelReply?.();
        },
        (error) => {
          toast({
            title: "Erro",
            description: "Não foi possível obter a localização",
            variant: "destructive",
          });
        }
      );
    }
  };

  const handleSendContact = (contactData: { name: string; phone: string }) => {
    onSendMessage({
      type: 'contato',
      content: `Contato: ${contactData.name}`,
      metadata: {
        contactName: contactData.name,
        contactPhone: contactData.phone,
        ...(replyingTo ? { quotedMessage: replyingTo } : {})
      }
    });
    setShowContactDialog(false);
    onCancelReply?.();
  };

  const handleSendButtons = (buttonsData: { text: string; buttons: Array<{ id: string; text: string }> }) => {
    onSendMessage({
      type: 'botoes',
      content: buttonsData.text,
      metadata: {
        buttons: buttonsData.buttons,
        ...(replyingTo ? { quotedMessage: replyingTo } : {})
      }
    });
    setShowButtonsDialog(false);
    onCancelReply?.();
  };

  const handleSendList = (listData: { 
    title: string; 
    sections: Array<{ title: string; rows: Array<{ id: string; title: string; description?: string }> }> 
  }) => {
    onSendMessage({
      type: 'lista',
      content: listData.title,
      metadata: {
        listOptions: listData,
        ...(replyingTo ? { quotedMessage: replyingTo } : {})
      }
    });
    setShowListDialog(false);
    onCancelReply?.();
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      {/* Reply preview */}
      {replyingTo && (
        <div className="mb-3 p-3 bg-gray-50 rounded-lg border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-blue-600 font-medium">
                Respondendo para {replyingTo.sender}
              </div>
              <div className="text-sm text-gray-700 truncate">
                {replyingTo.content}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancelReply}
              className="p-0 h-auto"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Recording interface */}
      {isRecording && (
        <div className="mb-3 p-3 bg-red-50 rounded-lg border border-red-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-red-700">
                Gravando: {formatRecordingTime(recordingTime)}
              </span>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={cancelRecording}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={stopRecording}
                className="text-red-600 hover:text-red-700"
              >
                <Square className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="flex items-end space-x-2">
        {/* Attachment menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              disabled={disabled || isRecording}
              className="flex-shrink-0"
            >
              <Paperclip className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => handleFileSelect('image')}>
              <ImageIcon className="w-4 h-4 mr-2" />
              Imagem
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleFileSelect('video')}>
              <Camera className="w-4 h-4 mr-2" />
              Vídeo
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleFileSelect('document')}>
              <FileText className="w-4 h-4 mr-2" />
              Documento
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowLocationDialog(true)}>
              <MapPin className="w-4 h-4 mr-2" />
              Localização
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowContactDialog(true)}>
              <User className="w-4 h-4 mr-2" />
              Contato
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowButtonsDialog(true)}>
              <Send className="w-4 h-4 mr-2" />
              Botões
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowListDialog(true)}>
              <FileText className="w-4 h-4 mr-2" />
              Lista
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Message input */}
        <div className="flex-1 relative">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Digite uma mensagem..."
            disabled={disabled || isRecording}
            className="min-h-[40px] max-h-24 resize-none pr-10"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendText();
              }
            }}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            disabled={disabled || isRecording}
            className="absolute right-2 top-2 p-1"
          >
            <Smile className="w-4 h-4" />
          </Button>
        </div>

        {/* Send/Record button */}
        {message.trim() ? (
          <Button
            onClick={handleSendText}
            disabled={disabled || isRecording}
            className="bg-green-600 hover:bg-green-700 text-white flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={disabled}
            className={`${
              isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
            } text-white flex-shrink-0`}
          >
            <Mic className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Dialogs */}
      <ContactDialog
        open={showContactDialog}
        onOpenChange={setShowContactDialog}
        onSend={handleSendContact}
      />
      
      <ButtonsDialog
        open={showButtonsDialog}
        onOpenChange={setShowButtonsDialog}
        onSend={handleSendButtons}
      />
      
      <ListDialog
        open={showListDialog}
        onOpenChange={setShowListDialog}
        onSend={handleSendList}
      />
      
      <LocationDialog
        open={showLocationDialog}
        onOpenChange={setShowLocationDialog}
        onSend={handleSendLocation}
      />

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
      />
    </div>
  );
}

// Contact Dialog Component
function ContactDialog({
  open,
  onOpenChange,
  onSend
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSend: (data: { name: string; phone: string }) => void;
}) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const handleSend = () => {
    if (name && phone) {
      onSend({ name, phone });
      setName('');
      setPhone('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enviar Contato</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="contact-name">Nome</Label>
            <Input
              id="contact-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome do contato"
            />
          </div>
          <div>
            <Label htmlFor="contact-phone">Telefone</Label>
            <Input
              id="contact-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(11) 99999-9999"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSend} disabled={!name || !phone}>
            Enviar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Buttons Dialog Component
function ButtonsDialog({
  open,
  onOpenChange,
  onSend
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSend: (data: { text: string; buttons: Array<{ id: string; text: string }> }) => void;
}) {
  const [text, setText] = useState('');
  const [buttons, setButtons] = useState([{ id: '1', text: '' }]);

  const addButton = () => {
    if (buttons.length < 3) {
      setButtons([...buttons, { id: (buttons.length + 1).toString(), text: '' }]);
    }
  };

  const removeButton = (index: number) => {
    setButtons(buttons.filter((_, i) => i !== index));
  };

  const updateButton = (index: number, text: string) => {
    const newButtons = [...buttons];
    newButtons[index].text = text;
    setButtons(newButtons);
  };

  const handleSend = () => {
    if (text && buttons.every(b => b.text)) {
      onSend({ text, buttons });
      setText('');
      setButtons([{ id: '1', text: '' }]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enviar Botões</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="buttons-text">Mensagem</Label>
            <Textarea
              id="buttons-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Digite a mensagem..."
            />
          </div>
          <div>
            <Label>Botões</Label>
            {buttons.map((button, index) => (
              <div key={index} className="flex items-center space-x-2 mt-2">
                <Input
                  value={button.text}
                  onChange={(e) => updateButton(index, e.target.value)}
                  placeholder={`Botão ${index + 1}`}
                />
                {buttons.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeButton(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
            {buttons.length < 3 && (
              <Button
                variant="outline"
                size="sm"
                onClick={addButton}
                className="mt-2"
              >
                Adicionar Botão
              </Button>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSend} disabled={!text || !buttons.every(b => b.text)}>
            Enviar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// List Dialog Component
function ListDialog({
  open,
  onOpenChange,
  onSend
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSend: (data: { 
    title: string; 
    sections: Array<{ title: string; rows: Array<{ id: string; title: string; description?: string }> }> 
  }) => void;
}) {
  const [title, setTitle] = useState('');
  const [sections, setSections] = useState([
    { title: '', rows: [{ id: '1', title: '', description: '' }] }
  ]);

  const addSection = () => {
    setSections([...sections, { title: '', rows: [{ id: '1', title: '', description: '' }] }]);
  };

  const addRow = (sectionIndex: number) => {
    const newSections = [...sections];
    const newRowId = (newSections[sectionIndex].rows.length + 1).toString();
    newSections[sectionIndex].rows.push({ id: newRowId, title: '', description: '' });
    setSections(newSections);
  };

  const updateSection = (index: number, title: string) => {
    const newSections = [...sections];
    newSections[index].title = title;
    setSections(newSections);
  };

  const updateRow = (sectionIndex: number, rowIndex: number, field: string, value: string) => {
    const newSections = [...sections];
    (newSections[sectionIndex].rows[rowIndex] as any)[field] = value;
    setSections(newSections);
  };

  const handleSend = () => {
    if (title && sections.every(s => s.title && s.rows.every(r => r.title))) {
      onSend({ title, sections });
      setTitle('');
      setSections([{ title: '', rows: [{ id: '1', title: '', description: '' }] }]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Enviar Lista</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="list-title">Título da Lista</Label>
            <Input
              id="list-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Digite o título da lista..."
            />
          </div>
          
          {sections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="border rounded-lg p-4">
              <div className="mb-3">
                <Label>Seção {sectionIndex + 1}</Label>
                <Input
                  value={section.title}
                  onChange={(e) => updateSection(sectionIndex, e.target.value)}
                  placeholder="Título da seção"
                />
              </div>
              
              {section.rows.map((row, rowIndex) => (
                <div key={rowIndex} className="grid grid-cols-2 gap-2 mb-2">
                  <Input
                    value={row.title}
                    onChange={(e) => updateRow(sectionIndex, rowIndex, 'title', e.target.value)}
                    placeholder="Título do item"
                  />
                  <Input
                    value={row.description}
                    onChange={(e) => updateRow(sectionIndex, rowIndex, 'description', e.target.value)}
                    placeholder="Descrição (opcional)"
                  />
                </div>
              ))}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => addRow(sectionIndex)}
                className="mt-2"
              >
                Adicionar Item
              </Button>
            </div>
          ))}
          
          <Button
            variant="outline"
            onClick={addSection}
          >
            Adicionar Seção
          </Button>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSend} disabled={!title || !sections.every(s => s.title && s.rows.every(r => r.title))}>
            Enviar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Location Dialog Component
function LocationDialog({
  open,
  onOpenChange,
  onSend
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSend: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enviar Localização</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Sua localização atual será enviada para o contato.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onSend}>
            Enviar Localização
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
