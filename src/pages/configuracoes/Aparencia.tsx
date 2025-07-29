import { Monitor, Palette, Eye, Settings, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/hooks/use-toast';
export default function Aparencia() {
  const {
    themeSettings,
    layoutSettings,
    accessibilitySettings,
    loading,
    updateThemeSettings,
    updateLayoutSettings,
    updateAccessibilitySettings,
    saveSettings
  } = useTheme();
  const colorSchemes = [{
    id: 'blue',
    name: 'Azul',
    color: 'bg-blue-500'
  }, {
    id: 'green',
    name: 'Verde',
    color: 'bg-green-500'
  }, {
    id: 'purple',
    name: 'Roxo',
    color: 'bg-purple-500'
  }, {
    id: 'orange',
    name: 'Laranja',
    color: 'bg-orange-500'
  }];
  const fontSizes = [{
    id: 'small',
    name: 'Pequeno'
  }, {
    id: 'medium',
    name: 'Médio'
  }, {
    id: 'large',
    name: 'Grande'
  }];
  const densityModes = [{
    id: 'compact',
    name: 'Compacto'
  }, {
    id: 'comfortable',
    name: 'Confortável'
  }, {
    id: 'spacious',
    name: 'Espaçoso'
  }];
  if (loading) {
    return (
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 animate-spin rounded-full border-4 border-amplie-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  return <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          
          
        </div>
        <Button onClick={saveSettings} className="bg-amplie-primary hover:bg-amplie-primary-light">
          Salvar Configurações
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Modo Noturno */}
        <Card className="p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Monitor className="w-5 h-5 mr-2 text-amplie-primary" />
            Modo de Exibição
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button onClick={() => updateThemeSettings({
            theme: 'light'
          })} className={`p-4 rounded-lg border-2 transition-all flex items-center space-x-3 ${themeSettings.theme === 'light' ? 'border-amplie-primary bg-amplie-primary/10' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}>
              <Sun className="w-5 h-5 text-yellow-500" />
              <div className="text-left">
                <div className="font-medium">Modo Claro</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Interface com fundo claro</div>
              </div>
            </button>
            <button onClick={() => updateThemeSettings({
            theme: 'dark'
          })} className={`p-4 rounded-lg border-2 transition-all flex items-center space-x-3 ${themeSettings.theme === 'dark' ? 'border-amplie-primary bg-amplie-primary/10' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}>
              <Moon className="w-5 h-5 text-blue-500" />
              <div className="text-left">
                <div className="font-medium">Modo Noturno</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Interface com fundo escuro</div>
              </div>
            </button>
          </div>
        </Card>

        {/* Esquema de Cores */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Palette className="w-5 h-5 mr-2 text-amplie-primary" />
            Esquema de Cores
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {colorSchemes.map(scheme => <button key={scheme.id} onClick={() => updateThemeSettings({
            colorScheme: scheme.id as any
          })} className={`p-3 rounded-lg border-2 transition-all flex items-center space-x-3 ${themeSettings.colorScheme === scheme.id ? 'border-amplie-primary bg-amplie-primary/10' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}>
                <div className={`w-4 h-4 rounded-full ${scheme.color}`}></div>
                <span className="text-sm font-medium">{scheme.name}</span>
              </button>)}
          </div>
        </Card>

        {/* Tipografia */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Settings className="w-5 h-5 mr-2 text-amplie-primary" />
            Tipografia
          </h3>
          <div className="space-y-3">
            <Label className="font-medium">Tamanho da Fonte</Label>
            {fontSizes.map(size => <button key={size.id} onClick={() => updateThemeSettings({
            fontSize: size.id as any
          })} className={`w-full p-3 text-left rounded-lg border-2 transition-all ${themeSettings.fontSize === size.id ? 'border-amplie-primary bg-amplie-primary/10' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}>
                <span className={`font-medium ${size.id === 'small' ? 'text-sm' : size.id === 'large' ? 'text-lg' : 'text-base'}`}>
                  {size.name}
                </span>
              </button>)}
          </div>
        </Card>

        {/* Layout */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Eye className="w-5 h-5 mr-2 text-amplie-primary" />
            Layout
          </h3>
          <div className="space-y-4">
            <div>
              <Label className="font-medium mb-3 block">Densidade</Label>
              <div className="space-y-2">
                {densityModes.map(mode => <button key={mode.id} onClick={() => updateLayoutSettings({
                densityMode: mode.id as any
              })} className={`w-full p-2 text-left rounded border transition-all ${layoutSettings.densityMode === mode.id ? 'border-amplie-primary bg-amplie-primary/10' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}>
                    <span className="text-sm font-medium">{mode.name}</span>
                  </button>)}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Modo Compacto</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">Reduzir espaçamento geral</p>
              </div>
              <Switch checked={themeSettings.compactMode} onCheckedChange={checked => updateThemeSettings({
              compactMode: checked
            })} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Mostrar Avatares</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">Exibir fotos de perfil</p>
              </div>
              <Switch checked={layoutSettings.showAvatars} onCheckedChange={checked => updateLayoutSettings({
              showAvatars: checked
            })} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Mostrar Timestamps</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">Exibir horários das mensagens</p>
              </div>
              <Switch checked={layoutSettings.showTimestamps} onCheckedChange={checked => updateLayoutSettings({
              showTimestamps: checked
            })} />
            </div>
          </div>
        </Card>

        {/* Animações e Efeitos */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Settings className="w-5 h-5 mr-2 text-amplie-primary" />
            Animações e Efeitos
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Animações</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">Habilitar animações de interface</p>
              </div>
              <Switch checked={themeSettings.animations} onCheckedChange={checked => updateThemeSettings({
              animations: checked
            })} />
            </div>
          </div>
        </Card>

        {/* Acessibilidade */}
        <Card className="p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Eye className="w-5 h-5 mr-2 text-amplie-primary" />
            Acessibilidade
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Alto Contraste</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">Aumentar contraste para melhor visibilidade</p>
              </div>
              <Switch checked={accessibilitySettings.highContrast} onCheckedChange={checked => updateAccessibilitySettings({
              highContrast: checked
            })} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Movimento Reduzido</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">Reduzir animações e transições</p>
              </div>
              <Switch checked={accessibilitySettings.reducedMotion} onCheckedChange={checked => updateAccessibilitySettings({
              reducedMotion: checked
            })} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Suporte a Leitor de Tela</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">Otimizar para leitores de tela</p>
              </div>
              <Switch checked={accessibilitySettings.screenReader} onCheckedChange={checked => updateAccessibilitySettings({
              screenReader: checked
            })} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Navegação por Teclado</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">Habilitar navegação completa por teclado</p>
              </div>
              <Switch checked={accessibilitySettings.keyboardNavigation} onCheckedChange={checked => updateAccessibilitySettings({
              keyboardNavigation: checked
            })} />
            </div>
          </div>
        </Card>
      </div>
    </div>;
}