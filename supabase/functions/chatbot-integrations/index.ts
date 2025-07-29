
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface IntegrationRequest {
  type: 'crm' | 'calendar' | 'notification' | 'webhook';
  action: string;
  data: Record<string, any>;
}

// Integração com CRM (HubSpot/Salesforce/Pipedrive)
async function integrateCRM(action: string, data: Record<string, any>) {
  const crmType = Deno.env.get('CRM_TYPE') || 'hubspot'; // hubspot, salesforce, pipedrive
  const crmApiKey = Deno.env.get('CRM_API_KEY');
  const crmUrl = Deno.env.get('CRM_URL');

  if (!crmApiKey) {
    console.log('CRM API key not configured');
    return { success: false, message: 'CRM not configured' };
  }

  try {
    let endpoint = '';
    let payload = {};
    let headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    switch (crmType) {
      case 'hubspot':
        headers['Authorization'] = `Bearer ${crmApiKey}`;
        
        if (action === 'create_contact') {
          endpoint = 'https://api.hubapi.com/crm/v3/objects/contacts';
          payload = {
            properties: {
              email: data.email,
              firstname: data.name?.split(' ')[0],
              lastname: data.name?.split(' ').slice(1).join(' '),
              phone: data.phone,
              lifecyclestage: 'lead',
              hs_lead_status: 'NEW',
              chatbot_source: 'WhatsApp Chatbot'
            }
          };
        } else if (action === 'create_deal') {
          endpoint = 'https://api.hubapi.com/crm/v3/objects/deals';
          payload = {
            properties: {
              dealname: `Lead WhatsApp - ${data.name}`,
              dealstage: 'appointmentscheduled',
              pipeline: 'default',
              amount: data.value || 0,
              hubspot_owner_id: data.owner_id
            }
          };
        }
        break;

      case 'pipedrive':
        headers['Authorization'] = `Bearer ${crmApiKey}`;
        
        if (action === 'create_person') {
          endpoint = `${crmUrl}/v1/persons`;
          payload = {
            name: data.name,
            email: [{ value: data.email, primary: true }],
            phone: [{ value: data.phone, primary: true }],
            visible_to: 3
          };
        }
        break;

      default:
        throw new Error(`CRM type ${crmType} not supported`);
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('CRM integration successful:', result);
      return { success: true, data: result };
    } else {
      console.error('CRM integration failed:', result);
      return { success: false, error: result };
    }

  } catch (error) {
    console.error('Error in CRM integration:', error);
    return { success: false, error: error.message };
  }
}

// Integração com Google Calendar
async function integrateCalendar(action: string, data: Record<string, any>) {
  const calendarApiKey = Deno.env.get('GOOGLE_CALENDAR_API_KEY');
  const calendarId = Deno.env.get('GOOGLE_CALENDAR_ID');

  if (!calendarApiKey || !calendarId) {
    console.log('Google Calendar not configured');
    return { success: false, message: 'Calendar not configured' };
  }

  try {
    if (action === 'create_event') {
      const endpoint = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?key=${calendarApiKey}`;
      
      const payload = {
        summary: data.title || 'Agendamento via Chatbot',
        description: `Cliente: ${data.clientName}\nTelefone: ${data.phone}\nObservações: ${data.notes || 'N/A'}`,
        start: {
          dateTime: data.startTime,
          timeZone: 'America/Sao_Paulo'
        },
        end: {
          dateTime: data.endTime,
          timeZone: 'America/Sao_Paulo'
        },
        attendees: [
          { email: data.clientEmail }
        ],
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 },
            { method: 'popup', minutes: 10 }
          ]
        }
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${calendarApiKey}`
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      
      if (response.ok) {
        return { success: true, data: result };
      } else {
        return { success: false, error: result };
      }
    }

    return { success: false, message: 'Action not supported' };

  } catch (error) {
    console.error('Error in Calendar integration:', error);
    return { success: false, error: error.message };
  }
}

// Sistema de notificações (Slack, Discord, Email)
async function sendNotification(type: string, data: Record<string, any>) {
  try {
    let result = { success: false, message: 'Notification type not configured' };

    // Slack
    if (type === 'slack') {
      const slackWebhook = Deno.env.get('SLACK_WEBHOOK_URL');
      if (slackWebhook) {
        const payload = {
          text: `🤖 *Chatbot Alert*`,
          attachments: [
            {
              color: data.urgency === 'high' ? 'danger' : 'warning',
              fields: [
                { title: 'Cliente', value: data.clientName, short: true },
                { title: 'Telefone', value: data.phone, short: true },
                { title: 'Tipo', value: data.type, short: true },
                { title: 'Urgência', value: data.urgency, short: true },
                { title: 'Mensagem', value: data.message, short: false }
              ],
              ts: Math.floor(Date.now() / 1000)
            }
          ]
        };

        const response = await fetch(slackWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        result = { success: response.ok, message: response.ok ? 'Slack notification sent' : 'Failed to send Slack notification' };
      }
    }

    // Discord
    if (type === 'discord') {
      const discordWebhook = Deno.env.get('DISCORD_WEBHOOK_URL');
      if (discordWebhook) {
        const payload = {
          content: `🤖 **Alerta do Chatbot**`,
          embeds: [
            {
              title: `${data.type} - ${data.urgency}`,
              description: data.message,
              color: data.urgency === 'high' ? 0xff0000 : 0xffa500,
              fields: [
                { name: 'Cliente', value: data.clientName, inline: true },
                { name: 'Telefone', value: data.phone, inline: true }
              ],
              timestamp: new Date().toISOString()
            }
          ]
        };

        const response = await fetch(discordWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        result = { success: response.ok, message: response.ok ? 'Discord notification sent' : 'Failed to send Discord notification' };
      }
    }

    // Email (usando Supabase Edge Functions)
    if (type === 'email') {
      const emailService = Deno.env.get('EMAIL_SERVICE_URL');
      if (emailService) {
        const payload = {
          to: data.email,
          subject: `Alerta do Chatbot - ${data.type}`,
          html: `
            <h2>Novo alerta do chatbot</h2>
            <p><strong>Cliente:</strong> ${data.clientName}</p>
            <p><strong>Telefone:</strong> ${data.phone}</p>
            <p><strong>Tipo:</strong> ${data.type}</p>
            <p><strong>Urgência:</strong> ${data.urgency}</p>
            <p><strong>Mensagem:</strong> ${data.message}</p>
            <p><strong>Data:</strong> ${new Date().toLocaleString('pt-BR')}</p>
          `
        };

        const response = await fetch(emailService, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        result = { success: response.ok, message: response.ok ? 'Email notification sent' : 'Failed to send email notification' };
      }
    }

    return result;

  } catch (error) {
    console.error('Error sending notification:', error);
    return { success: false, error: error.message };
  }
}

// Webhook genérico
async function triggerWebhook(url: string, data: Record<string, any>) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'User-Agent': 'Amplie-Chatbot/1.0'
      },
      body: JSON.stringify({
        ...data,
        timestamp: new Date().toISOString(),
        source: 'amplie-chatbot'
      })
    });

    return {
      success: response.ok,
      status: response.status,
      message: response.ok ? 'Webhook triggered successfully' : 'Webhook failed'
    };

  } catch (error) {
    console.error('Error triggering webhook:', error);
    return { success: false, error: error.message };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, action, data }: IntegrationRequest = await req.json()
    console.log('Executando integração:', { type, action, data })

    let result = { success: false, message: 'Integration type not supported' };

    switch (type) {
      case 'crm':
        result = await integrateCRM(action, data);
        break;

      case 'calendar':
        result = await integrateCalendar(action, data);
        break;

      case 'notification':
        result = await sendNotification(action, data);
        break;

      case 'webhook':
        result = await triggerWebhook(data.url, data.payload);
        break;

      default:
        throw new Error(`Integration type ${type} not supported`);
    }

    // Log da integração no Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    await supabase
      .from('integration_logs')
      .insert({
        type: type,
        action: action,
        data: data,
        result: result,
        timestamp: new Date().toISOString()
      })
      .select()
      .maybeSingle();

    return new Response(JSON.stringify({
      success: result.success,
      type: type,
      action: action,
      result: result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: result.success ? 200 : 400,
    })

  } catch (error) {
    console.error('Erro na função de integrações:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
