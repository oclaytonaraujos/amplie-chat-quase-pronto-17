import React, { useState } from 'react';
import { ArrowLeft, Phone, Video, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ClienteInfo } from '../ClienteInfo';
import { StatusAtendimentoActions } from '../StatusAtendimentoActions';
import { FinalizarAtendimentoDialog } from '../FinalizarAtendimentoDialog';

interface WhatsAppHeaderProps {
  contato: {
    id: string;
    nome: string;
    telefone: string;
    email?: string;
  };
  isTyping?: boolean;
  clienteInfo?: {
    id: string;
    nome: string;
    telefone: string;
    email: string;
    dataCadastro: string;
    tags: string[];
    historico: any[];
  } | null;
  statusAtendimento?: string;
  onReturnToList?: () => void;
  onSairConversa?: () => void;
  onTransferir?: () => void;
  onFinalizar?: (resumo?: string) => Promise<void>;
  onMudarStatus?: (novoStatus: string) => void;
}

export function WhatsAppHeader({ 
  contato, 
  isTyping = false, 
  clienteInfo,
  statusAtendimento = 'ativo',
  onReturnToList,
  onSairConversa,
  onTransferir,
  onFinalizar,
  onMudarStatus
}: WhatsAppHeaderProps) {
  const [showClienteInfo, setShowClienteInfo] = useState(false);
  const [showFinalizarDialog, setShowFinalizarDialog] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  };

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {onReturnToList && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReturnToList}
              className="p-0 h-8 w-8 md:hidden"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}
          
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-green-500 text-white">
                {getInitials(contato.nome)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="font-medium text-gray-900 truncate">
                  {contato.nome}
                </h3>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Online
                </Badge>
              </div>
              
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>{formatPhoneNumber(contato.telefone)}</span>
                {isTyping && (
                  <div className="flex items-center space-x-1">
                    <div className="flex space-x-1">
                      <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"></div>
                      <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-blue-500 text-xs">digitando...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-600 hover:text-gray-900"
            title="Chamada de voz"
          >
            <Phone className="w-5 h-5" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-600 hover:text-gray-900"
            title="Chamada de vídeo"
          >
            <Video className="w-5 h-5" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowClienteInfo(true)}
            className="text-gray-600 hover:text-gray-900"
          >
            <Info className="w-5 h-5" />
          </Button>

          {onMudarStatus && (
            <StatusAtendimentoActions
              statusAtual={statusAtendimento}
              onMudarStatus={onMudarStatus}
              onFinalizar={() => setShowFinalizarDialog(true)}
              onTransferir={onTransferir || (() => {})}
              onSairConversa={onSairConversa || (() => {})}
            />
          )}
        </div>
      </div>

      {clienteInfo && (
        <Dialog open={showClienteInfo} onOpenChange={setShowClienteInfo}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Informações do Cliente</DialogTitle>
            </DialogHeader>
            <ClienteInfo cliente={clienteInfo} />
          </DialogContent>
        </Dialog>
      )}

      <FinalizarAtendimentoDialog
        open={showFinalizarDialog}
        onOpenChange={setShowFinalizarDialog}
        onConfirm={async (resumo) => {
          if (onFinalizar) {
            await onFinalizar(resumo);
          }
        }}
        nomeCliente={contato.nome}
      />
    </div>
  );
}