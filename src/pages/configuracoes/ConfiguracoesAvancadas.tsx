
import { useState } from 'react';
import { Settings, Database, Zap, Code, Download, Upload, RotateCcw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';

export default function ConfiguracoesAvancadas() {
  const [performanceSettings, setPerformanceSettings] = useState({
    hardwareAcceleration: true,
    autoUpdates: true,
    backgroundSync: true,
    cacheSize: 500,
    preloadContent: false,
    compressionLevel: 'medium'
  });

  const [developerSettings, setDeveloperSettings] = useState({
    debugMode: false,
    verboseLogging: false,
    apiLogging: false,
    developmentMode: false,
    experimentalFeatures: false
  });

  const [dataSettings, setDataSettings] = useState({
    autoBackup: true,
    backupFrequency: 'weekly',
    dataRetention: 90,
    exportFormat: 'json'
  });

  const [integrationSettings, setIntegrationSettings] = useState({
    webhooks: false,
    apiAccess: false,
    customDomain: '',
    sslForced: true
  });

  const handlePerformanceChange = (field: string, value: string | number | boolean) => {
    setPerformanceSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleDeveloperChange = (field: string, value: boolean) => {
    setDeveloperSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleDataChange = (field: string, value: string | number | boolean) => {
    setDataSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleIntegrationChange = (field: string, value: string | boolean) => {
    setIntegrationSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    console.log('Salvando configurações avançadas...');
  };

  const handleClearCache = () => {
    console.log('Limpando cache...');
  };

  const handleExportSettings = () => {
    console.log('Exportando configurações...');
  };

  const handleImportSettings = () => {
    console.log('Importando configurações...');
  };

  const handleResetToDefaults = () => {
    console.log('Restaurando configurações padrão...');
  };

  const compressionLevels = [
    { value: 'low', label: 'Baixa' },
    { value: 'medium', label: 'Média' },
    { value: 'high', label: 'Alta' }
  ];

  const backupFrequencies = [
    { value: 'daily', label: 'Diário' },
    { value: 'weekly', label: 'Semanal' },
    { value: 'monthly', label: 'Mensal' }
  ];

  const exportFormats = [
    { value: 'json', label: 'JSON' },
    { value: 'csv', label: 'CSV' },
    { value: 'xml', label: 'XML' }
  ];

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configurações Avançadas</h1>
          <p className="text-gray-500">Configurações técnicas e avançadas do sistema</p>
        </div>
        <Button 
          onClick={handleSave}
          className="bg-amplie-primary hover:bg-amplie-primary-light"
        >
          Salvar Configurações
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Zap className="w-5 h-5 mr-2 text-amplie-primary" />
            Performance
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Aceleração de Hardware</Label>
                <p className="text-sm text-gray-500">Usar GPU para melhor performance</p>
              </div>
              <Switch
                checked={performanceSettings.hardwareAcceleration}
                onCheckedChange={(checked) => handlePerformanceChange('hardwareAcceleration', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Atualizações Automáticas</Label>
                <p className="text-sm text-gray-500">Baixar atualizações automaticamente</p>
              </div>
              <Switch
                checked={performanceSettings.autoUpdates}
                onCheckedChange={(checked) => handlePerformanceChange('autoUpdates', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Sincronização em Background</Label>
                <p className="text-sm text-gray-500">Sincronizar dados quando inativo</p>
              </div>
              <Switch
                checked={performanceSettings.backgroundSync}
                onCheckedChange={(checked) => handlePerformanceChange('backgroundSync', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Pré-carregar Conteúdo</Label>
                <p className="text-sm text-gray-500">Carregar conteúdo antecipadamente</p>
              </div>
              <Switch
                checked={performanceSettings.preloadContent}
                onCheckedChange={(checked) => handlePerformanceChange('preloadContent', checked)}
              />
            </div>
            <div>
              <Label htmlFor="cacheSize" className="font-medium">Tamanho do Cache (MB)</Label>
              <Input
                id="cacheSize"
                type="number"
                value={performanceSettings.cacheSize}
                onChange={(e) => handlePerformanceChange('cacheSize', parseInt(e.target.value))}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="font-medium mb-2 block">Nível de Compressão</Label>
              <select
                value={performanceSettings.compressionLevel}
                onChange={(e) => handlePerformanceChange('compressionLevel', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                {compressionLevels.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Desenvolvedor */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Code className="w-5 h-5 mr-2 text-amplie-primary" />
            Desenvolvedor
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Modo Debug</Label>
                <p className="text-sm text-gray-500">Ativar informações de debug</p>
              </div>
              <Switch
                checked={developerSettings.debugMode}
                onCheckedChange={(checked) => handleDeveloperChange('debugMode', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Log Detalhado</Label>
                <p className="text-sm text-gray-500">Registrar informações detalhadas</p>
              </div>
              <Switch
                checked={developerSettings.verboseLogging}
                onCheckedChange={(checked) => handleDeveloperChange('verboseLogging', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Log de API</Label>
                <p className="text-sm text-gray-500">Registrar chamadas de API</p>
              </div>
              <Switch
                checked={developerSettings.apiLogging}
                onCheckedChange={(checked) => handleDeveloperChange('apiLogging', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Modo Desenvolvimento</Label>
                <p className="text-sm text-gray-500">Ativar recursos de desenvolvimento</p>
              </div>
              <Switch
                checked={developerSettings.developmentMode}
                onCheckedChange={(checked) => handleDeveloperChange('developmentMode', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Recursos Experimentais</Label>
                <p className="text-sm text-gray-500">Ativar funcionalidades beta</p>
              </div>
              <Switch
                checked={developerSettings.experimentalFeatures}
                onCheckedChange={(checked) => handleDeveloperChange('experimentalFeatures', checked)}
              />
            </div>
          </div>
        </Card>

        {/* Dados e Backup */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Database className="w-5 h-5 mr-2 text-amplie-primary" />
            Dados e Backup
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Backup Automático</Label>
                <p className="text-sm text-gray-500">Fazer backup dos dados automaticamente</p>
              </div>
              <Switch
                checked={dataSettings.autoBackup}
                onCheckedChange={(checked) => handleDataChange('autoBackup', checked)}
              />
            </div>
            <div>
              <Label className="font-medium mb-2 block">Frequência do Backup</Label>
              <select
                value={dataSettings.backupFrequency}
                onChange={(e) => handleDataChange('backupFrequency', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                {backupFrequencies.map((freq) => (
                  <option key={freq.value} value={freq.value}>
                    {freq.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="dataRetention" className="font-medium">Retenção de Dados (dias)</Label>
              <Input
                id="dataRetention"
                type="number"
                value={dataSettings.dataRetention}
                onChange={(e) => handleDataChange('dataRetention', parseInt(e.target.value))}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="font-medium mb-2 block">Formato de Exportação</Label>
              <select
                value={dataSettings.exportFormat}
                onChange={(e) => handleDataChange('exportFormat', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                {exportFormats.map((format) => (
                  <option key={format.value} value={format.value}>
                    {format.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Integrações */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Settings className="w-5 h-5 mr-2 text-amplie-primary" />
            Integrações
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Webhooks</Label>
                <p className="text-sm text-gray-500">Permitir webhooks de terceiros</p>
              </div>
              <Switch
                checked={integrationSettings.webhooks}
                onCheckedChange={(checked) => handleIntegrationChange('webhooks', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Acesso à API</Label>
                <p className="text-sm text-gray-500">Habilitar acesso programático</p>
              </div>
              <Switch
                checked={integrationSettings.apiAccess}
                onCheckedChange={(checked) => handleIntegrationChange('apiAccess', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">SSL Forçado</Label>
                <p className="text-sm text-gray-500">Exigir conexões seguras</p>
              </div>
              <Switch
                checked={integrationSettings.sslForced}
                onCheckedChange={(checked) => handleIntegrationChange('sslForced', checked)}
              />
            </div>
            <div>
              <Label htmlFor="customDomain" className="font-medium">Domínio Personalizado</Label>
              <Input
                id="customDomain"
                type="text"
                placeholder="exemplo.com"
                value={integrationSettings.customDomain}
                onChange={(e) => handleIntegrationChange('customDomain', e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </Card>

        {/* Ferramentas de Sistema */}
        <Card className="p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Settings className="w-5 h-5 mr-2 text-amplie-primary" />
            Ferramentas de Sistema
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button 
              onClick={handleClearCache}
              variant="outline"
              className="flex flex-col items-center p-4 h-auto"
            >
              <Database className="w-6 h-6 mb-2" />
              <span className="text-sm">Limpar Cache</span>
            </Button>
            <Button 
              onClick={handleExportSettings}
              variant="outline"
              className="flex flex-col items-center p-4 h-auto"
            >
              <Download className="w-6 h-6 mb-2" />
              <span className="text-sm">Exportar Configurações</span>
            </Button>
            <Button 
              onClick={handleImportSettings}
              variant="outline"
              className="flex flex-col items-center p-4 h-auto"
            >
              <Upload className="w-6 h-6 mb-2" />
              <span className="text-sm">Importar Configurações</span>
            </Button>
            <Button 
              onClick={handleResetToDefaults}
              variant="outline"
              className="flex flex-col items-center p-4 h-auto text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <RotateCcw className="w-6 h-6 mb-2" />
              <span className="text-sm">Restaurar Padrões</span>
            </Button>
          </div>
        </Card>

        {/* Avisos */}
        <Card className="p-6 lg:col-span-2 bg-amber-50 border-amber-200">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-800">Atenção</h4>
              <p className="text-sm text-amber-700 mt-1">
                As configurações avançadas podem afetar significativamente o comportamento do sistema. 
                Modifique apenas se você entender as implicações. Algumas alterações podem requerer 
                reinicialização da aplicação para terem efeito.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
