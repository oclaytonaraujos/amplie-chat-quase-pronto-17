
export interface Usuario {
  id: number;
  nome: string;
  email: string;
  avatar?: string;
  status: 'online' | 'offline' | 'ausente';
  cargo: string;
}

export interface Conversa {
  id: number;
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
  id: number;
  texto: string;
  autor: Usuario;
  tempo: string;
  tipo: 'texto' | 'imagem' | 'documento' | 'audio';
  anexo?: {
    nome: string;
    url: string;
    tamanho?: string;
  };
}
