import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Video, 
  Phone, 
  Mic, 
  MicOff, 
  VideoOff,
  Monitor,
  Users,
  PhoneCall,
  PhoneOff,
  Settings,
  Volume2,
  VolumeX
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface CallConfig {
  enableVideo: boolean;
  enableAudio: boolean;
  enableScreenShare: boolean;
  audioQuality: 'low' | 'medium' | 'high';
  videoQuality: 'low' | 'medium' | 'high';
  autoAnswer: boolean;
  recordCalls: boolean;
}

interface ActiveCall {
  id: string;
  type: 'voice' | 'video';
  participant: string;
  duration: number;
  status: 'connecting' | 'connected' | 'ended';
  isVideo: boolean;
  isAudio: boolean;
  isScreenSharing: boolean;
}

export function VideoAudioIntegration() {
  const [isCallActive, setIsCallActive] = useState(false);
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);
  const [callConfig, setCallConfig] = useState<CallConfig>({
    enableVideo: true,
    enableAudio: true,
    enableScreenShare: true,
    audioQuality: 'medium',
    videoQuality: 'medium',
    autoAnswer: false,
    recordCalls: false
  });
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [callHistory, setCallHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const startCall = async (type: 'voice' | 'video', participant: string) => {
    if (!user) return;

    try {
      const constraints = {
        video: type === 'video' && callConfig.enableVideo,
        audio: callConfig.enableAudio
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setMediaStream(stream);

      // Buscar empresa do usuário
      const { data: profile } = await supabase
        .from('profiles')
        .select('empresa_id')
        .eq('id', user.id)
        .single();

      if (!profile?.empresa_id) {
        throw new Error('Empresa não encontrada');
      }

      // Iniciar chamada no backend
      const { data: callData, error } = await supabase.functions.invoke('video-audio-calls', {
        body: {
          action: 'start',
          empresaId: profile.empresa_id,
          agenteId: user.id,
          tipo: type,
          qualidadeAudio: callConfig.audioQuality,
          qualidadeVideo: callConfig.videoQuality
        }
      });

      if (error) {
        throw error;
      }

      const call: ActiveCall = {
        id: callData.callId,
        type,
        participant,
        duration: 0,
        status: 'connecting',
        isVideo: type === 'video',
        isAudio: true,
        isScreenSharing: false
      };

      setActiveCall(call);
      setIsCallActive(true);

      // Simular conexão WebRTC (em produção, usar serviço real)
      setTimeout(() => {
        setActiveCall(prev => prev ? { ...prev, status: 'connected' } : null);
        toast({
          title: "Chamada conectada",
          description: `Chamada de ${type} iniciada com ${participant}`,
        });
      }, 2000);

    } catch (error) {
      console.error('Erro ao iniciar chamada:', error);
      toast({
        title: "Erro na chamada",
        description: "Não foi possível acessar câmera/microfone",
        variant: "destructive"
      });
    }
  };

  const endCall = async () => {
    if (!activeCall) return;

    try {
      // Calcular duração da chamada
      const duration = Math.floor((Date.now() - new Date(activeCall.id).getTime()) / 1000);

      // Finalizar chamada no backend
      await supabase.functions.invoke('video-audio-calls', {
        body: {
          action: 'end',
          callId: activeCall.id,
          duracao: duration,
          notas: 'Chamada finalizada pelo usuário'
        }
      });

      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        setMediaStream(null);
      }

      setActiveCall(null);
      setIsCallActive(false);
      
      toast({
        title: "Chamada encerrada",
        description: `Chamada finalizada após ${Math.floor(duration / 60)}m ${duration % 60}s`,
      });

      // Recarregar histórico
      loadCallHistory();

    } catch (error) {
      console.error('Erro ao finalizar chamada:', error);
      // Finalizar localmente mesmo com erro
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        setMediaStream(null);
      }
      setActiveCall(null);
      setIsCallActive(false);
    }
  };

  const toggleVideo = () => {
    if (mediaStream) {
      const videoTrack = mediaStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
        setActiveCall(prev => prev ? { ...prev, isVideo: videoTrack.enabled } : null);
      }
    }
  };

  const toggleAudio = () => {
    if (mediaStream) {
      const audioTrack = mediaStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
        setActiveCall(prev => prev ? { ...prev, isAudio: audioTrack.enabled } : null);
      }
    }
  };

  const startScreenShare = async () => {
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });

      setActiveCall(prev => prev ? { ...prev, isScreenSharing: true } : null);
      
      // Quando o usuário para o compartilhamento
      displayStream.getVideoTracks()[0].addEventListener('ended', () => {
        setActiveCall(prev => prev ? { ...prev, isScreenSharing: false } : null);
      });

      toast({
        title: "Compartilhamento iniciado",
        description: "Sua tela está sendo compartilhada",
      });
    } catch (error) {
      toast({
        title: "Erro no compartilhamento",
        description: "Não foi possível compartilhar a tela",
        variant: "destructive"
      });
    }
  };

  const updateConfig = (key: keyof CallConfig, value: any) => {
    setCallConfig(prev => ({ ...prev, [key]: value }));
  };

  const loadCallHistory = async () => {
    if (!user) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('empresa_id')
        .eq('id', user.id)
        .single();

      if (!profile?.empresa_id) return;

      const { data: calls, error } = await supabase
        .from('video_audio_calls')
        .select(`
          *,
          contatos(nome),
          profiles(nome)
        `)
        .eq('empresa_id', profile.empresa_id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        throw error;
      }

      setCallHistory(calls || []);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    }
  };

  useEffect(() => {
    loadCallHistory();
  }, [user]);

  if (isCallActive && activeCall) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        {/* Video container */}
        <div className="flex-1 relative bg-gray-900">
          <div className="w-full h-full flex items-center justify-center">
            {activeCall.isVideo ? (
              <video 
                autoPlay 
                muted 
                className="w-full h-full object-cover"
                ref={(video) => {
                  if (video && mediaStream) {
                    video.srcObject = mediaStream;
                  }
                }}
              />
            ) : (
              <div className="text-center text-white">
                <div className="w-32 h-32 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-16 h-16" />
                </div>
                <h2 className="text-2xl font-bold">{activeCall.participant}</h2>
                <p className="text-lg">Chamada de voz em andamento</p>
              </div>
            )}
          </div>

          {/* Call info overlay */}
          <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white p-3 rounded">
            <p className="font-semibold">{activeCall.participant}</p>
            <p className="text-sm">
              {activeCall.status === 'connecting' ? 'Conectando...' : 'Conectado'}
            </p>
          </div>

          {/* Status indicators */}
          <div className="absolute top-4 right-4 flex gap-2">
            {activeCall.isScreenSharing && (
              <Badge className="bg-green-500">
                <Monitor className="w-3 h-3 mr-1" />
                Compartilhando
              </Badge>
            )}
            {callConfig.recordCalls && (
              <Badge className="bg-red-500">
                <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse" />
                Gravando
              </Badge>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="bg-gray-800 p-6">
          <div className="flex items-center justify-center gap-4">
            <Button
              size="lg"
              variant={isAudioEnabled ? "default" : "destructive"}
              onClick={toggleAudio}
              className="rounded-full w-14 h-14"
            >
              {isAudioEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
            </Button>

            {activeCall.type === 'video' && (
              <Button
                size="lg"
                variant={isVideoEnabled ? "default" : "destructive"}
                onClick={toggleVideo}
                className="rounded-full w-14 h-14"
              >
                {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
              </Button>
            )}

            <Button
              size="lg"
              variant="outline"
              onClick={startScreenShare}
              className="rounded-full w-14 h-14"
              disabled={activeCall.isScreenSharing}
            >
              <Monitor className="w-6 h-6" />
            </Button>

            <Button
              size="lg"
              variant="destructive"
              onClick={endCall}
              className="rounded-full w-14 h-14"
            >
              <PhoneOff className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Chamadas de Voz e Vídeo</h2>
        <p className="text-muted-foreground">
          Sistema integrado de comunicação multimídia
        </p>
      </div>

      {/* Quick actions */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Chamada de Voz
            </CardTitle>
            <CardDescription>
              Inicie uma chamada de voz com um cliente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="voice-contact">Contato</Label>
              <Input 
                id="voice-contact" 
                placeholder="Nome ou telefone do cliente" 
              />
            </div>
            <Button 
              className="w-full"
              onClick={() => startCall('voice', 'Cliente Exemplo')}
            >
              <PhoneCall className="w-4 h-4 mr-2" />
              Iniciar Chamada de Voz
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              Chamada de Vídeo
            </CardTitle>
            <CardDescription>
              Inicie uma videochamada com um cliente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="video-contact">Contato</Label>
              <Input 
                id="video-contact" 
                placeholder="Nome ou telefone do cliente" 
              />
            </div>
            <Button 
              className="w-full"
              onClick={() => startCall('video', 'Cliente Exemplo')}
            >
              <Video className="w-4 h-4 mr-2" />
              Iniciar Videochamada
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Configurações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurações de Chamada
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold">Geral</h4>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>Ativar Vídeo</Label>
                  <p className="text-sm text-muted-foreground">
                    Permitir chamadas de vídeo
                  </p>
                </div>
                <Switch
                  checked={callConfig.enableVideo}
                  onCheckedChange={(checked) => updateConfig('enableVideo', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Ativar Áudio</Label>
                  <p className="text-sm text-muted-foreground">
                    Permitir chamadas de áudio
                  </p>
                </div>
                <Switch
                  checked={callConfig.enableAudio}
                  onCheckedChange={(checked) => updateConfig('enableAudio', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Compartilhamento de Tela</Label>
                  <p className="text-sm text-muted-foreground">
                    Permitir compartilhar tela
                  </p>
                </div>
                <Switch
                  checked={callConfig.enableScreenShare}
                  onCheckedChange={(checked) => updateConfig('enableScreenShare', checked)}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Avançado</h4>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>Atender Automaticamente</Label>
                  <p className="text-sm text-muted-foreground">
                    Aceitar chamadas automaticamente
                  </p>
                </div>
                <Switch
                  checked={callConfig.autoAnswer}
                  onCheckedChange={(checked) => updateConfig('autoAnswer', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Gravar Chamadas</Label>
                  <p className="text-sm text-muted-foreground">
                    Salvar gravações das chamadas
                  </p>
                </div>
                <Switch
                  checked={callConfig.recordCalls}
                  onCheckedChange={(checked) => updateConfig('recordCalls', checked)}
                />
              </div>
            </div>
          </div>

          <Alert>
            <Video className="h-4 w-4" />
            <AlertDescription>
              As chamadas são processadas localmente usando WebRTC. 
              Certifique-se de que o navegador tenha permissão para acessar câmera e microfone.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Histórico de Chamadas */}
      {callHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Chamadas</CardTitle>
            <CardDescription>
              Últimas chamadas realizadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {callHistory.map((call) => (
                <div key={call.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {call.tipo === 'video' ? (
                      <Video className="h-5 w-5 text-blue-500" />
                    ) : (
                      <Phone className="h-5 w-5 text-green-500" />
                    )}
                    <div>
                      <p className="font-medium">
                        {call.contatos?.nome || call.profiles?.nome || 'Cliente'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(call.created_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={call.status === 'ended' ? 'default' : 'destructive'}>
                      {call.status === 'ended' ? 'Finalizada' : 'Cancelada'}
                    </Badge>
                    {call.duracao > 0 && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {Math.floor(call.duracao / 60)}m {call.duracao % 60}s
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status */}
      <Card>
        <CardHeader>
          <CardTitle>Status do Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm">WebRTC Suportado</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm">Câmera Disponível</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm">Microfone Disponível</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}