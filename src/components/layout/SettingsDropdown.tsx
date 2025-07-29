
import { Settings, Bell, Monitor, Sun, Globe, Moon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useTheme } from '@/hooks/useTheme';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger
} from '@/components/ui/dropdown-menu';

export function SettingsDropdown() {
  const navigate = useNavigate();
  const { themeSettings, updateThemeSettings } = useTheme();

  const handleNavigateTo = (path: string) => {
    navigate(path);
  };

  const toggleDarkMode = () => {
    updateThemeSettings({ 
      theme: themeSettings.theme === 'dark' ? 'light' : 'dark' 
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="hidden sm:flex">
          <Settings className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-gray-800">
        <DropdownMenuLabel className="text-gray-900 dark:text-white">Configurações</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Modo Noturno */}
        <div className="flex items-center justify-between px-2 py-2">
          <div className="flex items-center space-x-2">
            {themeSettings.theme === 'dark' ? (
              <Moon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            ) : (
              <Sun className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            )}
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
              Modo Noturno
            </span>
          </div>
          <Switch
            checked={themeSettings.theme === 'dark'}
            onCheckedChange={toggleDarkMode}
          />
        </div>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={() => handleNavigateTo('/configuracoes/notificacoes')} className="cursor-pointer">
          <Bell className="mr-2 h-4 w-4" />
          Preferências de Notificação
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={() => handleNavigateTo('/configuracoes/aparencia')} className="cursor-pointer">
          <Monitor className="mr-2 h-4 w-4" />
          Aparência
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => handleNavigateTo('/configuracoes/idioma')} className="cursor-pointer">
          <Globe className="mr-2 h-4 w-4" />
          Idioma
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
