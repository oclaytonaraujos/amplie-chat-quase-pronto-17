import React, { useState, useRef } from 'react';
import { Send, Paperclip, Smile, FileText, Mic, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { QuickResponseTemplates } from '../templates/QuickResponseTemplates';

interface ChatInputWithTemplatesProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onFileUpload?: (file: File) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function ChatInputWithTemplates({
  value,
  onChange,
  onSend,
  onFileUpload,
  placeholder = "Digite sua mensagem...",
  disabled = false,
  className = ""
}: ChatInputWithTemplatesProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled) {
        onSend();
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onFileUpload) {
      onFileUpload(file);
    }
  };

  const handleTemplateSelect = (templateContent: string) => {
    onChange(value + templateContent);
    setShowTemplates(false);
    
    // Focar no textarea após inserir template
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  };

  const toggleRecording = () => {
    if (isRecording) {
      // Parar gravação
      setIsRecording(false);
    } else {
      // Iniciar gravação
      setIsRecording(true);
      // Implementar lógica de gravação de áudio
    }
  };

  const canSend = value.trim().length > 0 && !disabled;

  return (
    <div className={`border rounded-lg bg-background ${className}`}>
      <div className="flex items-end space-x-2 p-3">
        {/* Área de input */}
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled}
            className="min-h-[40px] max-h-32 resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-0 py-2"
            style={{ boxShadow: 'none' }}
          />
        </div>

        {/* Botões de ação */}
        <div className="flex items-center space-x-1">
          {/* Templates */}
          <Popover open={showTemplates} onOpenChange={setShowTemplates}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                disabled={disabled}
              >
                <FileText className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent 
              align="end" 
              className="w-96 p-0"
              sideOffset={5}
            >
              <div className="p-4 border-b">
                <h4 className="font-semibold">Templates de Resposta</h4>
                <p className="text-sm text-muted-foreground">
                  Selecione um template para inserir no chat
                </p>
              </div>
              <div className="max-h-96 overflow-y-auto">
                <QuickResponseTemplates 
                  onSelectTemplate={handleTemplateSelect}
                  className="p-4"
                />
              </div>
            </PopoverContent>
          </Popover>

          {/* Upload de arquivo */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileSelect}
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
          />

          {/* Emoji */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            disabled={disabled}
          >
            <Smile className="h-4 w-4" />
          </Button>

          {/* Gravação de áudio */}
          <Button
            variant="ghost"
            size="sm"
            className={`h-8 w-8 p-0 ${isRecording ? 'text-red-500' : ''}`}
            onClick={toggleRecording}
            disabled={disabled}
          >
            {isRecording ? (
              <Square className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>

          {/* Enviar */}
          <Button
            size="sm"
            onClick={onSend}
            disabled={!canSend}
            className="h-8 px-3"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isRecording && (
        <div className="px-3 pb-3">
          <div className="flex items-center space-x-2 text-red-500 text-sm">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span>Gravando áudio...</span>
          </div>
        </div>
      )}
    </div>
  );
}