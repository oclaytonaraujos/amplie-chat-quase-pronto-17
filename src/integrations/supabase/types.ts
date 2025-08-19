export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      analytics_metrics: {
        Row: {
          created_at: string
          empresa_id: string
          id: string
          metadata: Json | null
          metric_name: string
          metric_type: string
          period_end: string
          period_start: string
          value: number
        }
        Insert: {
          created_at?: string
          empresa_id: string
          id?: string
          metadata?: Json | null
          metric_name: string
          metric_type: string
          period_end: string
          period_start: string
          value: number
        }
        Update: {
          created_at?: string
          empresa_id?: string
          id?: string
          metadata?: Json | null
          metric_name?: string
          metric_type?: string
          period_end?: string
          period_start?: string
          value?: number
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          record_id: string
          table_name: string
          timestamp: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id: string
          table_name: string
          timestamp?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string
          table_name?: string
          timestamp?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      automation_triggers: {
        Row: {
          actions: Json | null
          conditions: Json | null
          cooldown_minutes: number | null
          created_at: string | null
          description: string | null
          empresa_id: string
          enabled: boolean | null
          id: string
          max_activations_per_day: number | null
          name: string
          priority: number | null
          trigger_type: string
          updated_at: string | null
        }
        Insert: {
          actions?: Json | null
          conditions?: Json | null
          cooldown_minutes?: number | null
          created_at?: string | null
          description?: string | null
          empresa_id: string
          enabled?: boolean | null
          id?: string
          max_activations_per_day?: number | null
          name: string
          priority?: number | null
          trigger_type: string
          updated_at?: string | null
        }
        Update: {
          actions?: Json | null
          conditions?: Json | null
          cooldown_minutes?: number | null
          created_at?: string | null
          description?: string | null
          empresa_id?: string
          enabled?: boolean | null
          id?: string
          max_activations_per_day?: number | null
          name?: string
          priority?: number | null
          trigger_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_triggers_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_whatsapp_connections: {
        Row: {
          automation_id: string
          created_at: string
          id: string
          whatsapp_connection_id: string
        }
        Insert: {
          automation_id: string
          created_at?: string
          id?: string
          whatsapp_connection_id: string
        }
        Update: {
          automation_id?: string
          created_at?: string
          id?: string
          whatsapp_connection_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_whatsapp_connections_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "automations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_whatsapp_connections_whatsapp_connection_id_fkey"
            columns: ["whatsapp_connection_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      automations: {
        Row: {
          created_at: string | null
          empresa_id: string
          flow_data: Json | null
          id: string
          name: string
          status: string | null
          updated_at: string | null
          whatsapp_connection_id: string | null
        }
        Insert: {
          created_at?: string | null
          empresa_id: string
          flow_data?: Json | null
          id?: string
          name: string
          status?: string | null
          updated_at?: string | null
          whatsapp_connection_id?: string | null
        }
        Update: {
          created_at?: string | null
          empresa_id?: string
          flow_data?: Json | null
          id?: string
          name?: string
          status?: string | null
          updated_at?: string | null
          whatsapp_connection_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automations_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automations_whatsapp_connection_id_fkey"
            columns: ["whatsapp_connection_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      backup_logs: {
        Row: {
          backup_type: string
          completed_at: string | null
          created_at: string
          empresa_id: string
          error_message: string | null
          file_size: number | null
          id: string
          metadata: Json | null
          record_count: number | null
          status: string
          table_name: string | null
        }
        Insert: {
          backup_type: string
          completed_at?: string | null
          created_at?: string
          empresa_id: string
          error_message?: string | null
          file_size?: number | null
          id?: string
          metadata?: Json | null
          record_count?: number | null
          status: string
          table_name?: string | null
        }
        Update: {
          backup_type?: string
          completed_at?: string | null
          created_at?: string
          empresa_id?: string
          error_message?: string | null
          file_size?: number | null
          id?: string
          metadata?: Json | null
          record_count?: number | null
          status?: string
          table_name?: string | null
        }
        Relationships: []
      }
      blocked_ips: {
        Row: {
          blocked_at: string
          blocked_until: string | null
          created_by: string | null
          empresa_id: string | null
          id: string
          ip_address: string
          reason: string
        }
        Insert: {
          blocked_at?: string
          blocked_until?: string | null
          created_by?: string | null
          empresa_id?: string | null
          id?: string
          ip_address: string
          reason: string
        }
        Update: {
          blocked_at?: string
          blocked_until?: string | null
          created_by?: string | null
          empresa_id?: string | null
          id?: string
          ip_address?: string
          reason?: string
        }
        Relationships: []
      }
      chat_room_messages: {
        Row: {
          content: string
          created_at: string
          edited_at: string | null
          id: string
          is_deleted: boolean
          message_type: string
          metadata: Json | null
          room_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          edited_at?: string | null
          id?: string
          is_deleted?: boolean
          message_type?: string
          metadata?: Json | null
          room_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          edited_at?: string | null
          id?: string
          is_deleted?: boolean
          message_type?: string
          metadata?: Json | null
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_room_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_room_participants: {
        Row: {
          id: string
          is_active: boolean
          joined_at: string
          role: string
          room_id: string
          user_id: string
        }
        Insert: {
          id?: string
          is_active?: boolean
          joined_at?: string
          role?: string
          room_id: string
          user_id: string
        }
        Update: {
          id?: string
          is_active?: boolean
          joined_at?: string
          role?: string
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_room_participants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_rooms: {
        Row: {
          created_at: string
          created_by: string
          department: string | null
          description: string | null
          empresa_id: string
          id: string
          is_private: boolean
          name: string
          room_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          department?: string | null
          description?: string | null
          empresa_id: string
          id?: string
          is_private?: boolean
          name: string
          room_type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          department?: string | null
          description?: string | null
          empresa_id?: string
          id?: string
          is_private?: boolean
          name?: string
          room_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      chatbot_flows: {
        Row: {
          activation_mode: string | null
          auto_start_enabled: boolean | null
          created_at: string | null
          empresa_id: string
          id: string
          is_default: boolean | null
          mensagem_inicial: string
          n8n_webhook_url: string | null
          nome: string
          priority: number | null
          status: string
          trigger_conditions: Json | null
          updated_at: string | null
        }
        Insert: {
          activation_mode?: string | null
          auto_start_enabled?: boolean | null
          created_at?: string | null
          empresa_id: string
          id?: string
          is_default?: boolean | null
          mensagem_inicial: string
          n8n_webhook_url?: string | null
          nome: string
          priority?: number | null
          status?: string
          trigger_conditions?: Json | null
          updated_at?: string | null
        }
        Update: {
          activation_mode?: string | null
          auto_start_enabled?: boolean | null
          created_at?: string | null
          empresa_id?: string
          id?: string
          is_default?: boolean | null
          mensagem_inicial?: string
          n8n_webhook_url?: string | null
          nome?: string
          priority?: number | null
          status?: string
          trigger_conditions?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chatbot_flows_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      chatbot_logs: {
        Row: {
          contact_phone: string | null
          correlation_id: string
          created_at: string | null
          current_stage: string | null
          function_name: string
          id: string
          level: string
          message: string
          metadata: Json | null
        }
        Insert: {
          contact_phone?: string | null
          correlation_id: string
          created_at?: string | null
          current_stage?: string | null
          function_name: string
          id?: string
          level?: string
          message: string
          metadata?: Json | null
        }
        Update: {
          contact_phone?: string | null
          correlation_id?: string
          created_at?: string | null
          current_stage?: string | null
          function_name?: string
          id?: string
          level?: string
          message?: string
          metadata?: Json | null
        }
        Relationships: []
      }
      chatbot_nodes: {
        Row: {
          created_at: string | null
          flow_id: string
          id: string
          mensagem: string
          node_id: string
          nome: string
          ordem: number | null
          tipo_resposta: string
        }
        Insert: {
          created_at?: string | null
          flow_id: string
          id?: string
          mensagem: string
          node_id: string
          nome: string
          ordem?: number | null
          tipo_resposta: string
        }
        Update: {
          created_at?: string | null
          flow_id?: string
          id?: string
          mensagem?: string
          node_id?: string
          nome?: string
          ordem?: number | null
          tipo_resposta?: string
        }
        Relationships: [
          {
            foreignKeyName: "chatbot_nodes_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "chatbot_flows"
            referencedColumns: ["id"]
          },
        ]
      }
      chatbot_options: {
        Row: {
          created_at: string | null
          id: string
          mensagem_final: string | null
          node_id: string
          option_id: string
          ordem: number | null
          proxima_acao: string
          proximo_node_id: string | null
          setor_transferencia: string | null
          texto: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          mensagem_final?: string | null
          node_id: string
          option_id: string
          ordem?: number | null
          proxima_acao: string
          proximo_node_id?: string | null
          setor_transferencia?: string | null
          texto: string
        }
        Update: {
          created_at?: string | null
          id?: string
          mensagem_final?: string | null
          node_id?: string
          option_id?: string
          ordem?: number | null
          proxima_acao?: string
          proximo_node_id?: string | null
          setor_transferencia?: string | null
          texto?: string
        }
        Relationships: [
          {
            foreignKeyName: "chatbot_options_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "chatbot_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      chatbot_sessions: {
        Row: {
          conversa_id: string
          created_at: string | null
          current_node_id: string
          flow_id: string
          id: string
          session_data: Json | null
          status: string
          updated_at: string | null
        }
        Insert: {
          conversa_id: string
          created_at?: string | null
          current_node_id: string
          flow_id: string
          id?: string
          session_data?: Json | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          conversa_id?: string
          created_at?: string | null
          current_node_id?: string
          flow_id?: string
          id?: string
          session_data?: Json | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chatbot_sessions_conversa_id_fkey"
            columns: ["conversa_id"]
            isOneToOne: true
            referencedRelation: "conversas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chatbot_sessions_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "chatbot_flows"
            referencedColumns: ["id"]
          },
        ]
      }
      chatbot_state: {
        Row: {
          contact_phone: string
          context: Json | null
          correlation_id: string | null
          created_at: string | null
          current_stage: string
          id: string
          last_message_id: string | null
          nlp_confidence: number | null
          nlp_intent: string | null
          updated_at: string | null
        }
        Insert: {
          contact_phone: string
          context?: Json | null
          correlation_id?: string | null
          created_at?: string | null
          current_stage?: string
          id?: string
          last_message_id?: string | null
          nlp_confidence?: number | null
          nlp_intent?: string | null
          updated_at?: string | null
        }
        Update: {
          contact_phone?: string
          context?: Json | null
          correlation_id?: string | null
          created_at?: string | null
          current_stage?: string
          id?: string
          last_message_id?: string | null
          nlp_confidence?: number | null
          nlp_intent?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      chatbots: {
        Row: {
          created_at: string | null
          empresa_id: string
          fluxo: Json | null
          id: string
          interacoes: number | null
          mensagem_inicial: string
          nome: string
          status: string
          transferencias: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          empresa_id: string
          fluxo?: Json | null
          id?: string
          interacoes?: number | null
          mensagem_inicial: string
          nome: string
          status?: string
          transferencias?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          empresa_id?: string
          fluxo?: Json | null
          id?: string
          interacoes?: number | null
          mensagem_inicial?: string
          nome?: string
          status?: string
          transferencias?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chatbots_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      connectivity_logs: {
        Row: {
          created_at: string
          empresa_id: string
          event_type: string
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          empresa_id: string
          event_type: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          empresa_id?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      contatos: {
        Row: {
          created_at: string | null
          email: string | null
          empresa: string | null
          empresa_id: string | null
          id: string
          nome: string
          observacoes: string | null
          status: string | null
          tags: string[] | null
          telefone: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          empresa?: string | null
          empresa_id?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          status?: string | null
          tags?: string[] | null
          telefone?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          empresa?: string | null
          empresa_id?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          status?: string | null
          tags?: string[] | null
          telefone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contatos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      conversas: {
        Row: {
          agente_id: string | null
          canal: string | null
          contato_id: string | null
          created_at: string | null
          empresa_id: string | null
          finished_at: string | null
          id: string
          prioridade: string | null
          resumo_atendimento: string | null
          setor: string | null
          status: string | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          agente_id?: string | null
          canal?: string | null
          contato_id?: string | null
          created_at?: string | null
          empresa_id?: string | null
          finished_at?: string | null
          id?: string
          prioridade?: string | null
          resumo_atendimento?: string | null
          setor?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          agente_id?: string | null
          canal?: string | null
          contato_id?: string | null
          created_at?: string | null
          empresa_id?: string | null
          finished_at?: string | null
          id?: string
          prioridade?: string | null
          resumo_atendimento?: string | null
          setor?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversas_agente_id_fkey"
            columns: ["agente_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversas_agente_id_fkey"
            columns: ["agente_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversas_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "contatos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      conversas_internas: {
        Row: {
          created_at: string | null
          empresa_id: string
          id: string
          nome: string | null
          participante_1_id: string
          participante_2_id: string
          tipo: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          empresa_id: string
          id?: string
          nome?: string | null
          participante_1_id: string
          participante_2_id: string
          tipo?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          empresa_id?: string
          id?: string
          nome?: string | null
          participante_1_id?: string
          participante_2_id?: string
          tipo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversas_internas_participante_1_id_fkey"
            columns: ["participante_1_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversas_internas_participante_1_id_fkey"
            columns: ["participante_1_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversas_internas_participante_2_id_fkey"
            columns: ["participante_2_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversas_internas_participante_2_id_fkey"
            columns: ["participante_2_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      distribuicao_atendimentos: {
        Row: {
          agente_anterior_id: string | null
          agente_novo_id: string | null
          conversa_id: string
          created_at: string
          created_by: string | null
          dados_agentes: Json | null
          empresa_id: string
          id: string
          metodo_distribuicao: string
          motivo: string
          resultado: string
          tempo_resposta_ms: number | null
        }
        Insert: {
          agente_anterior_id?: string | null
          agente_novo_id?: string | null
          conversa_id: string
          created_at?: string
          created_by?: string | null
          dados_agentes?: Json | null
          empresa_id: string
          id?: string
          metodo_distribuicao?: string
          motivo: string
          resultado: string
          tempo_resposta_ms?: number | null
        }
        Update: {
          agente_anterior_id?: string | null
          agente_novo_id?: string | null
          conversa_id?: string
          created_at?: string
          created_by?: string | null
          dados_agentes?: Json | null
          empresa_id?: string
          id?: string
          metodo_distribuicao?: string
          motivo?: string
          resultado?: string
          tempo_resposta_ms?: number | null
        }
        Relationships: []
      }
      empresas: {
        Row: {
          ativo: boolean | null
          cnpj: string | null
          created_at: string | null
          email: string | null
          endereco: string | null
          id: string
          limite_armazenamento_gb: number | null
          limite_contatos: number | null
          limite_usuarios: number | null
          limite_whatsapp_conexoes: number | null
          nome: string
          plano_id: string | null
          telefone: string | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          cnpj?: string | null
          created_at?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          limite_armazenamento_gb?: number | null
          limite_contatos?: number | null
          limite_usuarios?: number | null
          limite_whatsapp_conexoes?: number | null
          nome: string
          plano_id?: string | null
          telefone?: string | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          cnpj?: string | null
          created_at?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          limite_armazenamento_gb?: number | null
          limite_contatos?: number | null
          limite_usuarios?: number | null
          limite_whatsapp_conexoes?: number | null
          nome?: string
          plano_id?: string | null
          telefone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "empresas_plano_id_fkey"
            columns: ["plano_id"]
            isOneToOne: false
            referencedRelation: "planos"
            referencedColumns: ["id"]
          },
        ]
      }
      evolution_api_config: {
        Row: {
          always_online: boolean | null
          api_version: string | null
          ativo: boolean | null
          battery_level: number | null
          chatwoot_account_id: string | null
          chatwoot_conversation_pending: boolean | null
          chatwoot_reopen_conversation: boolean | null
          chatwoot_sign_msg: boolean | null
          chatwoot_token: string | null
          chatwoot_url: string | null
          connection_state: string | null
          created_at: string | null
          descricao: string | null
          empresa_id: string
          groups_ignore: boolean | null
          id: string
          instance_name: string
          integration_type: string | null
          last_connected_at: string | null
          last_webhook_test: string | null
          msg_call: string | null
          numero: string | null
          platform: string | null
          profile_name: string | null
          profile_picture_url: string | null
          proxy_host: string | null
          proxy_port: number | null
          proxy_protocol: string | null
          qr_code: string | null
          rabbitmq_enabled: boolean | null
          rabbitmq_uri: string | null
          read_messages: boolean | null
          read_status: boolean | null
          reject_call: boolean | null
          sqs_enabled: boolean | null
          status: string | null
          typebot_delay_message: number | null
          typebot_enabled: boolean | null
          typebot_expire: number | null
          typebot_keyword_restart: string | null
          typebot_listening_from_me: boolean | null
          typebot_public_id: string | null
          typebot_unknown_message: string | null
          typebot_url: string | null
          updated_at: string | null
          webhook_error_message: string | null
          webhook_events: string[] | null
          webhook_status: string | null
          webhook_url: string | null
          websocket_base64: boolean | null
          websocket_enabled: boolean | null
          websocket_events: string[] | null
        }
        Insert: {
          always_online?: boolean | null
          api_version?: string | null
          ativo?: boolean | null
          battery_level?: number | null
          chatwoot_account_id?: string | null
          chatwoot_conversation_pending?: boolean | null
          chatwoot_reopen_conversation?: boolean | null
          chatwoot_sign_msg?: boolean | null
          chatwoot_token?: string | null
          chatwoot_url?: string | null
          connection_state?: string | null
          created_at?: string | null
          descricao?: string | null
          empresa_id: string
          groups_ignore?: boolean | null
          id?: string
          instance_name: string
          integration_type?: string | null
          last_connected_at?: string | null
          last_webhook_test?: string | null
          msg_call?: string | null
          numero?: string | null
          platform?: string | null
          profile_name?: string | null
          profile_picture_url?: string | null
          proxy_host?: string | null
          proxy_port?: number | null
          proxy_protocol?: string | null
          qr_code?: string | null
          rabbitmq_enabled?: boolean | null
          rabbitmq_uri?: string | null
          read_messages?: boolean | null
          read_status?: boolean | null
          reject_call?: boolean | null
          sqs_enabled?: boolean | null
          status?: string | null
          typebot_delay_message?: number | null
          typebot_enabled?: boolean | null
          typebot_expire?: number | null
          typebot_keyword_restart?: string | null
          typebot_listening_from_me?: boolean | null
          typebot_public_id?: string | null
          typebot_unknown_message?: string | null
          typebot_url?: string | null
          updated_at?: string | null
          webhook_error_message?: string | null
          webhook_events?: string[] | null
          webhook_status?: string | null
          webhook_url?: string | null
          websocket_base64?: boolean | null
          websocket_enabled?: boolean | null
          websocket_events?: string[] | null
        }
        Update: {
          always_online?: boolean | null
          api_version?: string | null
          ativo?: boolean | null
          battery_level?: number | null
          chatwoot_account_id?: string | null
          chatwoot_conversation_pending?: boolean | null
          chatwoot_reopen_conversation?: boolean | null
          chatwoot_sign_msg?: boolean | null
          chatwoot_token?: string | null
          chatwoot_url?: string | null
          connection_state?: string | null
          created_at?: string | null
          descricao?: string | null
          empresa_id?: string
          groups_ignore?: boolean | null
          id?: string
          instance_name?: string
          integration_type?: string | null
          last_connected_at?: string | null
          last_webhook_test?: string | null
          msg_call?: string | null
          numero?: string | null
          platform?: string | null
          profile_name?: string | null
          profile_picture_url?: string | null
          proxy_host?: string | null
          proxy_port?: number | null
          proxy_protocol?: string | null
          qr_code?: string | null
          rabbitmq_enabled?: boolean | null
          rabbitmq_uri?: string | null
          read_messages?: boolean | null
          read_status?: boolean | null
          reject_call?: boolean | null
          sqs_enabled?: boolean | null
          status?: string | null
          typebot_delay_message?: number | null
          typebot_enabled?: boolean | null
          typebot_expire?: number | null
          typebot_keyword_restart?: string | null
          typebot_listening_from_me?: boolean | null
          typebot_public_id?: string | null
          typebot_unknown_message?: string | null
          typebot_url?: string | null
          updated_at?: string | null
          webhook_error_message?: string | null
          webhook_events?: string[] | null
          webhook_status?: string | null
          webhook_url?: string | null
          websocket_base64?: boolean | null
          websocket_enabled?: boolean | null
          websocket_events?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "evolution_api_config_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      evolution_api_global_config: {
        Row: {
          api_key: string
          ativo: boolean | null
          created_at: string | null
          environment: string | null
          id: string
          rate_limit_per_minute: number | null
          retry_attempts: number | null
          server_url: string
          timeout_ms: number | null
          updated_at: string | null
          webhook_base_path: string | null
          webhook_base_url: string | null
        }
        Insert: {
          api_key: string
          ativo?: boolean | null
          created_at?: string | null
          environment?: string | null
          id?: string
          rate_limit_per_minute?: number | null
          retry_attempts?: number | null
          server_url: string
          timeout_ms?: number | null
          updated_at?: string | null
          webhook_base_path?: string | null
          webhook_base_url?: string | null
        }
        Update: {
          api_key?: string
          ativo?: boolean | null
          created_at?: string | null
          environment?: string | null
          id?: string
          rate_limit_per_minute?: number | null
          retry_attempts?: number | null
          server_url?: string
          timeout_ms?: number | null
          updated_at?: string | null
          webhook_base_path?: string | null
          webhook_base_url?: string | null
        }
        Relationships: []
      }
      evolution_api_instance_stats: {
        Row: {
          created_at: string | null
          error_count_today: number | null
          id: string
          instance_id: string
          last_activity: string | null
          messages_received_today: number | null
          messages_sent_today: number | null
          success_rate_today: number | null
          total_contacts: number | null
          total_groups: number | null
          updated_at: string | null
          uptime_minutes: number | null
          webhook_delivery_rate: number | null
        }
        Insert: {
          created_at?: string | null
          error_count_today?: number | null
          id?: string
          instance_id: string
          last_activity?: string | null
          messages_received_today?: number | null
          messages_sent_today?: number | null
          success_rate_today?: number | null
          total_contacts?: number | null
          total_groups?: number | null
          updated_at?: string | null
          uptime_minutes?: number | null
          webhook_delivery_rate?: number | null
        }
        Update: {
          created_at?: string | null
          error_count_today?: number | null
          id?: string
          instance_id?: string
          last_activity?: string | null
          messages_received_today?: number | null
          messages_sent_today?: number | null
          success_rate_today?: number | null
          total_contacts?: number | null
          total_groups?: number | null
          updated_at?: string | null
          uptime_minutes?: number | null
          webhook_delivery_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "evolution_api_instance_stats_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "evolution_api_config"
            referencedColumns: ["id"]
          },
        ]
      }
      evolution_api_logs: {
        Row: {
          created_at: string | null
          empresa_id: string | null
          error_message: string | null
          event_data: Json | null
          event_type: string
          id: string
          instance_name: string
          success: boolean | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          empresa_id?: string | null
          error_message?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          instance_name: string
          success?: boolean | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          empresa_id?: string | null
          error_message?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          instance_name?: string
          success?: boolean | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evolution_api_logs_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      failed_messages: {
        Row: {
          correlation_id: string
          created_at: string
          error_message: string
          failure_count: number
          first_failed_at: string
          id: string
          last_failed_at: string
          message_type: string
          metadata: Json | null
          original_message_id: string
          payload: Json
        }
        Insert: {
          correlation_id: string
          created_at?: string
          error_message: string
          failure_count?: number
          first_failed_at?: string
          id?: string
          last_failed_at?: string
          message_type: string
          metadata?: Json | null
          original_message_id: string
          payload: Json
        }
        Update: {
          correlation_id?: string
          created_at?: string
          error_message?: string
          failure_count?: number
          first_failed_at?: string
          id?: string
          last_failed_at?: string
          message_type?: string
          metadata?: Json | null
          original_message_id?: string
          payload?: Json
        }
        Relationships: []
      }
      integration_event_logs: {
        Row: {
          event_id: string
          id: string
          level: string
          logged_at: string
          message: string
          metadata: Json | null
        }
        Insert: {
          event_id: string
          id?: string
          level: string
          logged_at?: string
          message: string
          metadata?: Json | null
        }
        Update: {
          event_id?: string
          id?: string
          level?: string
          logged_at?: string
          message?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "integration_event_logs_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "integration_events"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_events: {
        Row: {
          correlation_id: string
          created_at: string
          delivered_at: string | null
          destination: string | null
          empresa_id: string
          error_message: string | null
          event_type: string
          id: string
          idempotency_key: string | null
          max_retries: number | null
          payload: Json
          processed_at: string | null
          retry_count: number | null
          source: string | null
          status: string
          updated_at: string
        }
        Insert: {
          correlation_id: string
          created_at?: string
          delivered_at?: string | null
          destination?: string | null
          empresa_id: string
          error_message?: string | null
          event_type: string
          id?: string
          idempotency_key?: string | null
          max_retries?: number | null
          payload?: Json
          processed_at?: string | null
          retry_count?: number | null
          source?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          correlation_id?: string
          created_at?: string
          delivered_at?: string | null
          destination?: string | null
          empresa_id?: string
          error_message?: string | null
          event_type?: string
          id?: string
          idempotency_key?: string | null
          max_retries?: number | null
          payload?: Json
          processed_at?: string | null
          retry_count?: number | null
          source?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_events_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      mensagens: {
        Row: {
          conteudo: string
          conversa_id: string | null
          created_at: string | null
          id: string
          lida: boolean | null
          metadata: Json | null
          remetente_id: string | null
          remetente_nome: string | null
          remetente_tipo: string
          tipo_mensagem: string | null
        }
        Insert: {
          conteudo: string
          conversa_id?: string | null
          created_at?: string | null
          id?: string
          lida?: boolean | null
          metadata?: Json | null
          remetente_id?: string | null
          remetente_nome?: string | null
          remetente_tipo: string
          tipo_mensagem?: string | null
        }
        Update: {
          conteudo?: string
          conversa_id?: string | null
          created_at?: string | null
          id?: string
          lida?: boolean | null
          metadata?: Json | null
          remetente_id?: string | null
          remetente_nome?: string | null
          remetente_tipo?: string
          tipo_mensagem?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mensagens_conversa_id_fkey"
            columns: ["conversa_id"]
            isOneToOne: false
            referencedRelation: "conversas"
            referencedColumns: ["id"]
          },
        ]
      }
      mensagens_internas: {
        Row: {
          conteudo: string
          conversa_interna_id: string
          created_at: string | null
          id: string
          lida: boolean | null
          remetente_id: string
          tipo_mensagem: string | null
        }
        Insert: {
          conteudo: string
          conversa_interna_id: string
          created_at?: string | null
          id?: string
          lida?: boolean | null
          remetente_id: string
          tipo_mensagem?: string | null
        }
        Update: {
          conteudo?: string
          conversa_interna_id?: string
          created_at?: string | null
          id?: string
          lida?: boolean | null
          remetente_id?: string
          tipo_mensagem?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mensagens_internas_conversa_interna_id_fkey"
            columns: ["conversa_interna_id"]
            isOneToOne: false
            referencedRelation: "conversas_internas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensagens_internas_remetente_id_fkey"
            columns: ["remetente_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensagens_internas_remetente_id_fkey"
            columns: ["remetente_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      message_queue: {
        Row: {
          correlation_id: string
          created_at: string | null
          error_message: string | null
          id: string
          max_retries: number | null
          message_type: string
          metadata: Json | null
          payload: Json
          priority: number | null
          processed_at: string | null
          retry_count: number | null
          scheduled_at: string | null
          status: string
        }
        Insert: {
          correlation_id?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          max_retries?: number | null
          message_type?: string
          metadata?: Json | null
          payload: Json
          priority?: number | null
          processed_at?: string | null
          retry_count?: number | null
          scheduled_at?: string | null
          status?: string
        }
        Update: {
          correlation_id?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          max_retries?: number | null
          message_type?: string
          metadata?: Json | null
          payload?: Json
          priority?: number | null
          processed_at?: string | null
          retry_count?: number | null
          scheduled_at?: string | null
          status?: string
        }
        Relationships: []
      }
      message_templates: {
        Row: {
          category: string
          content: string
          created_at: string
          created_by: string
          empresa_id: string
          id: string
          is_default: boolean
          is_favorite: boolean
          last_used: string | null
          name: string
          tags: string[] | null
          updated_at: string
          usage_count: number
          variables: string[] | null
        }
        Insert: {
          category: string
          content: string
          created_at?: string
          created_by: string
          empresa_id: string
          id?: string
          is_default?: boolean
          is_favorite?: boolean
          last_used?: string | null
          name: string
          tags?: string[] | null
          updated_at?: string
          usage_count?: number
          variables?: string[] | null
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          created_by?: string
          empresa_id?: string
          id?: string
          is_default?: boolean
          is_favorite?: boolean
          last_used?: string | null
          name?: string
          tags?: string[] | null
          updated_at?: string
          usage_count?: number
          variables?: string[] | null
        }
        Relationships: []
      }
      n8n_configurations: {
        Row: {
          api_key: string | null
          created_at: string
          empresa_id: string
          id: string
          instance_url: string
          last_ping: string | null
          settings: Json | null
          status: string
          success_rate: number | null
          total_executions: number | null
          updated_at: string
          webhook_receive_url: string | null
          webhook_send_url: string | null
          workflow_count: number | null
        }
        Insert: {
          api_key?: string | null
          created_at?: string
          empresa_id: string
          id?: string
          instance_url?: string
          last_ping?: string | null
          settings?: Json | null
          status?: string
          success_rate?: number | null
          total_executions?: number | null
          updated_at?: string
          webhook_receive_url?: string | null
          webhook_send_url?: string | null
          workflow_count?: number | null
        }
        Update: {
          api_key?: string | null
          created_at?: string
          empresa_id?: string
          id?: string
          instance_url?: string
          last_ping?: string | null
          settings?: Json | null
          status?: string
          success_rate?: number | null
          total_executions?: number | null
          updated_at?: string
          webhook_receive_url?: string | null
          webhook_send_url?: string | null
          workflow_count?: number | null
        }
        Relationships: []
      }
      n8n_execution_logs: {
        Row: {
          config_id: string
          created_at: string
          duration_ms: number | null
          error_message: string | null
          event_type: string | null
          execution_id: string | null
          id: string
          input_data: Json | null
          output_data: Json | null
          status: string
          workflow_id: string | null
        }
        Insert: {
          config_id: string
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          event_type?: string | null
          execution_id?: string | null
          id?: string
          input_data?: Json | null
          output_data?: Json | null
          status: string
          workflow_id?: string | null
        }
        Update: {
          config_id?: string
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          event_type?: string | null
          execution_id?: string | null
          id?: string
          input_data?: Json | null
          output_data?: Json | null
          status?: string
          workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "n8n_execution_logs_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "n8n_configurations"
            referencedColumns: ["id"]
          },
        ]
      }
      nlp_intents: {
        Row: {
          active: boolean | null
          confidence_threshold: number | null
          created_at: string | null
          empresa_id: string
          id: string
          intent_name: string
          parameters: Json | null
          target_stage: string
          training_phrases: string[] | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          confidence_threshold?: number | null
          created_at?: string | null
          empresa_id: string
          id?: string
          intent_name: string
          parameters?: Json | null
          target_stage: string
          training_phrases?: string[] | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          confidence_threshold?: number | null
          created_at?: string | null
          empresa_id?: string
          id?: string
          intent_name?: string
          parameters?: Json | null
          target_stage?: string
          training_phrases?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nlp_intents_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          empresa_id: string
          id: string
          message: string
          read: boolean
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          empresa_id: string
          id?: string
          message: string
          read?: boolean
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          empresa_id?: string
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      offline_data_cache: {
        Row: {
          cache_data: Json
          cache_key: string
          created_at: string
          expires_at: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cache_data: Json
          cache_key: string
          created_at?: string
          expires_at?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cache_data?: Json
          cache_key?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      offline_sync_logs: {
        Row: {
          created_at: string
          error_details: Json | null
          id: string
          items_failed: number | null
          items_synced: number | null
          success: boolean
          sync_duration_ms: number | null
          sync_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error_details?: Json | null
          id?: string
          items_failed?: number | null
          items_synced?: number | null
          success?: boolean
          sync_duration_ms?: number | null
          sync_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          error_details?: Json | null
          id?: string
          items_failed?: number | null
          items_synced?: number | null
          success?: boolean
          sync_duration_ms?: number | null
          sync_type?: string
          user_id?: string
        }
        Relationships: []
      }
      planos: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          descricao: string | null
          id: string
          limite_armazenamento_gb: number | null
          limite_contatos: number | null
          limite_usuarios: number | null
          nome: string
          pode_usar_api: boolean | null
          pode_usar_automacao: boolean | null
          pode_usar_chat_interno: boolean | null
          pode_usar_chatbot: boolean | null
          pode_usar_kanban: boolean | null
          pode_usar_relatorios: boolean | null
          preco_mensal: number | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          limite_armazenamento_gb?: number | null
          limite_contatos?: number | null
          limite_usuarios?: number | null
          nome: string
          pode_usar_api?: boolean | null
          pode_usar_automacao?: boolean | null
          pode_usar_chat_interno?: boolean | null
          pode_usar_chatbot?: boolean | null
          pode_usar_kanban?: boolean | null
          pode_usar_relatorios?: boolean | null
          preco_mensal?: number | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          limite_armazenamento_gb?: number | null
          limite_contatos?: number | null
          limite_usuarios?: number | null
          nome?: string
          pode_usar_api?: boolean | null
          pode_usar_automacao?: boolean | null
          pode_usar_chat_interno?: boolean | null
          pode_usar_chatbot?: boolean | null
          pode_usar_kanban?: boolean | null
          pode_usar_relatorios?: boolean | null
          preco_mensal?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          aceita_novos_atendimentos: boolean | null
          avatar_url: string | null
          cargo: string | null
          created_at: string | null
          email: string
          empresa_id: string | null
          failed_login_attempts: number | null
          id: string
          last_login_at: string | null
          limite_atendimentos: number | null
          nome: string
          permissoes: Json | null
          preferencia_setor: string | null
          setor: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          aceita_novos_atendimentos?: boolean | null
          avatar_url?: string | null
          cargo?: string | null
          created_at?: string | null
          email: string
          empresa_id?: string | null
          failed_login_attempts?: number | null
          id: string
          last_login_at?: string | null
          limite_atendimentos?: number | null
          nome: string
          permissoes?: Json | null
          preferencia_setor?: string | null
          setor?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          aceita_novos_atendimentos?: boolean | null
          avatar_url?: string | null
          cargo?: string | null
          created_at?: string | null
          email?: string
          empresa_id?: string | null
          failed_login_attempts?: number | null
          id?: string
          last_login_at?: string | null
          limite_atendimentos?: number | null
          nome?: string
          permissoes?: Json | null
          preferencia_setor?: string | null
          setor?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      relatorios_metricas: {
        Row: {
          atendimentos_pendentes: number | null
          atendimentos_resolvidos: number | null
          created_at: string | null
          data_referencia: string
          empresa_id: string
          id: string
          nps: number | null
          satisfacao_media: number | null
          taxa_resolucao: number | null
          tempo_medio_atendimento: number | null
          total_atendimentos: number | null
          updated_at: string | null
          volume_chat_interno: number | null
          volume_email: number | null
          volume_whatsapp: number | null
        }
        Insert: {
          atendimentos_pendentes?: number | null
          atendimentos_resolvidos?: number | null
          created_at?: string | null
          data_referencia: string
          empresa_id: string
          id?: string
          nps?: number | null
          satisfacao_media?: number | null
          taxa_resolucao?: number | null
          tempo_medio_atendimento?: number | null
          total_atendimentos?: number | null
          updated_at?: string | null
          volume_chat_interno?: number | null
          volume_email?: number | null
          volume_whatsapp?: number | null
        }
        Update: {
          atendimentos_pendentes?: number | null
          atendimentos_resolvidos?: number | null
          created_at?: string | null
          data_referencia?: string
          empresa_id?: string
          id?: string
          nps?: number | null
          satisfacao_media?: number | null
          taxa_resolucao?: number | null
          tempo_medio_atendimento?: number | null
          total_atendimentos?: number | null
          updated_at?: string | null
          volume_chat_interno?: number | null
          volume_email?: number | null
          volume_whatsapp?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "relatorios_metricas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      security_logs: {
        Row: {
          blocked: boolean | null
          created_at: string
          empresa_id: string
          event_data: Json | null
          event_type: string
          id: string
          ip_address: string | null
          severity: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          blocked?: boolean | null
          created_at?: string
          empresa_id: string
          event_data?: Json | null
          event_type: string
          id?: string
          ip_address?: string | null
          severity?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          blocked?: boolean | null
          created_at?: string
          empresa_id?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          ip_address?: string | null
          severity?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      security_settings: {
        Row: {
          created_at: string
          empresa_id: string
          enable_2fa: boolean | null
          enable_ip_blocking: boolean | null
          id: string
          lockout_duration_minutes: number | null
          max_login_attempts: number | null
          password_min_length: number | null
          password_require_numbers: boolean | null
          password_require_symbols: boolean | null
          password_require_uppercase: boolean | null
          rate_limit_requests: number | null
          rate_limit_window_minutes: number | null
          settings: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          empresa_id: string
          enable_2fa?: boolean | null
          enable_ip_blocking?: boolean | null
          id?: string
          lockout_duration_minutes?: number | null
          max_login_attempts?: number | null
          password_min_length?: number | null
          password_require_numbers?: boolean | null
          password_require_symbols?: boolean | null
          password_require_uppercase?: boolean | null
          rate_limit_requests?: number | null
          rate_limit_window_minutes?: number | null
          settings?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          empresa_id?: string
          enable_2fa?: boolean | null
          enable_ip_blocking?: boolean | null
          id?: string
          lockout_duration_minutes?: number | null
          max_login_attempts?: number | null
          password_min_length?: number | null
          password_require_numbers?: boolean | null
          password_require_symbols?: boolean | null
          password_require_uppercase?: boolean | null
          rate_limit_requests?: number | null
          rate_limit_window_minutes?: number | null
          settings?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      sentiment_analysis: {
        Row: {
          conversa_id: string | null
          created_at: string | null
          emocao: string | null
          empresa_id: string
          id: string
          mensagem_id: string | null
          palavras_chave: string[] | null
          sentimento_confianca: number | null
          sentimento_score: number | null
          sugestao_ia: string | null
          updated_at: string | null
        }
        Insert: {
          conversa_id?: string | null
          created_at?: string | null
          emocao?: string | null
          empresa_id: string
          id?: string
          mensagem_id?: string | null
          palavras_chave?: string[] | null
          sentimento_confianca?: number | null
          sentimento_score?: number | null
          sugestao_ia?: string | null
          updated_at?: string | null
        }
        Update: {
          conversa_id?: string | null
          created_at?: string | null
          emocao?: string | null
          empresa_id?: string
          id?: string
          mensagem_id?: string | null
          palavras_chave?: string[] | null
          sentimento_confianca?: number | null
          sentimento_score?: number | null
          sugestao_ia?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sentiment_analysis_conversa_id_fkey"
            columns: ["conversa_id"]
            isOneToOne: false
            referencedRelation: "conversas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sentiment_analysis_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sentiment_analysis_mensagem_id_fkey"
            columns: ["mensagem_id"]
            isOneToOne: false
            referencedRelation: "mensagens"
            referencedColumns: ["id"]
          },
        ]
      }
      setores: {
        Row: {
          agentes_ativos: number | null
          atendimentos_ativos: number | null
          ativo: boolean | null
          capacidade_maxima: number | null
          cor: string | null
          created_at: string | null
          descricao: string | null
          empresa_id: string | null
          id: string
          nome: string
        }
        Insert: {
          agentes_ativos?: number | null
          atendimentos_ativos?: number | null
          ativo?: boolean | null
          capacidade_maxima?: number | null
          cor?: string | null
          created_at?: string | null
          descricao?: string | null
          empresa_id?: string | null
          id?: string
          nome: string
        }
        Update: {
          agentes_ativos?: number | null
          atendimentos_ativos?: number | null
          ativo?: boolean | null
          capacidade_maxima?: number | null
          cor?: string | null
          created_at?: string | null
          descricao?: string | null
          empresa_id?: string | null
          id?: string
          nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "setores_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      setores_sistema: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          descricao: string | null
          id: string
          nome: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      system_monitoring: {
        Row: {
          created_at: string
          empresa_id: string | null
          id: string
          metadata: Json | null
          metric_name: string
          metric_type: string
          metric_value: number | null
        }
        Insert: {
          created_at?: string
          empresa_id?: string | null
          id?: string
          metadata?: Json | null
          metric_name: string
          metric_type: string
          metric_value?: number | null
        }
        Update: {
          created_at?: string
          empresa_id?: string | null
          id?: string
          metadata?: Json | null
          metric_name?: string
          metric_type?: string
          metric_value?: number | null
        }
        Relationships: []
      }
      transferencias: {
        Row: {
          conversa_id: string | null
          created_at: string | null
          de_agente_id: string | null
          id: string
          motivo: string | null
          para_agente_id: string | null
          status: string | null
        }
        Insert: {
          conversa_id?: string | null
          created_at?: string | null
          de_agente_id?: string | null
          id?: string
          motivo?: string | null
          para_agente_id?: string | null
          status?: string | null
        }
        Update: {
          conversa_id?: string | null
          created_at?: string | null
          de_agente_id?: string | null
          id?: string
          motivo?: string | null
          para_agente_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transferencias_conversa_id_fkey"
            columns: ["conversa_id"]
            isOneToOne: false
            referencedRelation: "conversas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transferencias_de_agente_id_fkey"
            columns: ["de_agente_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transferencias_de_agente_id_fkey"
            columns: ["de_agente_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transferencias_para_agente_id_fkey"
            columns: ["para_agente_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transferencias_para_agente_id_fkey"
            columns: ["para_agente_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      trigger_activations: {
        Row: {
          actions_executed: Json | null
          activation_reason: string
          conditions_met: Json | null
          contact_phone: string
          created_at: string | null
          error_message: string | null
          id: string
          success: boolean | null
          trigger_id: string
        }
        Insert: {
          actions_executed?: Json | null
          activation_reason: string
          conditions_met?: Json | null
          contact_phone: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          success?: boolean | null
          trigger_id: string
        }
        Update: {
          actions_executed?: Json | null
          activation_reason?: string
          conditions_met?: Json | null
          contact_phone?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          success?: boolean | null
          trigger_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trigger_activations_trigger_id_fkey"
            columns: ["trigger_id"]
            isOneToOne: false
            referencedRelation: "automation_triggers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_appearance_settings: {
        Row: {
          animations: boolean
          atendimento_left_panel_collapsed: boolean | null
          atendimento_right_panel_collapsed: boolean | null
          auto_detect: boolean
          color_scheme: string
          compact_mode: boolean
          created_at: string
          currency: string
          date_format: string
          density_mode: string
          first_day_of_week: string
          font_size: string
          high_contrast: boolean
          id: string
          keyboard_navigation: boolean
          number_format: string
          primary_language: string
          reduced_motion: boolean
          screen_reader: boolean
          secondary_language: string
          show_avatars: boolean
          show_timestamps: boolean
          sidebar_collapsed: boolean
          theme: string
          time_format: string
          timezone: string
          translate_messages: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          animations?: boolean
          atendimento_left_panel_collapsed?: boolean | null
          atendimento_right_panel_collapsed?: boolean | null
          auto_detect?: boolean
          color_scheme?: string
          compact_mode?: boolean
          created_at?: string
          currency?: string
          date_format?: string
          density_mode?: string
          first_day_of_week?: string
          font_size?: string
          high_contrast?: boolean
          id?: string
          keyboard_navigation?: boolean
          number_format?: string
          primary_language?: string
          reduced_motion?: boolean
          screen_reader?: boolean
          secondary_language?: string
          show_avatars?: boolean
          show_timestamps?: boolean
          sidebar_collapsed?: boolean
          theme?: string
          time_format?: string
          timezone?: string
          translate_messages?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          animations?: boolean
          atendimento_left_panel_collapsed?: boolean | null
          atendimento_right_panel_collapsed?: boolean | null
          auto_detect?: boolean
          color_scheme?: string
          compact_mode?: boolean
          created_at?: string
          currency?: string
          date_format?: string
          density_mode?: string
          first_day_of_week?: string
          font_size?: string
          high_contrast?: boolean
          id?: string
          keyboard_navigation?: boolean
          number_format?: string
          primary_language?: string
          reduced_motion?: boolean
          screen_reader?: boolean
          secondary_language?: string
          show_avatars?: boolean
          show_timestamps?: boolean
          sidebar_collapsed?: boolean
          theme?: string
          time_format?: string
          timezone?: string
          translate_messages?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_notification_preferences: {
        Row: {
          created_at: string | null
          email_marketing_emails: boolean | null
          email_new_messages: boolean | null
          email_security_alerts: boolean | null
          email_system_updates: boolean | null
          email_task_assignments: boolean | null
          email_weekly_report: boolean | null
          id: string
          push_breaks: boolean | null
          push_mentions: boolean | null
          push_new_messages: boolean | null
          push_reminders: boolean | null
          push_system_alerts: boolean | null
          schedule_quiet_end: string | null
          schedule_quiet_hours: boolean | null
          schedule_quiet_start: string | null
          schedule_vacation_mode: boolean | null
          schedule_weekend_quiet: boolean | null
          sound_alert_sound: boolean | null
          sound_message_sound: boolean | null
          sound_notification_sound: boolean | null
          sound_volume: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email_marketing_emails?: boolean | null
          email_new_messages?: boolean | null
          email_security_alerts?: boolean | null
          email_system_updates?: boolean | null
          email_task_assignments?: boolean | null
          email_weekly_report?: boolean | null
          id?: string
          push_breaks?: boolean | null
          push_mentions?: boolean | null
          push_new_messages?: boolean | null
          push_reminders?: boolean | null
          push_system_alerts?: boolean | null
          schedule_quiet_end?: string | null
          schedule_quiet_hours?: boolean | null
          schedule_quiet_start?: string | null
          schedule_vacation_mode?: boolean | null
          schedule_weekend_quiet?: boolean | null
          sound_alert_sound?: boolean | null
          sound_message_sound?: boolean | null
          sound_notification_sound?: boolean | null
          sound_volume?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email_marketing_emails?: boolean | null
          email_new_messages?: boolean | null
          email_security_alerts?: boolean | null
          email_system_updates?: boolean | null
          email_task_assignments?: boolean | null
          email_weekly_report?: boolean | null
          id?: string
          push_breaks?: boolean | null
          push_mentions?: boolean | null
          push_new_messages?: boolean | null
          push_reminders?: boolean | null
          push_system_alerts?: boolean | null
          schedule_quiet_end?: string | null
          schedule_quiet_hours?: boolean | null
          schedule_quiet_start?: string | null
          schedule_vacation_mode?: boolean | null
          schedule_weekend_quiet?: boolean | null
          sound_alert_sound?: boolean | null
          sound_message_sound?: boolean | null
          sound_notification_sound?: boolean | null
          sound_volume?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_service_worker_settings: {
        Row: {
          auto_sync_enabled: boolean
          cache_expiry_hours: number
          created_at: string
          id: string
          offline_mode_enabled: boolean
          settings: Json | null
          sync_on_connection: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_sync_enabled?: boolean
          cache_expiry_hours?: number
          created_at?: string
          id?: string
          offline_mode_enabled?: boolean
          settings?: Json | null
          sync_on_connection?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_sync_enabled?: boolean
          cache_expiry_hours?: number
          created_at?: string
          id?: string
          offline_mode_enabled?: boolean
          settings?: Json | null
          sync_on_connection?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      video_audio_calls: {
        Row: {
          agente_id: string | null
          contato_id: string | null
          created_at: string | null
          duracao: number | null
          empresa_id: string
          ended_at: string | null
          gravacao_url: string | null
          id: string
          notas: string | null
          qualidade_audio: string | null
          qualidade_video: string | null
          started_at: string | null
          status: string | null
          tipo: string
          updated_at: string | null
        }
        Insert: {
          agente_id?: string | null
          contato_id?: string | null
          created_at?: string | null
          duracao?: number | null
          empresa_id: string
          ended_at?: string | null
          gravacao_url?: string | null
          id?: string
          notas?: string | null
          qualidade_audio?: string | null
          qualidade_video?: string | null
          started_at?: string | null
          status?: string | null
          tipo: string
          updated_at?: string | null
        }
        Update: {
          agente_id?: string | null
          contato_id?: string | null
          created_at?: string | null
          duracao?: number | null
          empresa_id?: string
          ended_at?: string | null
          gravacao_url?: string | null
          id?: string
          notas?: string | null
          qualidade_audio?: string | null
          qualidade_video?: string | null
          started_at?: string | null
          status?: string | null
          tipo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "video_audio_calls_agente_id_fkey"
            columns: ["agente_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_audio_calls_agente_id_fkey"
            columns: ["agente_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_audio_calls_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "contatos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_audio_calls_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_delivery_logs: {
        Row: {
          created_at: string | null
          delivered_at: string | null
          delivery_attempt: number | null
          error_message: string | null
          event_type: string
          id: string
          instance_id: string | null
          payload: Json
          processing_time_ms: number | null
          response_body: string | null
          response_status: number | null
          success: boolean | null
          webhook_url: string
        }
        Insert: {
          created_at?: string | null
          delivered_at?: string | null
          delivery_attempt?: number | null
          error_message?: string | null
          event_type: string
          id?: string
          instance_id?: string | null
          payload: Json
          processing_time_ms?: number | null
          response_body?: string | null
          response_status?: number | null
          success?: boolean | null
          webhook_url: string
        }
        Update: {
          created_at?: string | null
          delivered_at?: string | null
          delivery_attempt?: number | null
          error_message?: string | null
          event_type?: string
          id?: string
          instance_id?: string | null
          payload?: Json
          processing_time_ms?: number | null
          response_body?: string | null
          response_status?: number | null
          success?: boolean | null
          webhook_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_delivery_logs_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "evolution_api_config"
            referencedColumns: ["id"]
          },
        ]
      }
      webhooks: {
        Row: {
          ativo: boolean | null
          created_at: string
          empresa_id: string
          eventos: string[] | null
          headers: Json | null
          id: string
          nome: string
          updated_at: string
          url: string
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string
          empresa_id: string
          eventos?: string[] | null
          headers?: Json | null
          id?: string
          nome: string
          updated_at?: string
          url: string
        }
        Update: {
          ativo?: boolean | null
          created_at?: string
          empresa_id?: string
          eventos?: string[] | null
          headers?: Json | null
          id?: string
          nome?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      webhooks_config: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          empresa_id: string
          id: string
          instance_id: string
          ultimo_erro: string | null
          ultimo_teste: string | null
          updated_at: string | null
          webhook_events: string[] | null
          webhook_status: string | null
          webhook_url: string
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          empresa_id: string
          id?: string
          instance_id: string
          ultimo_erro?: string | null
          ultimo_teste?: string | null
          updated_at?: string | null
          webhook_events?: string[] | null
          webhook_status?: string | null
          webhook_url: string
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          empresa_id?: string
          id?: string
          instance_id?: string
          ultimo_erro?: string | null
          ultimo_teste?: string | null
          updated_at?: string | null
          webhook_events?: string[] | null
          webhook_status?: string | null
          webhook_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhooks_config_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhooks_config_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: true
            referencedRelation: "evolution_api_config"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_connections: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          empresa_id: string | null
          evolution_instance_name: string | null
          evolution_qr_code: string | null
          evolution_status: string | null
          id: string
          nome: string
          numero: string
          qr_code: string | null
          send_webhook_url: string | null
          status: string | null
          ultimo_ping: string | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          empresa_id?: string | null
          evolution_instance_name?: string | null
          evolution_qr_code?: string | null
          evolution_status?: string | null
          id?: string
          nome: string
          numero: string
          qr_code?: string | null
          send_webhook_url?: string | null
          status?: string | null
          ultimo_ping?: string | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          empresa_id?: string | null
          evolution_instance_name?: string | null
          evolution_qr_code?: string | null
          evolution_status?: string | null
          id?: string
          nome?: string
          numero?: string
          qr_code?: string | null
          send_webhook_url?: string | null
          status?: string | null
          ultimo_ping?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_connections_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_group_participants: {
        Row: {
          created_at: string | null
          group_id: string
          id: string
          is_admin: boolean | null
          is_super_admin: boolean | null
          joined_at: string | null
          participant_jid: string
          participant_name: string | null
        }
        Insert: {
          created_at?: string | null
          group_id: string
          id?: string
          is_admin?: boolean | null
          is_super_admin?: boolean | null
          joined_at?: string | null
          participant_jid: string
          participant_name?: string | null
        }
        Update: {
          created_at?: string | null
          group_id?: string
          id?: string
          is_admin?: boolean | null
          is_super_admin?: boolean | null
          joined_at?: string | null
          participant_jid?: string
          participant_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_group_participants_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_groups: {
        Row: {
          created_at: string | null
          empresa_id: string
          group_description: string | null
          group_jid: string
          group_name: string
          group_picture_url: string | null
          id: string
          instance_id: string
          is_admin: boolean | null
          is_announcement: boolean | null
          is_restricted: boolean | null
          last_activity: string | null
          participants_count: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          empresa_id: string
          group_description?: string | null
          group_jid: string
          group_name: string
          group_picture_url?: string | null
          id?: string
          instance_id: string
          is_admin?: boolean | null
          is_announcement?: boolean | null
          is_restricted?: boolean | null
          last_activity?: string | null
          participants_count?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          empresa_id?: string
          group_description?: string | null
          group_jid?: string
          group_name?: string
          group_picture_url?: string | null
          id?: string
          instance_id?: string
          is_admin?: boolean | null
          is_announcement?: boolean | null
          is_restricted?: boolean | null
          last_activity?: string | null
          participants_count?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_groups_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_groups_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "evolution_api_config"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_instances: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          display_name: string | null
          empresa_id: string
          id: string
          instance_name: string
          last_connected_at: string | null
          phone_number: string | null
          qr_code: string | null
          status: string | null
          updated_at: string | null
          webhook_events: string[] | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          display_name?: string | null
          empresa_id: string
          id?: string
          instance_name: string
          last_connected_at?: string | null
          phone_number?: string | null
          qr_code?: string | null
          status?: string | null
          updated_at?: string | null
          webhook_events?: string[] | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          display_name?: string | null
          empresa_id?: string
          id?: string
          instance_name?: string
          last_connected_at?: string | null
          phone_number?: string | null
          qr_code?: string | null
          status?: string | null
          updated_at?: string | null
          webhook_events?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_instances_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_profiles: {
        Row: {
          auto_reply_enabled: boolean | null
          auto_reply_message: string | null
          business_category: string | null
          business_description: string | null
          business_email: string | null
          business_website: string | null
          created_at: string | null
          id: string
          instance_id: string
          privacy_groups: string | null
          privacy_last_seen: string | null
          privacy_profile_photo: string | null
          privacy_read_receipts: boolean | null
          privacy_status: string | null
          profile_name: string | null
          profile_picture_url: string | null
          profile_status: string | null
          updated_at: string | null
        }
        Insert: {
          auto_reply_enabled?: boolean | null
          auto_reply_message?: string | null
          business_category?: string | null
          business_description?: string | null
          business_email?: string | null
          business_website?: string | null
          created_at?: string | null
          id?: string
          instance_id: string
          privacy_groups?: string | null
          privacy_last_seen?: string | null
          privacy_profile_photo?: string | null
          privacy_read_receipts?: boolean | null
          privacy_status?: string | null
          profile_name?: string | null
          profile_picture_url?: string | null
          profile_status?: string | null
          updated_at?: string | null
        }
        Update: {
          auto_reply_enabled?: boolean | null
          auto_reply_message?: string | null
          business_category?: string | null
          business_description?: string | null
          business_email?: string | null
          business_website?: string | null
          created_at?: string | null
          id?: string
          instance_id?: string
          privacy_groups?: string | null
          privacy_last_seen?: string | null
          privacy_profile_photo?: string | null
          privacy_read_receipts?: boolean | null
          privacy_status?: string | null
          profile_name?: string | null
          profile_picture_url?: string | null
          profile_status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_profiles_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: true
            referencedRelation: "evolution_api_config"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      queue_monitoring: {
        Row: {
          avg_age_seconds: number | null
          avg_retries: number | null
          count: number | null
          newest_message: string | null
          oldest_message: string | null
          status: string | null
        }
        Relationships: []
      }
      usuarios: {
        Row: {
          empresa_id: string | null
          id: string | null
        }
        Insert: {
          empresa_id?: string | null
          id?: string | null
        }
        Update: {
          empresa_id?: string | null
          id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      assumir_conversa: {
        Args: { p_agente_id: string; p_conversa_id: string }
        Returns: boolean
      }
      assumir_conversa_atomico: {
        Args: { p_agente_id: string; p_conversa_id: string }
        Returns: boolean
      }
      check_user_is_super_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
      cleanup_evolution_api_logs: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_expired_cache: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_old_queue_messages: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_old_webhook_logs: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_security_logs: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_notification: {
        Args:
          | {
              data?: Json
              empresa_id?: string
              message: string
              notification_type?: string
              title: string
              user_id?: string
            }
          | {
              p_data?: Json
              p_empresa_id: string
              p_message: string
              p_title: string
              p_type?: string
              p_user_id: string
            }
        Returns: string
      }
      create_super_admin: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_super_admin_profile: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      decrement_setor_atendimentos: {
        Args: { setor_id: string }
        Returns: undefined
      }
      finalizar_atendimento: {
        Args: { p_agente_id: string; p_conversa_id: string }
        Returns: boolean
      }
      get_current_user_safe: {
        Args: Record<PropertyKey, never>
        Returns: {
          cargo: string
          email: string
          empresa_id: string
          id: string
          nome: string
          setor: string
          status: string
        }[]
      }
      get_next_queue_message: {
        Args: Record<PropertyKey, never>
        Returns: {
          correlation_id: string
          id: string
          message_type: string
          payload: Json
          retry_count: number
        }[]
      }
      get_queue_status: {
        Args: Record<PropertyKey, never>
        Returns: {
          failed_with_retries: number
          oldest_pending_age: unknown
          total_failed: number
          total_pending: number
          total_processing: number
        }[]
      }
      increment_setor_atendimentos: {
        Args: { setor_id: string }
        Returns: undefined
      }
      invoke_chatbot_queue_processor: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      obter_agentes_disponiveis: {
        Args: { p_empresa_id: string; p_setor_preferido?: string }
        Returns: {
          agente_id: string
          atendimentos_ativos: number
          cargo: string
          disponivel: boolean
          limite_atendimentos: number
          nome: string
          prioridade: number
          setor: string
        }[]
      }
      obter_atendimentos_priorizados: {
        Args: { p_agente_id: string; p_empresa_id: string }
        Returns: {
          agente_id: string
          agente_nome: string
          canal: string
          contato_id: string
          contato_nome: string
          contato_telefone: string
          created_at: string
          eh_meu_atendimento: boolean
          id: string
          prioridade: string
          setor: string
          status: string
          tags: string[]
          updated_at: string
        }[]
      }
      registrar_distribuicao_atendimento: {
        Args: {
          p_agente_anterior_id: string
          p_agente_novo_id: string
          p_conversa_id: string
          p_created_by?: string
          p_dados_agentes?: Json
          p_empresa_id: string
          p_metodo_distribuicao?: string
          p_motivo: string
          p_resultado?: string
          p_tempo_resposta_ms?: number
        }
        Returns: undefined
      }
      reset_daily_stats: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      setup_admin_user: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_connectivity_stats: {
        Args: { p_empresa_id: string; p_event_type: string; p_metadata?: Json }
        Returns: undefined
      }
      update_instance_stats: {
        Args: { p_increment?: number; p_instance_id: string; p_type: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
