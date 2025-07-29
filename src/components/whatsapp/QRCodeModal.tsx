import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle2, X } from 'lucide-react';
import { useWhatsAppConnectionCheck } from '@/hooks/useWhatsAppConnectionCheck';
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
  const { status, qrCode, checkConnection, isChecking, numero } = useWhatsAppConnectionCheck(instanceName);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { toast } = useToast();

  // Auto-refresh QR code every 10 seconds quando modal está aberto
  useEffect(() => {
    if (!isOpen || !autoRefresh) return;

    const interval = setInterval(() => {
      if (status === 'qr' || status === 'connecting') {
        checkConnection();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [isOpen, autoRefresh, status, checkConnection]);

  // Auto-close quando conectar
  useEffect(() => {
    if (status === 'open') {
      toast({
        title: "WhatsApp Conectado!",
        description: `Número ${numero} conectado com sucesso`,
        variant: "default",
      });
      
      // Fechar modal após 2 segundos
      setTimeout(() => {
        onClose();
      }, 2000);
    }
  }, [status, numero, onClose, toast]);

  const handleRefresh = () => {
    checkConnection();
  };

  const renderQRCode = () => {
    if (status === 'open') {
      return (
        <div className="aspect-square bg-green-50 border-2 border-green-200 rounded-lg flex flex-col items-center justify-center">
          <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
          <p className="text-green-700 font-semibold text-lg">WhatsApp Conectado!</p>
          {numero && (
            <p className="text-green-600 text-sm mt-2">Número: {numero}</p>
          )}
        </div>
      );
    }

    if (!qrCode) {
      return (
        <div className="aspect-square bg-gray-100 border-2 border-gray-200 rounded-lg flex flex-col items-center justify-center">
          <RefreshCw className={`w-8 h-8 text-gray-500 mb-4 ${isChecking ? 'animate-spin' : ''}`} />
          <p className="text-gray-600">
            {isChecking ? 'Gerando QR Code...' : 'QR Code não disponível'}
          </p>
          {!isChecking && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleRefresh}
              className="mt-4"
            >
              Tentar Novamente
            </Button>
          )}
        </div>
      );
    }

    return (
      <div className="aspect-square bg-white border-2 border-gray-200 rounded-lg overflow-hidden">
        <img 
          src={qrCode} 
          alt="QR Code WhatsApp" 
          className="w-full h-full object-contain"
          onError={() => {
            console.error('Erro ao carregar QR Code');
            handleRefresh();
          }}
        />
      </div>
    );
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'open':
        return {
          text: "WhatsApp conectado com sucesso!",
          color: "text-green-600"
        };
      case 'qr':
        return {
          text: "Escaneie o QR Code com seu WhatsApp",
          color: "text-blue-600"
        };
      case 'connecting':
        return {
          text: "Conectando... Por favor, aguarde",
          color: "text-yellow-600"
        };
      case 'disconnected':
        return {
          text: "Instância desconectada",
          color: "text-red-600"
        };
      default:
        return {
          text: "Verificando status da conexão...",
          color: "text-gray-600"
        };
    }
  };

  const statusMessage = getStatusMessage();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Conectar WhatsApp - {instanceName}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
          <DialogDescription className={statusMessage.color}>
            {statusMessage.text}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* QR Code */}
          <div className="flex justify-center">
            {renderQRCode()}
          </div>

          {/* Instruções */}
          {(status === 'qr' || status === 'connecting') && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2">Como conectar:</h4>
              <ol className="text-blue-700 text-sm space-y-1 list-decimal list-inside">
                <li>Abra o WhatsApp no seu celular</li>
                <li>Toque em "Mais opções" ou "⋮" e depois em "WhatsApp Web"</li>
                <li>Escaneie o QR Code acima</li>
                <li>Aguarde a confirmação da conexão</li>
              </ol>
            </div>
          )}

          {/* Controles */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleRefresh}
                disabled={isChecking}
              >
                {isChecking ? (
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Atualizar
              </Button>
              
              {(status === 'qr' || status === 'connecting') && (
                <label className="flex items-center space-x-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    className="rounded"
                  />
                  <span>Auto-atualizar</span>
                </label>
              )}
            </div>

            <Button 
              variant="secondary" 
              onClick={onClose}
              disabled={isChecking}
            >
              {status === 'open' ? 'Concluir' : 'Fechar'}
            </Button>
          </div>

          {/* Status da conexão */}
          <div className="text-xs text-gray-500 text-center">
            Status: {status} | Instância: {instanceName}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};