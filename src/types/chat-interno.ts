export interface Usuario {
  id: string;
  nome: string;
  email: string;
  avatar_url?: string;
  status: string;
  cargo?: string;
  setor?: string;
}

// Interfaces simplificadas para componentes - usando UUIDs diretamente
export interface Conversa {
  id: string;
  tipo: 'individual' | 'grupo';
  nome: string;
  participantes: Usuario[];
  ultimaMensagem?: {
    texto: string;
    autor: string;
    tempo: string;
  };
  mensagensNaoLidas: number;
  avatar?: string;
}

export interface Mensagem {
  id: string;
  texto: string;
  autor: {
    id: string;
    nome: string;
    email: string;
    status: 'online' | 'offline' | 'ausente';
    cargo: string;
  };
  tempo: string;
  tipo: 'texto' | 'imagem' | 'documento' | 'audio';
  anexo?: {
    nome: string;
    url: string;
    tamanho?: string;
  };
}

export interface ConversaInterna {
  id: string;
  tipo: string;
  nome?: string;
  participante_1_id: string;
  participante_2_id: string;
  empresa_id: string;
  created_at: string | null;
  updated_at: string | null;
  participante?: Usuario;
  ultimaMensagem?: {
    conteudo: string;
    remetente_nome: string;
    created_at: string;
  };
  mensagensNaoLidas: number;
}

export interface MensagemInterna {
  id: string;
  conteudo: string;
  conversa_interna_id: string;
  remetente_id: string;
  tipo_mensagem: string | null;
  lida: boolean | null;
  created_at: string | null;
  remetente?: Usuario;
}