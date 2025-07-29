
import { useUsuariosData } from './usuarios/useUsuariosData';
import { useUsuarioActions } from './usuarios/useUsuarioActions';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  setor?: string;
  cargo?: string;
  status: string;
  permissoes?: any;
  avatar_url?: string;
  empresa_id?: string;
  created_at: string;
  updated_at: string;
}

export function useUsuarios() {
  const { usuarios, setUsuarios, loading, loadUsuarios, isSuperAdmin } = useUsuariosData();
  const { criarUsuario, editarUsuario, excluirUsuario } = useUsuarioActions(setUsuarios);

  return {
    usuarios,
    loading,
    criarUsuario,
    editarUsuario,
    excluirUsuario: (id: string) => excluirUsuario(id, usuarios),
    loadUsuarios,
  };
}
