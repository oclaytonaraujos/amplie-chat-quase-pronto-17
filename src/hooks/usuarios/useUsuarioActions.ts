
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { Usuario } from '@/hooks/useUsuarios';

interface NovoUsuario {
  nome: string;
  email: string;
  senha: string;
  setor: string;
  cargo: string;
  status: string;
  permissoes: string[];
}

export function useUsuarioActions(setUsuarios: React.Dispatch<React.SetStateAction<Usuario[]>>) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { isSuperAdmin } = useUserRole();

  const criarUsuario = async (usuario: NovoUsuario) => {
    try {
      console.log('Criando usuário:', usuario);
      
      let empresaId;
      
      if (isSuperAdmin && 'empresa_id' in usuario) {
        // Super admin pode especificar a empresa
        empresaId = (usuario as any).empresa_id;
      } else {
        // Usuário normal - usar sua própria empresa
        const { data: currentProfile } = await supabase
          .from('profiles')
          .select('empresa_id')
          .eq('id', user?.id)
          .single();

        if (!currentProfile?.empresa_id) {
          toast({
            title: "Erro",
            description: "Usuário não está associado a uma empresa.",
            variant: "destructive",
          });
          return null;
        }
        empresaId = currentProfile.empresa_id;
      }

      // Tentar criar o usuário no Supabase Auth usando signUp
      console.log('Criando usuário no Supabase Auth...');
      
      // Usar signUp para criar o usuário
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: usuario.email,
        password: usuario.senha,
        options: {
          data: {
            nome: usuario.nome,
            empresa_id: empresaId,
            cargo: usuario.cargo,
            setor: usuario.setor,
            status: usuario.status,
            permissoes: usuario.permissoes
          }
        }
      });

      if (authError) {
        console.error('Erro ao criar usuário no Auth:', authError);
        
        if (authError.message.includes('already registered') || authError.message.includes('User already registered')) {
          toast({
            title: "Erro ao criar usuário",
            description: "Este email já está cadastrado no sistema.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Erro ao criar usuário",
            description: authError.message,
            variant: "destructive",
          });
        }
        return null;
      }

      console.log('Usuário criado no Auth:', authData.user?.id);

      if (!authData.user) {
        toast({
          title: "Erro",
          description: "Falha ao criar usuário no sistema de autenticação.",
          variant: "destructive",
        });
        return null;
      }

      // Criar o perfil do usuário
      console.log('Criando perfil do usuário...');
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          nome: usuario.nome,
          email: usuario.email,
          empresa_id: empresaId,
          cargo: usuario.cargo,
          setor: usuario.setor,
          status: usuario.status,
          permissoes: usuario.permissoes
        })
        .select()
        .single();

      if (profileError) {
        console.error('Erro ao criar perfil:', profileError);
        
        // Se falhou ao criar o perfil, o usuário ainda existe no auth
        // Não vamos deletar pois pode ser usado depois
        toast({
          title: "Usuário criado parcialmente",
          description: "Usuário criado no sistema de autenticação, mas houve erro ao criar o perfil. Entre em contato com o administrador.",
          variant: "destructive",
        });
        return null;
      }

      console.log('Usuário e perfil criados com sucesso:', profileData);
      setUsuarios(prev => [profileData, ...prev]);
      toast({
        title: "Usuário criado com sucesso",
        description: `${usuario.nome} foi adicionado e pode fazer login com email: ${usuario.email}`,
      });
      return profileData;
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao criar usuário",
        variant: "destructive",
      });
      return null;
    }
  };

  const editarUsuario = async (usuario: Usuario & { novaSenha?: string }) => {
    try {
      console.log('Editando usuário:', usuario);
      
      const { data, error } = await supabase
        .from('profiles')
        .update({
          nome: usuario.nome,
          email: usuario.email,
          setor: usuario.setor,
          cargo: usuario.cargo,
          status: usuario.status,
          permissoes: usuario.permissoes,
          avatar_url: usuario.avatar_url,
        })
        .eq('id', usuario.id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao editar usuário:', error);
        toast({
          title: "Erro ao editar usuário",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }

      console.log('Usuário editado com sucesso:', data);
      setUsuarios(prev => prev.map(u => u.id === usuario.id ? data : u));
      
      let toastMessage = `As informações de ${usuario.nome} foram atualizadas.`;
      if (usuario.novaSenha && usuario.novaSenha.trim() !== '') {
        toastMessage += ` Nova senha: ${usuario.novaSenha}`;
      }
      
      toast({
        title: "Usuário atualizado",
        description: toastMessage,
      });
      return true;
    } catch (error) {
      console.error('Erro ao editar usuário:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao editar usuário",
        variant: "destructive",
      });
      return false;
    }
  };

  const excluirUsuario = async (id: string, usuarios: Usuario[]) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);

      if (error) {
        toast({
          title: "Erro ao excluir usuário",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }

      const usuario = usuarios.find(u => u.id === id);
      setUsuarios(prev => prev.filter(u => u.id !== id));
      toast({
        title: "Usuário excluído",
        description: `${usuario?.nome} foi removido do sistema.`,
        variant: "destructive"
      });
      return true;
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      return false;
    }
  };

  return {
    criarUsuario,
    editarUsuario,
    excluirUsuario
  };
}
