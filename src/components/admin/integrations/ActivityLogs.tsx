import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface LogEntry {
  id: string;
  timestamp: string;
  integration: string;
  type: 'request' | 'response' | 'error' | 'config';
  status: 'success' | 'error' | 'pending';
  method?: string;
  endpoint?: string;
  statusCode?: number;
  responseTime?: number;
  message: string;
  details?: any;
}

interface ActivityLogsProps {
  logs: LogEntry[];
  onRefresh: () => void;
  onViewDetails: (log: LogEntry) => void;
}

const statusConfig = {
  success: {
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: CheckCircle,
    label: 'Sucesso'
  },
  error: {
    color: 'bg-red-50 text-red-700 border-red-200',
    icon: AlertTriangle,
    label: 'Erro'
  },
  pending: {
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: Clock,
    label: 'Pendente'
  }
};

const typeConfig = {
  request: { color: 'bg-blue-100 text-blue-800', label: 'Requisição' },
  response: { color: 'bg-green-100 text-green-800', label: 'Resposta' },
  error: { color: 'bg-red-100 text-red-800', label: 'Erro' },
  config: { color: 'bg-purple-100 text-purple-800', label: 'Configuração' }
};

export default function ActivityLogs({ logs, onRefresh, onViewDetails }: ActivityLogsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterIntegration, setFilterIntegration] = useState<string>('all');

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.integration.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || log.status === filterStatus;
    const matchesType = filterType === 'all' || log.type === filterType;
    const matchesIntegration = filterIntegration === 'all' || log.integration === filterIntegration;

    return matchesSearch && matchesStatus && matchesType && matchesIntegration;
  });

  const integrations = Array.from(new Set(logs.map(log => log.integration)));

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig];
    const StatusIcon = config.icon;
    
    return (
      <Badge variant="outline" className={config.color}>
        <StatusIcon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const config = typeConfig[type as keyof typeof typeConfig];
    return (
      <Badge variant="outline" className={config.color}>
        {config.label}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Logs de Atividade</CardTitle>
            <CardDescription>
              Histórico detalhado de todas as operações das integrações
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onRefresh}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="success">Sucesso</SelectItem>
              <SelectItem value="error">Erro</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger>
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="request">Requisição</SelectItem>
              <SelectItem value="response">Resposta</SelectItem>
              <SelectItem value="error">Erro</SelectItem>
              <SelectItem value="config">Configuração</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterIntegration} onValueChange={setFilterIntegration}>
            <SelectTrigger>
              <SelectValue placeholder="Integração" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as integrações</SelectItem>
              {integrations.map(integration => (
                <SelectItem key={integration} value={integration}>
                  {integration}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Lista de Logs */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Filter className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum log encontrado com os filtros aplicados</p>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <Card key={log.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{log.integration}</span>
                        {getTypeBadge(log.type)}
                        {getStatusBadge(log.status)}
                        {log.method && log.statusCode && (
                          <Badge variant="outline" className="text-xs">
                            {log.method} {log.statusCode}
                          </Badge>
                        )}
                        {log.responseTime && (
                          <Badge variant="outline" className="text-xs">
                            {log.responseTime}ms
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{log.message}</p>
                      {log.endpoint && (
                        <p className="text-xs font-mono text-muted-foreground">{log.endpoint}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewDetails(log)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}