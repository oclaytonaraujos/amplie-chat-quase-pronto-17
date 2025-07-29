import { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Calendar, Camera, Save, Edit2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useSupabaseProfile } from '@/hooks/useSupabaseProfile';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
export default function MeuPerfil() {
  const {
    user
  } = useAuth();
  const {
    profile,
    loading
  } = useSupabaseProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userInfo, setUserInfo] = useState({
    nome: '',
    email: '',
    telefone: '',
    endereco: '',
    cargo: '',
    setor: '',
    dataAdmissao: ''
  });
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    smsNotifications: false,
    desktopNotifications: true,
    soundNotifications: true
  });
  useEffect(() => {
    if (profile) {
      setUserInfo({
        nome: profile.nome || '',
        email: profile.email || '',
        telefone: '',
        // Telefone não está na tabela profiles
        endereco: '',
        // Endereço não está na tabela profiles
        cargo: profile.cargo || '',
        setor: profile.setor || '',
        dataAdmissao: ''
      });
    }
  }, [profile]);
  const handleSave = async () => {
    if (!user || !profile) return;
    setSaving(true);
    try {
      const {
        error
      } = await supabase.from('profiles').update({
        nome: userInfo.nome,
        setor: userInfo.setor,
        updated_at: new Date().toISOString()
      }).eq('id', user.id);
      if (error) throw error;
      toast.success('Perfil atualizado com sucesso!');
      setIsEditing(false);
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      toast.error('Erro ao atualizar perfil');
    } finally {
      setSaving(false);
    }
  };
  const handleInputChange = (field: string, value: string) => {
    setUserInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };
  const handleNotificationChange = (field: string, value: boolean) => {
    setNotifications(prev => ({
      ...prev,
      [field]: value
    }));
  };
  if (loading) {
    return <div className="p-6 flex items-center justify-center min-h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>;
  }
  return <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header do Perfil */}
      <div className="flex items-center justify-between">
        
        <Button onClick={() => isEditing ? handleSave() : setIsEditing(true)} disabled={saving} className="bg-amplie-primary hover:bg-amplie-primary-light">
          {saving ? <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Salvando...
            </> : isEditing ? <>
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </> : <>
              <Edit2 className="w-4 h-4 mr-2" />
              Editar
            </>}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Foto do Perfil */}
        <Card className="p-6">
          <div className="text-center space-y-4">
            <div className="relative mx-auto w-32 h-32">
              <div className="w-32 h-32 bg-gradient-to-r from-amplie-primary to-amplie-primary-light rounded-full flex items-center justify-center">
                <User className="w-16 h-16 text-white" />
              </div>
              {isEditing && <Button size="sm" className="absolute bottom-0 right-0 rounded-full w-10 h-10 p-0" variant="secondary">
                  <Camera className="w-4 h-4" />
                </Button>}
            </div>
            <div>
              <h3 className="font-semibold text-lg">{userInfo.nome}</h3>
              <p className="text-gray-500">{userInfo.cargo}</p>
              <p className="text-sm text-gray-400">{userInfo.setor}</p>
            </div>
          </div>
        </Card>

        {/* Informações Pessoais */}
        <Card className="p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <User className="w-5 h-5 mr-2 text-amplie-primary" />
            Informações Pessoais
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nome">Nome Completo</Label>
              <Input id="nome" value={userInfo.nome} onChange={e => handleInputChange('nome', e.target.value)} disabled={!isEditing} className={!isEditing ? 'bg-gray-50' : ''} />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={userInfo.email} onChange={e => handleInputChange('email', e.target.value)} disabled={!isEditing} className={!isEditing ? 'bg-gray-50' : ''} />
            </div>
            <div>
              <Label htmlFor="telefone">Telefone</Label>
              <Input id="telefone" value={userInfo.telefone} onChange={e => handleInputChange('telefone', e.target.value)} disabled={!isEditing} className={!isEditing ? 'bg-gray-50' : ''} />
            </div>
            <div>
              <Label htmlFor="endereco">Endereço</Label>
              <Input id="endereco" value={userInfo.endereco} onChange={e => handleInputChange('endereco', e.target.value)} disabled={!isEditing} className={!isEditing ? 'bg-gray-50' : ''} />
            </div>
            <div>
              <Label htmlFor="cargo">Cargo</Label>
              <Input id="cargo" value={userInfo.cargo} onChange={e => handleInputChange('cargo', e.target.value)} disabled={!isEditing} className={!isEditing ? 'bg-gray-50' : ''} />
            </div>
            <div>
              <Label htmlFor="dataAdmissao">Data de Admissão</Label>
              <Input id="dataAdmissao" type="date" value={userInfo.dataAdmissao} onChange={e => handleInputChange('dataAdmissao', e.target.value)} disabled={!isEditing} className={!isEditing ? 'bg-gray-50' : ''} />
            </div>
          </div>
        </Card>

        {/* Preferências de Notificação */}
        <Card className="p-6 lg:col-span-3">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Mail className="w-5 h-5 mr-2 text-amplie-primary" />
            Preferências de Notificação
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Notificações por Email</Label>
                <p className="text-sm text-gray-500">Receber emails sobre atualizações</p>
              </div>
              <Switch checked={notifications.emailNotifications} onCheckedChange={checked => handleNotificationChange('emailNotifications', checked)} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Notificações SMS</Label>
                <p className="text-sm text-gray-500">Receber SMS sobre urgências</p>
              </div>
              <Switch checked={notifications.smsNotifications} onCheckedChange={checked => handleNotificationChange('smsNotifications', checked)} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Notificações Desktop</Label>
                <p className="text-sm text-gray-500">Mostrar notificações no desktop</p>
              </div>
              <Switch checked={notifications.desktopNotifications} onCheckedChange={checked => handleNotificationChange('desktopNotifications', checked)} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Sons de Notificação</Label>
                <p className="text-sm text-gray-500">Reproduzir sons para alertas</p>
              </div>
              <Switch checked={notifications.soundNotifications} onCheckedChange={checked => handleNotificationChange('soundNotifications', checked)} />
            </div>
          </div>
        </Card>

        {/* Estatísticas do Usuário */}
        <Card className="p-6 lg:col-span-3">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-amplie-primary" />
            Estatísticas de Atividade
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">156</div>
              <div className="text-sm text-gray-600">Atendimentos Realizados</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">23</div>
              <div className="text-sm text-gray-600">Este Mês</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">4.8</div>
              <div className="text-sm text-gray-600">Avaliação Média</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">2h 15m</div>
              <div className="text-sm text-gray-600">Tempo Médio de Resposta</div>
            </div>
          </div>
        </Card>
      </div>
    </div>;
}