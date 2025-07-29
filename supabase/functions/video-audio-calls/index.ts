import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CallRequest {
  action: 'start' | 'end' | 'update';
  callId?: string;
  empresaId: string;
  agenteId: string;
  contatoId?: string;
  tipo: 'voice' | 'video';
  duracao?: number;
  qualidadeAudio?: string;
  qualidadeVideo?: string;
  notas?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      action, 
      callId, 
      empresaId, 
      agenteId, 
      contatoId, 
      tipo, 
      duracao, 
      qualidadeAudio, 
      qualidadeVideo, 
      notas 
    }: CallRequest = await req.json();

    if (!action || !empresaId || !agenteId) {
      throw new Error('action, empresaId and agenteId are required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let result;

    switch (action) {
      case 'start':
        if (!tipo) {
          throw new Error('tipo is required for start action');
        }

        const { data: newCall, error: insertError } = await supabase
          .from('video_audio_calls')
          .insert({
            empresa_id: empresaId,
            agente_id: agenteId,
            contato_id: contatoId,
            tipo,
            status: 'connecting',
            qualidade_audio: qualidadeAudio || 'medium',
            qualidade_video: qualidadeVideo || 'medium',
            started_at: new Date().toISOString()
          })
          .select()
          .single();

        if (insertError) {
          throw insertError;
        }

        // Simular WebRTC signaling (em produção, usar um serviço real como Agora, Twilio, etc.)
        result = {
          callId: newCall.id,
          status: 'connecting',
          sdpOffer: 'simulated-sdp-offer', // Em produção, gerar SDP real
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            // Em produção, adicionar servidores TURN
          ]
        };
        break;

      case 'update':
        if (!callId) {
          throw new Error('callId is required for update action');
        }

        const updateData: any = {};
        if (duracao !== undefined) updateData.duracao = duracao;
        if (notas !== undefined) updateData.notas = notas;
        if (qualidadeAudio !== undefined) updateData.qualidade_audio = qualidadeAudio;
        if (qualidadeVideo !== undefined) updateData.qualidade_video = qualidadeVideo;

        const { data: updatedCall, error: updateError } = await supabase
          .from('video_audio_calls')
          .update(updateData)
          .eq('id', callId)
          .select()
          .single();

        if (updateError) {
          throw updateError;
        }

        result = updatedCall;
        break;

      case 'end':
        if (!callId) {
          throw new Error('callId is required for end action');
        }

        const { data: endedCall, error: endError } = await supabase
          .from('video_audio_calls')
          .update({
            status: 'ended',
            ended_at: new Date().toISOString(),
            duracao: duracao || 0,
            notas
          })
          .eq('id', callId)
          .select()
          .single();

        if (endError) {
          throw endError;
        }

        result = endedCall;
        break;

      default:
        throw new Error('Invalid action');
    }

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in video-audio-calls:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});