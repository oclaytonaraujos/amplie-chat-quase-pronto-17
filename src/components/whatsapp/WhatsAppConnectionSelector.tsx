import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useWhatsAppEvolution } from '@/hooks/useWhatsAppCompatibility';
import { Smartphone } from 'lucide-react';
import { SyncLoader } from '@/components/ui/sync-loader';

interface WhatsAppConnectionSelectorProps {
  value?: string;
  onValueChange: (value: string) => void;
  label?: string;
  placeholder?: string;
}

export function WhatsAppConnectionSelector({ 
  value, 
  onValueChange, 
  label = "Conexão WhatsApp",
  placeholder = "Selecione uma conexão"
}: WhatsAppConnectionSelectorProps) {
  const { instances, isLoading } = useWhatsAppEvolution();

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="flex items-center space-x-2 p-3 border rounded-md">
          <SyncLoader size="sm" />
          <span className="text-sm text-muted-foreground">Carregando conexões...</span>
        </div>
      </div>
    );
  }

  if (instances.length === 0) {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="flex items-center space-x-2 p-3 border rounded-md bg-muted">
          <Smartphone className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Nenhuma conexão WhatsApp disponível
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {instances.map((instance) => (
            <SelectItem key={instance.instanceName} value={instance.instanceName}>
              <div className="flex items-center space-x-2">
                <Smartphone className="h-4 w-4" />
                <span>{instance.instanceName}</span>
                <span className="text-muted-foreground">({instance.numero || 'N/A'})</span>
                <div className={`w-2 h-2 rounded-full ${
                  instance.status === 'connected' ? 'bg-green-500' : 
                  instance.status === 'connecting' ? 'bg-yellow-500' : 
                  instance.status === 'qr_required' ? 'bg-blue-500' : 'bg-red-500'
                }`} />
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function MultiWhatsAppConnectionSelector({ 
  value = [], 
  onValueChange, 
  label = "Conexões WhatsApp",
  placeholder = "Selecione uma ou mais conexões"
}: {
  value?: string[];
  onValueChange: (value: string[]) => void;
  label?: string;
  placeholder?: string;
}) {
  const { instances, isLoading } = useWhatsAppEvolution();

  const handleConnectionToggle = (instanceName: string) => {
    const newValue = value.includes(instanceName)
      ? value.filter(id => id !== instanceName)
      : [...value, instanceName];
    onValueChange(newValue);
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="flex items-center space-x-2 p-3 border rounded-md">
          <SyncLoader size="sm" />
          <span className="text-sm text-muted-foreground">Carregando conexões...</span>
        </div>
      </div>
    );
  }

  if (instances.length === 0) {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="flex items-center space-x-2 p-3 border rounded-md bg-muted">
          <Smartphone className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Nenhuma conexão WhatsApp disponível
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="border rounded-md p-3 space-y-2">
        {instances.map((instance) => (
          <div key={instance.instanceName} className="flex items-center space-x-2">
            <input
              type="checkbox"
              id={`connection-${instance.instanceName}`}
              checked={value.includes(instance.instanceName)}
              onChange={() => handleConnectionToggle(instance.instanceName)}
              className="rounded"
            />
            <label 
              htmlFor={`connection-${instance.instanceName}`}
              className="flex items-center space-x-2 cursor-pointer flex-1"
            >
              <Smartphone className="h-4 w-4" />
              <span>{instance.instanceName}</span>
              <span className="text-muted-foreground">({instance.numero || 'N/A'})</span>
              <div className={`w-2 h-2 rounded-full ${
                instance.status === 'connected' ? 'bg-green-500' : 
                instance.status === 'connecting' ? 'bg-yellow-500' : 
                instance.status === 'qr_required' ? 'bg-blue-500' : 'bg-red-500'
              }`} />
            </label>
          </div>
        ))}
        {value.length === 0 && (
          <p className="text-sm text-muted-foreground">{placeholder}</p>
        )}
      </div>
    </div>
  );
}