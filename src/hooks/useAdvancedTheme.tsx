/**
 * Sistema de Temas Avançado com suporte a temas personalizados
 */
import { useTheme } from '@/hooks/useTheme';
import { useEffect, useState } from 'react';

interface CustomTheme {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  borderRadius: number;
  fontFamily: string;
  isDark: boolean;
  isDefault?: boolean;
}

const defaultThemes: CustomTheme[] = [
  {
    id: 'blue-light',
    name: 'Azul Claro',
    primaryColor: 'hsl(221, 83%, 53%)',
    secondaryColor: 'hsl(221, 83%, 95%)',
    accentColor: 'hsl(221, 83%, 70%)',
    backgroundColor: 'hsl(0, 0%, 100%)',
    textColor: 'hsl(222, 84%, 5%)',
    borderRadius: 6,
    fontFamily: 'Inter',
    isDark: false,
    isDefault: true
  },
  {
    id: 'blue-dark',
    name: 'Azul Escuro',
    primaryColor: 'hsl(221, 83%, 53%)',
    secondaryColor: 'hsl(217, 32%, 17%)',
    accentColor: 'hsl(221, 83%, 70%)',
    backgroundColor: 'hsl(222, 84%, 5%)',
    textColor: 'hsl(210, 40%, 98%)',
    borderRadius: 6,
    fontFamily: 'Inter',
    isDark: true
  },
  {
    id: 'green-light',
    name: 'Verde Natureza',
    primaryColor: 'hsl(142, 71%, 45%)',
    secondaryColor: 'hsl(142, 71%, 95%)',
    accentColor: 'hsl(142, 71%, 65%)',
    backgroundColor: 'hsl(0, 0%, 100%)',
    textColor: 'hsl(222, 84%, 5%)',
    borderRadius: 8,
    fontFamily: 'Inter',
    isDark: false
  },
  {
    id: 'purple-dark',
    name: 'Roxo Premium',
    primaryColor: 'hsl(263, 70%, 50%)',
    secondaryColor: 'hsl(263, 70%, 15%)',
    accentColor: 'hsl(263, 70%, 70%)',
    backgroundColor: 'hsl(263, 70%, 8%)',
    textColor: 'hsl(210, 40%, 98%)',
    borderRadius: 12,
    fontFamily: 'Inter',
    isDark: true
  },
  {
    id: 'orange-warm',
    name: 'Laranja Caloroso',
    primaryColor: 'hsl(25, 95%, 53%)',
    secondaryColor: 'hsl(25, 95%, 95%)',
    accentColor: 'hsl(25, 95%, 70%)',
    backgroundColor: 'hsl(30, 40%, 98%)',
    textColor: 'hsl(222, 84%, 5%)',
    borderRadius: 10,
    fontFamily: 'Inter',
    isDark: false
  }
];

export function useAdvancedTheme() {
  const { themeSettings, updateThemeSettings } = useTheme();
  const [customThemes, setCustomThemes] = useState<CustomTheme[]>(defaultThemes);
  const [activeTheme, setActiveTheme] = useState<CustomTheme>(defaultThemes[0]);

  // Carregar temas customizados do localStorage
  useEffect(() => {
    const savedThemes = localStorage.getItem('custom-themes');
    if (savedThemes) {
      try {
        const parsed = JSON.parse(savedThemes);
        setCustomThemes([...defaultThemes, ...parsed]);
      } catch (error) {
        console.error('Erro ao carregar temas customizados:', error);
      }
    }
  }, []);

  // Aplicar tema ativo
  const applyTheme = (theme: CustomTheme) => {
    const root = document.documentElement;
    
    // Converter cores para variáveis CSS
    root.style.setProperty('--primary', theme.primaryColor.replace('hsl(', '').replace(')', ''));
    root.style.setProperty('--secondary', theme.secondaryColor.replace('hsl(', '').replace(')', ''));
    root.style.setProperty('--accent', theme.accentColor.replace('hsl(', '').replace(')', ''));
    root.style.setProperty('--background', theme.backgroundColor.replace('hsl(', '').replace(')', ''));
    root.style.setProperty('--foreground', theme.textColor.replace('hsl(', '').replace(')', ''));
    root.style.setProperty('--radius', `${theme.borderRadius}px`);
    
    // Aplicar fonte
    root.style.setProperty('--font-family', theme.fontFamily);
    
    // Aplicar modo escuro/claro
    if (theme.isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    setActiveTheme(theme);
    updateThemeSettings({ theme: theme.isDark ? 'dark' : 'light' });
    
    // Salvar tema ativo
    localStorage.setItem('active-theme', theme.id);
  };

  // Criar novo tema customizado
  const createCustomTheme = (theme: Omit<CustomTheme, 'id'>) => {
    const newTheme: CustomTheme = {
      ...theme,
      id: `custom-${Date.now()}`
    };
    
    const updatedThemes = [...customThemes, newTheme];
    setCustomThemes(updatedThemes);
    
    // Salvar apenas temas customizados (não os padrão)
    const customOnly = updatedThemes.filter(t => !t.isDefault);
    localStorage.setItem('custom-themes', JSON.stringify(customOnly));
    
    return newTheme;
  };

  // Editar tema existente
  const updateCustomTheme = (id: string, updates: Partial<CustomTheme>) => {
    const updatedThemes = customThemes.map(theme =>
      theme.id === id ? { ...theme, ...updates } : theme
    );
    
    setCustomThemes(updatedThemes);
    
    // Salvar apenas temas customizados
    const customOnly = updatedThemes.filter(t => !t.isDefault);
    localStorage.setItem('custom-themes', JSON.stringify(customOnly));
    
    // Se o tema ativo foi editado, aplicar mudanças
    if (activeTheme.id === id) {
      const updatedTheme = updatedThemes.find(t => t.id === id);
      if (updatedTheme) {
        applyTheme(updatedTheme);
      }
    }
  };

  // Deletar tema customizado
  const deleteCustomTheme = (id: string) => {
    const theme = customThemes.find(t => t.id === id);
    if (theme?.isDefault) {
      throw new Error('Não é possível deletar temas padrão');
    }
    
    const updatedThemes = customThemes.filter(t => t.id !== id);
    setCustomThemes(updatedThemes);
    
    // Salvar apenas temas customizados
    const customOnly = updatedThemes.filter(t => !t.isDefault);
    localStorage.setItem('custom-themes', JSON.stringify(customOnly));
    
    // Se o tema deletado era o ativo, voltar para o padrão
    if (activeTheme.id === id) {
      applyTheme(defaultThemes[0]);
    }
  };

  // Duplicar tema para edição
  const duplicateTheme = (id: string) => {
    const theme = customThemes.find(t => t.id === id);
    if (!theme) return null;
    
    const duplicated = createCustomTheme({
      ...theme,
      name: `${theme.name} (Cópia)`,
      isDefault: false
    });
    
    return duplicated;
  };

  // Exportar tema como JSON
  const exportTheme = (id: string) => {
    const theme = customThemes.find(t => t.id === id);
    if (!theme) return;
    
    const exportData = {
      ...theme,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `theme-${theme.name.toLowerCase().replace(/\s+/g, '-')}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  };

  // Importar tema de JSON
  const importTheme = (file: File): Promise<CustomTheme> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          
          // Validar estrutura do tema
          if (!data.name || !data.primaryColor || !data.backgroundColor) {
            throw new Error('Arquivo de tema inválido');
          }
          
          const importedTheme = createCustomTheme({
            name: `${data.name} (Importado)`,
            primaryColor: data.primaryColor,
            secondaryColor: data.secondaryColor,
            accentColor: data.accentColor,
            backgroundColor: data.backgroundColor,
            textColor: data.textColor,
            borderRadius: data.borderRadius || 6,
            fontFamily: data.fontFamily || 'Inter',
            isDark: data.isDark || false
          });
          
          resolve(importedTheme);
        } catch (error) {
          reject(new Error('Erro ao importar tema: ' + error));
        }
      };
      
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      reader.readAsText(file);
    });
  };

  // Gerar preview do tema
  const generateThemePreview = (theme: CustomTheme) => {
    return {
      primary: theme.primaryColor,
      secondary: theme.secondaryColor,
      accent: theme.accentColor,
      background: theme.backgroundColor,
      text: theme.textColor,
      isDark: theme.isDark
    };
  };

  // Carregar tema ativo salvo
  useEffect(() => {
    const savedThemeId = localStorage.getItem('active-theme');
    if (savedThemeId) {
      const theme = customThemes.find(t => t.id === savedThemeId);
      if (theme) {
        applyTheme(theme);
      }
    }
  }, [customThemes]);

  return {
    customThemes,
    activeTheme,
    applyTheme,
    createCustomTheme,
    updateCustomTheme,
    deleteCustomTheme,
    duplicateTheme,
    exportTheme,
    importTheme,
    generateThemePreview
  };
}