import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useWhatsAppConnection } from '@/contexts/WhatsAppConnectionContext';
import { Loader2, Smartphone } from 'lucide-react';

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
  const { connections: connectionStatuses, isLoading: loading } = useWhatsAppConnection();
  
  // Converter para formato esperado
  const connections = connectionStatuses.map(conn => ({
    id: conn.instanceName,
    nome: conn.instanceName,
    numero: conn.numero || 'N/A',
    status: conn.status === 'connected' ? 'conectado' : 'desconectado',
    evolution_status: conn.status
  }));

  if (loading) {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="flex items-center space-x-2 p-3 border rounded-md">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm text-muted-foreground">Carregando conexões...</span>
        </div>
      </div>
    );
  }

  if (connections.length === 0) {
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
          {connections.map((connection) => (
            <SelectItem key={connection.id} value={connection.id}>
              <div className="flex items-center space-x-2">
                <Smartphone className="h-4 w-4" />
                <span>{connection.nome}</span>
                <span className="text-muted-foreground">({connection.numero})</span>
                <div className={`w-2 h-2 rounded-full ${
                  (connection as any).evolution_status === 'open' || connection.status === 'conectado' ? 'bg-green-500' : 
                  (connection as any).evolution_status === 'connecting' || connection.status === 'pendente' ? 'bg-yellow-500' : 'bg-red-500'
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
  const { connections: connectionStatuses, isLoading: loading } = useWhatsAppConnection();
  
  // Converter para formato esperado
  const connections = connectionStatuses.map(conn => ({
    id: conn.instanceName,
    nome: conn.instanceName,
    numero: conn.numero || 'N/A',
    status: conn.status === 'connected' ? 'conectado' : 'desconectado',
    evolution_status: conn.status
  }));

  const handleConnectionToggle = (connectionId: string) => {
    const newValue = value.includes(connectionId)
      ? value.filter(id => id !== connectionId)
      : [...value, connectionId];
    onValueChange(newValue);
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="flex items-center space-x-2 p-3 border rounded-md">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm text-muted-foreground">Carregando conexões...</span>
        </div>
      </div>
    );
  }

  if (connections.length === 0) {
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
        {connections.map((connection) => (
          <div key={connection.id} className="flex items-center space-x-2">
            <input
              type="checkbox"
              id={`connection-${connection.id}`}
              checked={value.includes(connection.id)}
              onChange={() => handleConnectionToggle(connection.id)}
              className="rounded"
            />
            <label 
              htmlFor={`connection-${connection.id}`}
              className="flex items-center space-x-2 cursor-pointer flex-1"
            >
              <Smartphone className="h-4 w-4" />
              <span>{connection.nome}</span>
              <span className="text-muted-foreground">({connection.numero})</span>
              <div className={`w-2 h-2 rounded-full ${
                (connection as any).evolution_status === 'open' || connection.status === 'conectado' ? 'bg-green-500' : 
                (connection as any).evolution_status === 'connecting' || connection.status === 'pendente' ? 'bg-yellow-500' : 'bg-red-500'
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