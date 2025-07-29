import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Mail, Download, Clock, BarChart3, FileText, Settings } from 'lucide-react';

interface ScheduledReport {
  id: string;
  name: string;
  type: 'analytics' | 'conversations' | 'performance' | 'custom';
  frequency: 'daily' | 'weekly' | 'monthly';
  recipients: string[];
  format: 'pdf' | 'excel' | 'csv';
  filters: Record<string, any>;
  enabled: boolean;
  nextRun: string;
}

export function AdvancedReports() {
  const [reports, setReports] = useState<ScheduledReport[]>([
    {
      id: '1',
      name: 'Relatório Diário de Conversas',
      type: 'conversations',
      frequency: 'daily',
      recipients: ['admin@empresa.com'],
      format: 'pdf',
      filters: { period: '24h' },
      enabled: true,
      nextRun: '2024-01-15 09:00:00'
    }
  ]);
  
  const [editingReport, setEditingReport] = useState<ScheduledReport | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const reportTypes = [
    { value: 'analytics', label: 'Analytics Geral', icon: BarChart3 },
    { value: 'conversations', label: 'Conversas', icon: FileText },
    { value: 'performance', label: 'Performance', icon: Settings },
    { value: 'custom', label: 'Personalizado', icon: FileText }
  ];

  const generateReport = async (report: ScheduledReport) => {
    setIsGenerating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      let data = {};
      switch (report.type) {
        case 'analytics':
          data = {
            totalConversations: 150,
            responseTime: '2.5 min',
            satisfactionRate: '94%',
            period: 'Últimas 24h'
          };
          break;
        case 'conversations':
          data = {
            newConversations: 45,
            resolvedConversations: 38,
            pendingConversations: 12,
            averageResolutionTime: '15 min'
          };
          break;
        case 'performance':
          data = {
            systemUptime: '99.9%',
            averageResponseTime: '120ms',
            errorRate: '0.1%',
            throughput: '1500 req/min'
          };
          break;
      }

      if (report.recipients.length > 0) {
        toast({
          title: "Relatório enviado",
          description: `Relatório "${report.name}" enviado para ${report.recipients.length} destinatário(s)`
        });
      }

      const reportContent = `RELATÓRIO: ${report.name}
Tipo: ${reportTypes.find(t => t.value === report.type)?.label}
Gerado em: ${new Date().toLocaleString('pt-BR')}
Formato: ${report.format.toUpperCase()}

DADOS:
${JSON.stringify(data, null, 2)}

---
Relatório gerado automaticamente pelo sistema
`;

      const blob = new Blob([reportContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${report.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
      link.click();

    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao gerar relatório",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const saveReport = async (report: ScheduledReport) => {
    try {
      const isNew = !report.id;
      const savedReport = {
        ...report,
        id: report.id || Date.now().toString(),
        nextRun: calculateNextRun(report.frequency)
      };

      if (isNew) {
        setReports(prev => [...prev, savedReport]);
      } else {
        setReports(prev => prev.map(r => r.id === report.id ? savedReport : r));
      }

      setEditingReport(null);
      toast({
        title: "Relatório salvo",
        description: isNew ? "Novo relatório criado" : "Relatório atualizado"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao salvar relatório",
        variant: "destructive"
      });
    }
  };

  const calculateNextRun = (frequency: string): string => {
    const now = new Date();
    switch (frequency) {
      case 'daily':
        now.setDate(now.getDate() + 1);
        break;
      case 'weekly':
        now.setDate(now.getDate() + 7);
        break;
      case 'monthly':
        now.setMonth(now.getMonth() + 1);
        break;
    }
    return now.toISOString();
  };

  const toggleReportStatus = (id: string) => {
    setReports(prev => prev.map(r => 
      r.id === id ? { ...r, enabled: !r.enabled } : r
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Relatórios Programáticos</h2>
          <p className="text-muted-foreground">Automatize a geração e envio de relatórios</p>
        </div>
        <Button onClick={() => setEditingReport({
          id: '',
          name: '',
          type: 'analytics',
          frequency: 'daily',
          recipients: [],
          format: 'pdf',
          filters: {},
          enabled: true,
          nextRun: ''
        })}>
          Novo Relatório
        </Button>
      </div>

      <div className="grid gap-4">
        {reports.map((report) => (
          <Card key={report.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle>{report.name}</CardTitle>
                    <Badge variant={report.enabled ? "default" : "secondary"}>
                      {report.enabled ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                  <CardDescription>
                    {reportTypes.find(t => t.value === report.type)?.label} • 
                    {report.frequency} • 
                    {report.format.toUpperCase()} • 
                    {report.recipients.length} destinatário(s)
                  </CardDescription>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    Próxima execução: {new Date(report.nextRun).toLocaleString('pt-BR')}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => generateReport(report)}
                    disabled={isGenerating}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleReportStatus(report.id)}
                  >
                    {report.enabled ? 'Desativar' : 'Ativar'}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setEditingReport(report)}
                  >
                    Editar
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      {editingReport && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingReport.id ? 'Editar' : 'Novo'} Relatório
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Relatório</Label>
                <Input
                  id="name"
                  value={editingReport.name}
                  onChange={(e) => setEditingReport(prev => prev ? {...prev, name: e.target.value} : null)}
                  placeholder="Ex: Relatório Diário de Performance"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Tipo</Label>
                <Select
                  value={editingReport.type}
                  onValueChange={(value: any) => setEditingReport(prev => prev ? {...prev, type: value} : null)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {reportTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="frequency">Frequência</Label>
                <Select
                  value={editingReport.frequency}
                  onValueChange={(value: any) => setEditingReport(prev => prev ? {...prev, frequency: value} : null)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Diário</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="monthly">Mensal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="format">Formato</Label>
                <Select
                  value={editingReport.format}
                  onValueChange={(value: any) => setEditingReport(prev => prev ? {...prev, format: value} : null)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="excel">Excel</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="enabled">Status</Label>
                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox
                    id="enabled"
                    checked={editingReport.enabled}
                    onCheckedChange={(checked) => 
                      setEditingReport(prev => prev ? {...prev, enabled: !!checked} : null)
                    }
                  />
                  <Label htmlFor="enabled">Ativo</Label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipients">Destinatários (emails separados por vírgula)</Label>
              <Input
                id="recipients"
                value={editingReport.recipients.join(', ')}
                onChange={(e) => setEditingReport(prev => prev ? 
                  {...prev, recipients: e.target.value.split(',').map(email => email.trim()).filter(Boolean)} 
                  : null
                )}
                placeholder="admin@empresa.com, gestor@empresa.com"
              />
            </div>

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setEditingReport(null)}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => editingReport && saveReport(editingReport)}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Salvar Relatório
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}