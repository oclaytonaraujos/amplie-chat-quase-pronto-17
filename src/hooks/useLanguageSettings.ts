import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface LanguageSettings {
  primaryLanguage: string;
  secondaryLanguage: string;
  autoDetect: boolean;
  translateMessages: boolean;
  dateFormat: string;
  timeFormat: string;
  numberFormat: string;
}

interface RegionSettings {
  timezone: string;
  currency: string;
  firstDayOfWeek: string;
}

interface UserLanguageSettings extends LanguageSettings, RegionSettings {
  id?: string;
  user_id: string;
}

export const useLanguageSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  
  const [languageSettings, setLanguageSettings] = useState<LanguageSettings>({
    primaryLanguage: 'pt-BR',
    secondaryLanguage: 'en-US',
    autoDetect: true,
    translateMessages: false,
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    numberFormat: 'pt-BR'
  });

  const [regionSettings, setRegionSettings] = useState<RegionSettings>({
    timezone: 'America/Sao_Paulo',
    currency: 'BRL',
    firstDayOfWeek: 'monday'
  });

  // Carregar configurações do usuário
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
      const savedLanguage = localStorage.getItem(`language-settings-${user.id}`);
      const savedRegion = localStorage.getItem(`region-settings-${user.id}`);
      
      if (savedLanguage) {
        setLanguageSettings(JSON.parse(savedLanguage));
      }
      
      if (savedRegion) {
        setRegionSettings(JSON.parse(savedRegion));
      }
      
    } catch (error) {
      console.error('Erro ao carregar configurações de idioma:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar suas configurações de idioma",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!user?.id) return;

    try {
      // Salvar no localStorage com ID do usuário para sincronizar
      localStorage.setItem(`language-settings-${user.id}`, JSON.stringify(languageSettings));
      localStorage.setItem(`region-settings-${user.id}`, JSON.stringify(regionSettings));
      
      toast({
        title: "Configurações salvas",
        description: "Suas configurações de idioma foram salvas com sucesso"
      });
      
    } catch (error) {
      console.error('Erro ao salvar configurações de idioma:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar suas configurações de idioma",
        variant: "destructive"
      });
    }
  };

  const updateLanguageSettings = (updates: Partial<LanguageSettings>) => {
    setLanguageSettings(prev => ({ ...prev, ...updates }));
  };

  const updateRegionSettings = (updates: Partial<RegionSettings>) => {
    setRegionSettings(prev => ({ ...prev, ...updates }));
  };

  return {
    languageSettings,
    regionSettings,
    loading,
    updateLanguageSettings,
    updateRegionSettings,
    saveSettings
  };
};