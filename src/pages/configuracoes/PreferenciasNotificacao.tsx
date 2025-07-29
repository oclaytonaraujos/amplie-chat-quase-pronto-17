import { Mail, Smartphone, Volume2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { OfflineIndicator } from '@/hooks/useServiceWorker';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import { Skeleton } from '@/components/ui/skeleton';

export default function PreferenciasNotificacao() {
  const { preferences, loading, saving, updatePreference, savePreferences } = useNotificationPreferences();

  if (loading) {
    return (
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        <OfflineIndicator />
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-6 w-40 mb-4" />
              <div className="space-y-4">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="flex items-center justify-between">
                    <div>
                      <Skeleton className="h-4 w-32 mb-1" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                    <Skeleton className="h-6 w-11" />
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }
  return <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <OfflineIndicator />
      
      <div className="flex items-center justify-between">
        
        <Button 
          onClick={savePreferences} 
          disabled={saving}
          className="bg-amplie-primary hover:bg-amplie-primary-light"
        >
          {saving ? 'Salvando...' : 'Salvar Preferências'}
        </Button>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notificações por Email */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Mail className="w-5 h-5 mr-2 text-amplie-primary" />
            Notificações por Email
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Novas Mensagens</Label>
                <p className="text-sm text-gray-500">Notificar sobre novas mensagens recebidas</p>
              </div>
              <Switch checked={preferences.email_new_messages} onCheckedChange={checked => updatePreference('email_new_messages', checked)} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Atribuições de Tarefas</Label>
                <p className="text-sm text-gray-500">Quando uma tarefa for atribuída a você</p>
              </div>
              <Switch checked={preferences.email_task_assignments} onCheckedChange={checked => updatePreference('email_task_assignments', checked)} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Atualizações do Sistema</Label>
                <p className="text-sm text-gray-500">Notificações sobre atualizações e manutenções</p>
              </div>
              <Switch checked={preferences.email_system_updates} onCheckedChange={checked => updatePreference('email_system_updates', checked)} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Relatório Semanal</Label>
                <p className="text-sm text-gray-500">Resumo das suas atividades da semana</p>
              </div>
              <Switch checked={preferences.email_weekly_report} onCheckedChange={checked => updatePreference('email_weekly_report', checked)} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Alertas de Segurança</Label>
                <p className="text-sm text-gray-500">Notificações importantes de segurança</p>
              </div>
              <Switch checked={preferences.email_security_alerts} onCheckedChange={checked => updatePreference('email_security_alerts', checked)} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Emails de Marketing</Label>
                <p className="text-sm text-gray-500">Novidades, dicas e ofertas especiais</p>
              </div>
              <Switch checked={preferences.email_marketing_emails} onCheckedChange={checked => updatePreference('email_marketing_emails', checked)} />
            </div>
          </div>
        </Card>

        {/* Notificações Push */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Smartphone className="w-5 h-5 mr-2 text-amplie-primary" />
            Notificações Push
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Novas Mensagens</Label>
                <p className="text-sm text-gray-500">Notificações instantâneas de mensagens</p>
              </div>
              <Switch checked={preferences.push_new_messages} onCheckedChange={checked => updatePreference('push_new_messages', checked)} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Menções</Label>
                <p className="text-sm text-gray-500">Quando você for mencionado em conversas</p>
              </div>
              <Switch checked={preferences.push_mentions} onCheckedChange={checked => updatePreference('push_mentions', checked)} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Lembretes</Label>
                <p className="text-sm text-gray-500">Lembretes de tarefas e compromissos</p>
              </div>
              <Switch checked={preferences.push_reminders} onCheckedChange={checked => updatePreference('push_reminders', checked)} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Alertas do Sistema</Label>
                <p className="text-sm text-gray-500">Alertas críticos do sistema</p>
              </div>
              <Switch checked={preferences.push_system_alerts} onCheckedChange={checked => updatePreference('push_system_alerts', checked)} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Lembretes de Pausa</Label>
                <p className="text-sm text-gray-500">Lembretes para fazer pausas</p>
              </div>
              <Switch checked={preferences.push_breaks} onCheckedChange={checked => updatePreference('push_breaks', checked)} />
            </div>
          </div>
        </Card>

        {/* Configurações de Som */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Volume2 className="w-5 h-5 mr-2 text-amplie-primary" />
            Configurações de Som
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Som de Mensagem</Label>
                <p className="text-sm text-gray-500">Reproduzir som ao receber mensagens</p>
              </div>
              <Switch checked={preferences.sound_message_sound} onCheckedChange={checked => updatePreference('sound_message_sound', checked)} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Som de Notificação</Label>
                <p className="text-sm text-gray-500">Som para notificações gerais</p>
              </div>
              <Switch checked={preferences.sound_notification_sound} onCheckedChange={checked => updatePreference('sound_notification_sound', checked)} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Som de Alerta</Label>
                <p className="text-sm text-gray-500">Som para alertas importantes</p>
              </div>
              <Switch checked={preferences.sound_alert_sound} onCheckedChange={checked => updatePreference('sound_alert_sound', checked)} />
            </div>
          </div>
        </Card>

        {/* Horários Silenciosos */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-amplie-primary" />
            Horários Silenciosos
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Ativar Horário Silencioso</Label>
                <p className="text-sm text-gray-500">Pausar notificações em horários específicos</p>
              </div>
              <Switch checked={preferences.schedule_quiet_hours} onCheckedChange={checked => updatePreference('schedule_quiet_hours', checked)} />
            </div>
            {preferences.schedule_quiet_hours && <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="quietStart">Início</Label>
                    <input id="quietStart" type="time" value={preferences.schedule_quiet_start} onChange={e => updatePreference('schedule_quiet_start', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                  </div>
                  <div>
                    <Label htmlFor="quietEnd">Fim</Label>
                    <input id="quietEnd" type="time" value={preferences.schedule_quiet_end} onChange={e => updatePreference('schedule_quiet_end', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                  </div>
                </div>
              </>}
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Silencioso nos Fins de Semana</Label>
                <p className="text-sm text-gray-500">Pausar notificações nos fins de semana</p>
              </div>
              <Switch checked={preferences.schedule_weekend_quiet} onCheckedChange={checked => updatePreference('schedule_weekend_quiet', checked)} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Modo Férias</Label>
                <p className="text-sm text-gray-500">Pausar todas as notificações</p>
              </div>
              <Switch checked={preferences.schedule_vacation_mode} onCheckedChange={checked => updatePreference('schedule_vacation_mode', checked)} />
            </div>
          </div>
        </Card>
      </div>
    </div>;
}