/**
 * Sistema de Exportação de Dados em múltiplos formatos
 */
import React, { useState } from 'react';
import { Download, FileText, Table, FileSpreadsheet } from 'lucide-react';
import { SyncLoaderInline } from '@/components/ui/sync-loader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface ExportData {
  title: string;
  data: any[];
  columns: { key: string; label: string; width?: number }[];
  metadata?: {
    period?: string;
    filters?: Record<string, any>;
    generatedAt?: Date;
    generatedBy?: string;
  };
}

interface DataExportProps {
  data: ExportData;
  formats?: ('pdf' | 'excel' | 'csv' | 'json')[];
  className?: string;
}

export function DataExport({ data, formats = ['pdf', 'excel', 'csv'], className }: DataExportProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<string>('');
  const { toast } = useToast();

  const formatOptions = {
    pdf: { label: 'PDF', icon: FileText, description: 'Documento formatado' },
    excel: { label: 'Excel', icon: FileSpreadsheet, description: 'Planilha editável' },
    csv: { label: 'CSV', icon: Table, description: 'Dados estruturados' },
    json: { label: 'JSON', icon: FileText, description: 'Dados brutos' }
  };

  const exportToPDF = async () => {
    const pdf = new jsPDF();
    
    // Cabeçalho
    pdf.setFontSize(20);
    pdf.text(data.title, 20, 20);
    
    if (data.metadata?.period) {
      pdf.setFontSize(12);
      pdf.text(`Período: ${data.metadata.period}`, 20, 35);
    }

    // Dados da tabela
    const tableData = data.data.map(row => 
      data.columns.map(col => row[col.key] || '')
    );

    (pdf as any).autoTable({
      head: [data.columns.map(col => col.label)],
      body: tableData,
      startY: data.metadata?.period ? 45 : 35,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 66, 66] },
      margin: { top: 20, right: 20, bottom: 20, left: 20 }
    });

    // Rodapé
    const pageCount = (pdf as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.text(
        `Gerado em ${new Date().toLocaleString()}`,
        20,
        pdf.internal.pageSize.height - 10
      );
      pdf.text(
        `Página ${i} de ${pageCount}`,
        pdf.internal.pageSize.width - 40,
        pdf.internal.pageSize.height - 10
      );
    }

    const fileName = `${data.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
  };

  const exportToExcel = async () => {
    const worksheet = XLSX.utils.json_to_sheet(data.data);
    const workbook = XLSX.utils.book_new();
    
    // Adicionar metadados como segunda aba
    if (data.metadata) {
      const metaData = [
        ['Título', data.title],
        ['Gerado em', new Date().toLocaleString()],
        ['Total de registros', data.data.length.toString()],
        ...(data.metadata.period ? [['Período', data.metadata.period]] : []),
        ...(data.metadata.generatedBy ? [['Gerado por', data.metadata.generatedBy]] : [])
      ];
      const metaSheet = XLSX.utils.aoa_to_sheet(metaData);
      XLSX.utils.book_append_sheet(workbook, metaSheet, 'Informações');
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Dados');
    
    const fileName = `${data.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const exportToCSV = async () => {
    const headers = data.columns.map(col => col.label).join(',');
    const rows = data.data.map(row => 
      data.columns.map(col => {
        const value = row[col.key] || '';
        // Escapar vírgulas e aspas
        return typeof value === 'string' && (value.includes(',') || value.includes('"'))
          ? `"${value.replace(/"/g, '""')}"`
          : value;
      }).join(',')
    );

    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${data.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    URL.revokeObjectURL(url);
  };

  const exportToJSON = async () => {
    const exportObject = {
      title: data.title,
      metadata: data.metadata,
      columns: data.columns,
      data: data.data,
      exportedAt: new Date().toISOString()
    };

    const json = JSON.stringify(exportObject, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${data.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    if (!selectedFormat) {
      toast({
        title: "Formato não selecionado",
        description: "Selecione um formato para exportar",
        variant: "destructive"
      });
      return;
    }

    setIsExporting(true);

    try {
      switch (selectedFormat) {
        case 'pdf':
          await exportToPDF();
          break;
        case 'excel':
          await exportToExcel();
          break;
        case 'csv':
          await exportToCSV();
          break;
        case 'json':
          await exportToJSON();
          break;
        default:
          throw new Error('Formato não suportado');
      }

      toast({
        title: "Exportação concluída",
        description: `Dados exportados em formato ${formatOptions[selectedFormat as keyof typeof formatOptions].label}`,
      });

    } catch (error) {
      console.error('Erro na exportação:', error);
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar os dados",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="w-5 h-5" />
          Exportar Dados
        </CardTitle>
        <CardDescription>
          Exporte {data.data.length} registros em diferentes formatos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          {formats.map((format) => {
            const option = formatOptions[format];
            const Icon = option.icon;
            
            return (
              <div
                key={format}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedFormat === format 
                    ? 'border-primary bg-primary/5' 
                    : 'hover:border-primary/50'
                }`}
                onClick={() => setSelectedFormat(format)}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{option.label}</p>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <Button 
          onClick={handleExport}
          disabled={!selectedFormat || isExporting}
          className="w-full"
        >
          {isExporting ? (
            <>
              <SyncLoaderInline />
              Exportando...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </>
          )}
        </Button>

        {data.metadata && (
          <div className="pt-4 border-t text-xs text-muted-foreground space-y-1">
            <p>📊 {data.data.length} registros</p>
            {data.metadata.period && <p>📅 {data.metadata.period}</p>}
            {data.metadata.generatedBy && <p>👤 {data.metadata.generatedBy}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Hook para preparar dados para exportação
export function useDataExport() {
  const prepareAnalyticsData = (analytics: any[], period: string) => {
    return {
      title: 'Relatório de Analytics',
      data: analytics,
      columns: [
        { key: 'date', label: 'Data' },
        { key: 'messages', label: 'Mensagens' },
        { key: 'contacts', label: 'Contatos' },
        { key: 'conversions', label: 'Conversões' }
      ],
      metadata: {
        period,
        generatedAt: new Date(),
        generatedBy: 'Sistema'
      }
    };
  };

  const prepareContactsData = (contacts: any[]) => {
    return {
      title: 'Lista de Contatos',
      data: contacts,
      columns: [
        { key: 'name', label: 'Nome' },
        { key: 'phone', label: 'Telefone' },
        { key: 'email', label: 'Email' },
        { key: 'status', label: 'Status' },
        { key: 'createdAt', label: 'Criado em' }
      ],
      metadata: {
        generatedAt: new Date(),
        generatedBy: 'Sistema'
      }
    };
  };

  return {
    prepareAnalyticsData,
    prepareContactsData
  };
}