import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

type Theme = 'light' | 'dark';
type ColorScheme = 'blue' | 'green' | 'purple' | 'orange';
type FontSize = 'small' | 'medium' | 'large';
type DensityMode = 'compact' | 'comfortable' | 'spacious';

interface ThemeSettings {
  theme: Theme;
  colorScheme: ColorScheme;
  fontSize: FontSize;
  compactMode: boolean;
  animations: boolean;
}

interface LayoutSettings {
  sidebarCollapsed: boolean;
  showAvatars: boolean;
  showTimestamps: boolean;
  densityMode: DensityMode;
}

interface AccessibilitySettings {
  highContrast: boolean;
  reducedMotion: boolean;
  screenReader: boolean;
  keyboardNavigation: boolean;
}

interface ThemeContextType {
  themeSettings: ThemeSettings;
  layoutSettings: LayoutSettings;
  accessibilitySettings: AccessibilitySettings;
  loading: boolean;
  updateThemeSettings: (settings: Partial<ThemeSettings>) => void;
  updateLayoutSettings: (settings: Partial<LayoutSettings>) => void;
  updateAccessibilitySettings: (settings: Partial<AccessibilitySettings>) => void;
  applyTheme: () => void;
  saveSettings: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const defaultThemeSettings: ThemeSettings = {
  theme: 'light',
  colorScheme: 'blue',
  fontSize: 'medium',
  compactMode: false,
  animations: true
};

const defaultLayoutSettings: LayoutSettings = {
  sidebarCollapsed: false,
  showAvatars: true,
  showTimestamps: true,
  densityMode: 'comfortable'
};

const defaultAccessibilitySettings: AccessibilitySettings = {
  highContrast: false,
  reducedMotion: false,
  screenReader: false,
  keyboardNavigation: true
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>(defaultThemeSettings);
  const [layoutSettings, setLayoutSettings] = useState<LayoutSettings>(defaultLayoutSettings);
  const [accessibilitySettings, setAccessibilitySettings] = useState<AccessibilitySettings>(defaultAccessibilitySettings);

  // Carregar configurações do localStorage baseado no usuário
  useEffect(() => {
    if (user?.id) {
      loadUserSettings();
    } else {
      setLoading(false);
    }
  }, [user?.id]);

  const loadUserSettings = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      
      // Usar localStorage com ID do usuário para sincronizar
      const savedTheme = localStorage.getItem(`theme-settings-${user.id}`);
      const savedLayout = localStorage.getItem(`layout-settings-${user.id}`);
      const savedAccessibility = localStorage.getItem(`accessibility-settings-${user.id}`);
      
      if (savedTheme) {
        setThemeSettings(JSON.parse(savedTheme));
      }
      
      if (savedLayout) {
        setLayoutSettings(JSON.parse(savedLayout));
      }
      
      if (savedAccessibility) {
        setAccessibilitySettings(JSON.parse(savedAccessibility));
      }
      
    } catch (error) {
      console.error('Erro ao carregar configurações de aparência:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettingsToStorage = (newThemeSettings?: Partial<ThemeSettings>, newLayoutSettings?: Partial<LayoutSettings>, newAccessibilitySettings?: Partial<AccessibilitySettings>) => {
    if (!user?.id) return;

    try {
      const currentTheme = newThemeSettings ? { ...themeSettings, ...newThemeSettings } : themeSettings;
      const currentLayout = newLayoutSettings ? { ...layoutSettings, ...newLayoutSettings } : layoutSettings;
      const currentAccessibility = newAccessibilitySettings ? { ...accessibilitySettings, ...newAccessibilitySettings } : accessibilitySettings;

      // Salvar no localStorage com ID do usuário
      localStorage.setItem(`theme-settings-${user.id}`, JSON.stringify(currentTheme));
      localStorage.setItem(`layout-settings-${user.id}`, JSON.stringify(currentLayout));
      localStorage.setItem(`accessibility-settings-${user.id}`, JSON.stringify(currentAccessibility));
      
    } catch (error) {
      console.error('Erro ao salvar configurações de aparência:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar suas configurações",
        variant: "destructive"
      });
    }
  };

  const updateThemeSettings = (settings: Partial<ThemeSettings>) => {
    const newSettings = { ...themeSettings, ...settings };
    setThemeSettings(newSettings);
    saveSettingsToStorage(settings);
  };

  const updateLayoutSettings = (settings: Partial<LayoutSettings>) => {
    const newSettings = { ...layoutSettings, ...settings };
    setLayoutSettings(newSettings);
    saveSettingsToStorage(undefined, settings);
  };

  const updateAccessibilitySettings = (settings: Partial<AccessibilitySettings>) => {
    const newSettings = { ...accessibilitySettings, ...settings };
    setAccessibilitySettings(newSettings);
    saveSettingsToStorage(undefined, undefined, settings);
  };

  const applyTheme = () => {
    const root = document.documentElement;
    
    // Apply theme - agora suporta dark mode
    if (themeSettings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Apply color scheme
    root.setAttribute('data-color-scheme', themeSettings.colorScheme);

    // Apply font size
    root.setAttribute('data-font-size', themeSettings.fontSize);

    // Apply density mode
    root.setAttribute('data-density', layoutSettings.densityMode);

    // Apply compact mode
    root.classList.toggle('compact-mode', themeSettings.compactMode);

    // Apply accessibility settings
    root.classList.toggle('high-contrast', accessibilitySettings.highContrast);
    root.classList.toggle('reduced-motion', accessibilitySettings.reducedMotion);
    root.classList.toggle('no-animations', !themeSettings.animations || accessibilitySettings.reducedMotion);

    console.log('Tema aplicado:', { themeSettings, layoutSettings, accessibilitySettings });
  };

  useEffect(() => {
    applyTheme();
  }, [themeSettings, layoutSettings, accessibilitySettings]);

  const handleSaveSettings = () => {
    saveSettingsToStorage();
    toast({
      title: "Configurações salvas",
      description: "Suas configurações de aparência foram salvas com sucesso"
    });
  };

  return (
    <ThemeContext.Provider value={{
      themeSettings,
      layoutSettings,
      accessibilitySettings,
      loading,
      updateThemeSettings,
      updateLayoutSettings,
      updateAccessibilitySettings,
      applyTheme,
      saveSettings: handleSaveSettings
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};