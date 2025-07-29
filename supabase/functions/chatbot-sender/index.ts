
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createLogger } from '../_shared/logger.ts'
import { validateApiKey } from '../_shared/validation.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SendMessagePayload {
  type: 'text' | 'image' | 'document' | 'audio' | 'video' | 'button' | 'list';
  phone: string;
  data: Record<string, any>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Get correlation ID from header or generate new one
  const correlationId = req.headers.get('X-Correlation-ID') || crypto.randomUUID();
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const logger = createLogger(supabase, correlationId, 'chatbot-sender');

  try {
    const payload: SendMessagePayload = await req.json();
    
    await logger.info('Sender processing message', payload.phone, undefined, {
      messageType: payload.type,
      hasData: !!payload.data
    });

    // Validate Evolution API configuration
    const EVOLUTION_URL = Deno.env.get('EVOLUTION_API_URL') || 'https://api.evolution-api.com';
    const EVOLUTION_API_KEY = Deno.env.get('EVOLUTION_API_KEY');
    const EVOLUTION_INSTANCE = Deno.env.get('EVOLUTION_INSTANCE_NAME');

    const apiKeyValidation = validateApiKey(EVOLUTION_API_KEY, 'Evolution API Key');
    if (!apiKeyValidation.success) {
      await logger.error('Evolution API Key validation failed', payload.phone, undefined, {
        errors: apiKeyValidation.errors
      });
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Evolution API Key not configured',
        correlationId 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    const instanceValidation = validateApiKey(EVOLUTION_INSTANCE, 'Evolution Instance Name');
    if (!instanceValidation.success) {
      await logger.error('Evolution Instance validation failed', payload.phone, undefined, {
        errors: instanceValidation.errors
      });
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Evolution Instance not configured',
        correlationId 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    let endpoint = '';
    let body: Record<string, any> = {};

    // Message type routing with enhanced validation
    switch (payload.type) {
      case 'text':
        if (!payload.data.message || typeof payload.data.message !== 'string') {
          await logger.error('Invalid text message payload', payload.phone, undefined, { payload });
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'Message text is required',
            correlationId 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          });
        }
        endpoint = '/message/sendText';
        body = {
          number: payload.phone,
          text: payload.data.message
        };
        break;

      case 'image':
        if (!payload.data.image) {
          await logger.error('Invalid image message payload', payload.phone, undefined, { payload });
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'Image URL is required',
            correlationId 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          });
        }
        endpoint = '/message/sendMedia';
        body = {
          number: payload.phone,
          mediatype: 'image',
          media: payload.data.image,
          caption: payload.data.caption || ''
        };
        break;

      case 'document':
        if (!payload.data.document) {
          await logger.error('Invalid document message payload', payload.phone, undefined, { payload });
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'Document URL is required',
            correlationId 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          });
        }
        endpoint = '/message/sendMedia';
        body = {
          number: payload.phone,
          mediatype: 'document',
          media: payload.data.document,
          fileName: payload.data.filename || 'document'
        };
        break;

      case 'audio':
        if (!payload.data.audio) {
          await logger.error('Invalid audio message payload', payload.phone, undefined, { payload });
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'Audio URL is required',
            correlationId 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          });
        }
        endpoint = '/message/sendWhatsAppAudio';
        body = {
          number: payload.phone,
          audioMessage: {
            audio: payload.data.audio
          }
        };
        break;

      case 'video':
        if (!payload.data.video) {
          await logger.error('Invalid video message payload', payload.phone, undefined, { payload });
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'Video URL is required',
            correlationId 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          });
        }
        endpoint = '/message/sendMedia';
        body = {
          number: payload.phone,
          mediatype: 'video',
          media: payload.data.video,
          caption: payload.data.caption || ''
        };
        break;

      case 'button':
        if (!payload.data.message || !payload.data.buttons) {
          await logger.error('Invalid button message payload', payload.phone, undefined, { payload });
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'Message and buttons are required',
            correlationId 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          });
        }
        endpoint = '/message/sendButtons';
        body = {
          number: payload.phone,
          buttonMessage: {
            text: payload.data.message,
            buttons: payload.data.buttons
          }
        };
        break;

      case 'list':
        if (!payload.data.message || !payload.data.sections) {
          await logger.error('Invalid list message payload', payload.phone, undefined, { payload });
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'Message and sections are required',
            correlationId 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          });
        }
        endpoint = '/message/sendList';
        body = {
          number: payload.phone,
          listMessage: {
            title: payload.data.message,
            description: payload.data.description || '',
            buttonText: payload.data.buttonText || 'Menu',
            sections: payload.data.sections
          }
        };
        break;

      default:
        await logger.error('Unsupported message type', payload.phone, undefined, { messageType: payload.type });
        return new Response(JSON.stringify({ 
          success: false, 
          error: `Unsupported message type: ${payload.type}`,
          correlationId 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
    }

    // Make request to Evolution API
    const evolutionUrl = `${EVOLUTION_URL}/${EVOLUTION_INSTANCE}${endpoint}`;
    
    await logger.debug('Sending to Evolution API', payload.phone, undefined, {
      endpoint,
      evolutionUrl,
      bodyKeys: Object.keys(body)
    });

    const startTime = Date.now();
    const response = await fetch(evolutionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      },
      body: JSON.stringify(body)
    });

    const responseTime = Date.now() - startTime;
    const responseData = await response.json();

    if (!response.ok) {
      await logger.error('Evolution API request failed', payload.phone, undefined, {
        status: response.status,
        responseTime,
        error: responseData,
        endpoint
      });
      
      return new Response(JSON.stringify({ 
        success: false, 
        error: `Evolution API error: ${response.status} - ${JSON.stringify(responseData)}`,
        correlationId 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    await logger.info('Message sent successfully', payload.phone, undefined, {
      messageType: payload.type,
      responseTime,
      evolutionMessageId: responseData.key?.id,
      endpoint
    });

    return new Response(JSON.stringify({
      success: true,
      message: 'Message sent successfully',
      type: payload.type,
      phone: payload.phone,
      responseTime,
      evolutionResponse: responseData,
      correlationId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    await logger.error('Sender error', undefined, undefined, {
      error: error.message,
      stack: error.stack
    });
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message,
      correlationId 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
})
