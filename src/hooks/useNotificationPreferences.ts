import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface NotificationPreferences {
  email_new_messages: boolean;
  email_task_assignments: boolean;
  email_system_updates: boolean;
  email_weekly_report: boolean;
  email_security_alerts: boolean;
  email_marketing_emails: boolean;
  push_new_messages: boolean;
  push_mentions: boolean;
  push_reminders: boolean;
  push_system_alerts: boolean;
  push_breaks: boolean;
  sound_message_sound: boolean;
  sound_notification_sound: boolean;
  sound_alert_sound: boolean;
  sound_volume: number;
  schedule_quiet_hours: boolean;
  schedule_quiet_start: string;
  schedule_quiet_end: string;
  schedule_weekend_quiet: boolean;
  schedule_vacation_mode: boolean;
}

const defaultPreferences: NotificationPreferences = {
  email_new_messages: true,
  email_task_assignments: true,
  email_system_updates: false,
  email_weekly_report: true,
  email_security_alerts: true,
  email_marketing_emails: false,
  push_new_messages: true,
  push_mentions: true,
  push_reminders: true,
  push_system_alerts: true,
  push_breaks: false,
  sound_message_sound: true,
  sound_notification_sound: true,
  sound_alert_sound: true,
  sound_volume: 75,
  schedule_quiet_hours: true,
  schedule_quiet_start: '22:00',
  schedule_quiet_end: '08:00',
  schedule_weekend_quiet: false,
  schedule_vacation_mode: false,
};

export function useNotificationPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      loadPreferences();
    }
  }, [user]);

  const loadPreferences = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_notification_preferences' as any)
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Erro ao carregar preferências:', error);
        return;
      }

      if (data) {
        const typedData = data as any;
        setPreferences({
          email_new_messages: typedData.email_new_messages,
          email_task_assignments: typedData.email_task_assignments,
          email_system_updates: typedData.email_system_updates,
          email_weekly_report: typedData.email_weekly_report,
          email_security_alerts: typedData.email_security_alerts,
          email_marketing_emails: typedData.email_marketing_emails,
          push_new_messages: typedData.push_new_messages,
          push_mentions: typedData.push_mentions,
          push_reminders: typedData.push_reminders,
          push_system_alerts: typedData.push_system_alerts,
          push_breaks: typedData.push_breaks,
          sound_message_sound: typedData.sound_message_sound,
          sound_notification_sound: typedData.sound_notification_sound,
          sound_alert_sound: typedData.sound_alert_sound,
          sound_volume: typedData.sound_volume,
          schedule_quiet_hours: typedData.schedule_quiet_hours,
          schedule_quiet_start: typedData.schedule_quiet_start,
          schedule_quiet_end: typedData.schedule_quiet_end,
          schedule_weekend_quiet: typedData.schedule_weekend_quiet,
          schedule_vacation_mode: typedData.schedule_vacation_mode,
        });
      }
    } catch (error) {
      console.error('Erro inesperado ao carregar preferências:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!user) return;

    setSaving(true);

    try {
      const { error } = await supabase
        .from('user_notification_preferences' as any)
        .upsert({
          user_id: user.id,
          ...preferences,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Erro ao salvar preferências:', error);
        toast.error('Erro ao salvar preferências de notificação');
        return;
      }

      toast.success('Preferências de notificação salvas com sucesso!');
    } catch (error) {
      console.error('Erro inesperado ao salvar preferências:', error);
      toast.error('Erro inesperado ao salvar preferências');
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = (key: keyof NotificationPreferences, value: boolean | number | string) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return {
    preferences,
    loading,
    saving,
    updatePreference,
    savePreferences,
  };
}