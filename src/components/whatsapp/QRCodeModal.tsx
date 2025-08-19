import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface QRCodeModalProps {
  instanceName: string;
  isOpen: boolean;
  onClose: () => void;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  instanceName,
  isOpen,
  onClose
}) => {
  const { toast } = useToast();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Configuração WhatsApp - {instanceName}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
          <DialogDescription className="text-blue-600">
            Configuração via n8n
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Information */}
          <div className="flex justify-center">
            <div className="aspect-square bg-blue-50 border-2 border-blue-200 rounded-lg flex flex-col items-center justify-center p-8">
              <Info className="w-16 h-16 text-blue-500 mb-4" />
              <p className="text-blue-700 font-semibold text-lg text-center">Configuração via n8n</p>
              <p className="text-blue-600 text-sm mt-2 text-center">
                As conexões WhatsApp são gerenciadas através dos fluxos n8n
              </p>
            </div>
          </div>

          {/* Instruções */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">Como funciona:</h4>
            <ol className="text-blue-700 text-sm space-y-1 list-decimal list-inside">
              <li>As conexões WhatsApp são estabelecidas via n8n</li>
              <li>Configure o webhook no n8n para receber mensagens</li>
              <li>O sistema recebe dados através dos webhooks configurados</li>
              <li>Não é necessária configuração manual de instâncias</li>
            </ol>
          </div>

          {/* Controles */}
          <div className="flex justify-end">
            <Button 
              variant="secondary" 
              onClick={onClose}
            >
              Fechar
            </Button>
          </div>

          {/* Status da conexão */}
          <div className="text-xs text-gray-500 text-center">
            Sistema integrado via n8n | Instância: {instanceName}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};