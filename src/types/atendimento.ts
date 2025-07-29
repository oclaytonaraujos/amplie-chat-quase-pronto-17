
export interface Atendimento {
  id: string; // Changed from number to string to match Supabase UUID
  cliente: string;
  telefone: string;
  ultimaMensagem: string;
  tempo: string;
  setor: string;
  agente?: string;
  tags?: string[];
  status: 'ativo' | 'em-atendimento' | 'pendente' | 'finalizado'; // Updated to match Supabase values
  transferencia?: {
    de: string;
    motivo: string;
    dataTransferencia: string;
  };
}

export interface Message {
  id: string; // Changed from number to string
  texto: string;
  anexo?: {
    tipo: 'imagem' | 'audio' | 'documento' | 'video' | 'contato';
    url?: string;
    nome?: string;
  };
  autor: 'cliente' | 'agente';
  tempo: string;
  status?: 'enviado' | 'entregue' | 'lido';
}

export interface Cliente {
  id: string; // Changed from number to string
  nome: string;
  telefone: string;
  email?: string;
  status?: 'online' | 'offline';
  ultimoAcesso?: string;
  dataCadastro?: string;
  tags?: string[];
  historico?: {
    id: string; // Changed from number to string
    data: string;
    assunto: string;
    status: string;
  }[];
}
