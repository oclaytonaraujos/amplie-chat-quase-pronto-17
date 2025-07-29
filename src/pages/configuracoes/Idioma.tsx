import { Globe, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useLanguageSettings } from '@/hooks/useLanguageSettings';

export default function Idioma() {
  const {
    languageSettings,
    regionSettings,
    loading,
    updateLanguageSettings,
    updateRegionSettings,
    saveSettings
  } = useLanguageSettings();
  const languages = [{
    code: 'pt-BR',
    name: 'Português (Brasil)',
    flag: '🇧🇷'
  }, {
    code: 'en-US',
    name: 'English (US)',
    flag: '🇺🇸'
  }, {
    code: 'es-ES',
    name: 'Español (España)',
    flag: '🇪🇸'
  }, {
    code: 'fr-FR',
    name: 'Français (France)',
    flag: '🇫🇷'
  }, {
    code: 'de-DE',
    name: 'Deutsch (Deutschland)',
    flag: '🇩🇪'
  }, {
    code: 'it-IT',
    name: 'Italiano (Italia)',
    flag: '🇮🇹'
  }, {
    code: 'ja-JP',
    name: '日本語 (日本)',
    flag: '🇯🇵'
  }, {
    code: 'ko-KR',
    name: '한국어 (대한민국)',
    flag: '🇰🇷'
  }, {
    code: 'zh-CN',
    name: '中文 (简体)',
    flag: '🇨🇳'
  }, {
    code: 'ru-RU',
    name: 'Русский (Россия)',
    flag: '🇷🇺'
  }];
  const timezones = [{
    code: 'America/Sao_Paulo',
    name: 'São Paulo (UTC-3)'
  }, {
    code: 'America/New_York',
    name: 'New York (UTC-5)'
  }, {
    code: 'Europe/London',
    name: 'London (UTC+0)'
  }, {
    code: 'Europe/Paris',
    name: 'Paris (UTC+1)'
  }, {
    code: 'Asia/Tokyo',
    name: 'Tokyo (UTC+9)'
  }, {
    code: 'Australia/Sydney',
    name: 'Sydney (UTC+10)'
  }];
  const currencies = [{
    code: 'BRL',
    name: 'Real Brasileiro (R$)',
    symbol: 'R$'
  }, {
    code: 'USD',
    name: 'Dólar Americano ($)',
    symbol: '$'
  }, {
    code: 'EUR',
    name: 'Euro (€)',
    symbol: '€'
  }, {
    code: 'GBP',
    name: 'Libra Esterlina (£)',
    symbol: '£'
  }, {
    code: 'JPY',
    name: 'Iene Japonês (¥)',
    symbol: '¥'
  }];
  const dateFormats = [{
    code: 'DD/MM/YYYY',
    name: '31/12/2024',
    example: '31/12/2024'
  }, {
    code: 'MM/DD/YYYY',
    name: '12/31/2024',
    example: '12/31/2024'
  }, {
    code: 'YYYY-MM-DD',
    name: '2024-12-31',
    example: '2024-12-31'
  }, {
    code: 'DD-MM-YYYY',
    name: '31-12-2024',
    example: '31-12-2024'
  }];
  const timeFormats = [{
    code: '24h',
    name: '24 horas',
    example: '14:30'
  }, {
    code: '12h',
    name: '12 horas',
    example: '2:30 PM'
  }];
  const weekStartOptions = [{
    code: 'sunday',
    name: 'Domingo'
  }, {
    code: 'monday',
    name: 'Segunda-feira'
  }];
  const handleLanguageChange = (field: string, value: string | boolean) => {
    updateLanguageSettings({ [field]: value } as any);
  };
  
  const handleRegionChange = (field: string, value: string) => {
    updateRegionSettings({ [field]: value } as any);
  };
  
  const handleSave = () => {
    saveSettings();
  };
  if (loading) {
    return (
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-amplie-primary" />
        </div>
      </div>
    );
  }

  return <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          
          
        </div>
        <Button onClick={handleSave} className="bg-amplie-primary hover:bg-amplie-primary-light">
          Salvar Configurações
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configurações de Idioma */}
        <Card className="p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Globe className="w-5 h-5 mr-2 text-amplie-primary" />
            Idioma Principal
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
            {languages.map(language => <button key={language.code} onClick={() => handleLanguageChange('primaryLanguage', language.code)} className={`p-3 rounded-lg border-2 transition-all flex items-center space-x-3 ${languageSettings.primaryLanguage === language.code ? 'border-amplie-primary bg-amplie-primary/10' : 'border-gray-200 hover:border-gray-300'}`}>
                <span className="text-xl">{language.flag}</span>
                <span className="text-sm font-medium flex-1 text-left">{language.name}</span>
                {languageSettings.primaryLanguage === language.code && <Check className="w-4 h-4 text-amplie-primary" />}
              </button>)}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Detecção Automática</Label>
                <p className="text-sm text-gray-500">Detectar idioma automaticamente baseado no navegador</p>
              </div>
              <Switch checked={languageSettings.autoDetect} onCheckedChange={checked => handleLanguageChange('autoDetect', checked)} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Traduzir Mensagens</Label>
                <p className="text-sm text-gray-500">Oferecer tradução automática de mensagens</p>
              </div>
              <Switch checked={languageSettings.translateMessages} onCheckedChange={checked => handleLanguageChange('translateMessages', checked)} />
            </div>
          </div>
        </Card>

        {/* Formato de Data e Hora */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Formato de Data e Hora</h3>
          <div className="space-y-4">
            <div>
              <Label className="font-medium mb-2 block">Formato de Data</Label>
              <div className="space-y-2">
                {dateFormats.map(format => <button key={format.code} onClick={() => handleLanguageChange('dateFormat', format.code)} className={`w-full p-2 text-left rounded border transition-all flex items-center justify-between ${languageSettings.dateFormat === format.code ? 'border-amplie-primary bg-amplie-primary/10' : 'border-gray-200 hover:border-gray-300'}`}>
                    <span className="text-sm font-medium">{format.name}</span>
                    <span className="text-xs text-gray-500">{format.example}</span>
                  </button>)}
              </div>
            </div>

            <div>
              <Label className="font-medium mb-2 block">Formato de Hora</Label>
              <div className="space-y-2">
                {timeFormats.map(format => <button key={format.code} onClick={() => handleLanguageChange('timeFormat', format.code)} className={`w-full p-2 text-left rounded border transition-all flex items-center justify-between ${languageSettings.timeFormat === format.code ? 'border-amplie-primary bg-amplie-primary/10' : 'border-gray-200 hover:border-gray-300'}`}>
                    <span className="text-sm font-medium">{format.name}</span>
                    <span className="text-xs text-gray-500">{format.example}</span>
                  </button>)}
              </div>
            </div>
          </div>
        </Card>

        {/* Configurações Regionais */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Configurações Regionais</h3>
          <div className="space-y-4">
            <div>
              <Label className="font-medium mb-2 block">Fuso Horário</Label>
              <select value={regionSettings.timezone} onChange={e => handleRegionChange('timezone', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md">
                {timezones.map(timezone => <option key={timezone.code} value={timezone.code}>
                    {timezone.name}
                  </option>)}
              </select>
            </div>

            <div>
              <Label className="font-medium mb-2 block">Moeda</Label>
              <select value={regionSettings.currency} onChange={e => handleRegionChange('currency', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md">
                {currencies.map(currency => <option key={currency.code} value={currency.code}>
                    {currency.name}
                  </option>)}
              </select>
            </div>

            <div>
              <Label className="font-medium mb-2 block">Primeiro Dia da Semana</Label>
              <div className="space-y-2">
                {weekStartOptions.map(option => <button key={option.code} onClick={() => handleRegionChange('firstDayOfWeek', option.code)} className={`w-full p-2 text-left rounded border transition-all ${regionSettings.firstDayOfWeek === option.code ? 'border-amplie-primary bg-amplie-primary/10' : 'border-gray-200 hover:border-gray-300'}`}>
                    <span className="text-sm font-medium">{option.name}</span>
                  </button>)}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>;
}