import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { QrCode, RefreshCw, X } from 'lucide-react';

interface QRCodeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  qrCode?: string;
  instanceName: string;
  onRefresh: () => void;
  isLoading?: boolean;
}

export function QRCodeModal({ 
  open, 
  onOpenChange, 
  qrCode, 
  instanceName, 
  onRefresh,
  isLoading = false 
}: QRCodeModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            Conectar WhatsApp
          </DialogTitle>
          <DialogDescription>
            Escaneie o QR code abaixo com o WhatsApp da instância "{instanceName}"
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-4">
          {qrCode ? (
            <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
              <img 
                src={qrCode} 
                alt="QR Code para conectar WhatsApp"
                className="w-64 h-64 object-contain"
                onError={(e) => {
                  console.error('Erro ao carregar QR Code:', qrCode);
                  e.currentTarget.src = '/placeholder.svg';
                }}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center w-64 h-64 bg-muted rounded-lg border-2 border-dashed">
              {isLoading ? (
                <>
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Gerando QR Code...</p>
                </>
              ) : (
                <>
                  <QrCode className="w-8 h-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">QR Code não disponível</p>
                  <p className="text-xs text-muted-foreground">Clique em "Atualizar QR Code"</p>
                </>
              )}
            </div>
          )}

          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              1. Abra o WhatsApp no seu celular
            </p>
            <p className="text-sm text-muted-foreground">
              2. Toque em Menu ou Configurações
            </p>
            <p className="text-sm text-muted-foreground">
              3. Toque em "Aparelhos conectados"
            </p>
            <p className="text-sm text-muted-foreground">
              4. Toque em "Conectar um aparelho"
            </p>
            <p className="text-sm text-muted-foreground">
              5. Aponte a câmera para este código
            </p>
          </div>

          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              onClick={onRefresh}
              disabled={isLoading}
              className="flex-1"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar QR Code
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              <X className="w-4 h-4 mr-2" />
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}