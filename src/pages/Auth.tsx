
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Eye, EyeOff } from 'lucide-react';

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user, loading, signIn } = useAuth();

  // Redirecionar se já estiver autenticado
  useEffect(() => {
    if (!loading && user) {
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [user, loading, navigate, location]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn(email, password);

      if (result.success) {
        toast({
          title: "Login realizado",
          description: "Redirecionando para o dashboard...",
        });

        const from = location.state?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      } else {
        if (result.error?.includes('Invalid login credentials')) {
          toast({
            title: "Credenciais inválidas",
            description: "Email ou senha incorretos.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Erro no login",
            description: result.error || "Erro desconhecido",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro durante o login.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuperAdminLogin = async () => {
    setIsLoading(true);
    try {
      const result = await signIn('ampliemarketing.mkt@gmail.com', '123456');
      
      if (result.success) {
        toast({
          title: "Login Super Admin realizado",
          description: "Redirecionando para o painel...",
        });
        
        navigate('/dashboard', { replace: true });
      } else {
        toast({
          title: "Erro no login",
          description: result.error || "Erro desconhecido",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro durante o login.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Senhas não coincidem",
        description: "Por favor, verifique se as senhas são iguais.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Senha muito fraca",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/dashboard`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            nome: name,
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        toast({
          title: "Conta criada com sucesso!",
          description: "Você foi logado automaticamente. Redirecionando...",
        });

        // Aguardar um momento para o trigger criar o perfil
        setTimeout(() => {
          const from = location.state?.from?.pathname || '/dashboard';
          navigate(from, { replace: true });
        }, 1500);
      }
    } catch (error: any) {
      if (error.message?.includes('User already registered')) {
        toast({
          title: "Email já cadastrado",
          description: "Este email já possui uma conta. Tente fazer login.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro no cadastro",
          description: error.message || "Erro desconhecido",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fillSuperAdminCredentials = () => {
    // SEGURANÇA: Remover em produção - apenas para desenvolvimento
    const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname.includes('.lovable.app');
    if (isDevelopment) {
      setEmail('ampliemarketing.mkt@gmail.com');
      setPassword('Amplie123@'); // TODO: Remover credenciais hardcoded
    } else {
      console.warn('Credenciais de desenvolvimento não disponíveis em produção');
    }
  };

  const createSuperAdmin = async () => {
    setIsLoading(true);
    try {
      const response = await supabase.functions.invoke('create-super-admin', {
        body: {
          email: 'ampliemarketing.mkt@gmail.com',
          password: 'Amplie123@' // TODO: Usar variáveis de ambiente
        }
      });

      if (response.error) {
        throw response.error;
      }

      const result = response.data;
      
      if (result.success) {
        toast({
          title: "Super admin configurado",
          description: result.message,
        });
        
        // Preencher credenciais automaticamente
        fillSuperAdminCredentials();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({
        title: "Erro ao criar super admin",
        description: error.message || "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-white p-3 rounded-full shadow-lg">
              <img 
                src="/lovable-uploads/eddc7fb8-220e-433f-89b2-915fbe2e2daf.png" 
                alt="Amplie Icon" 
                className="h-12 w-12 object-contain"
              />
            </div>
          </div>
          <div className="flex justify-center mb-2">
            <img 
              src="/lovable-uploads/8ed7aa80-8a43-4375-a757-0f7dd486297f.png" 
              alt="Amplie Chat Logo" 
              className="h-8 object-contain"
            />
          </div>
          <CardDescription>
            {isSignUp ? 'Crie sua conta para começar' : 'Faça login para acessar a plataforma'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-4">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="name">Nome completo</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Seu nome completo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={isSignUp ? "Mínimo 6 caracteres" : ""}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar senha</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirme sua senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            )}
            
            <Button type="submit" className="w-full" disabled={isLoading || loading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isSignUp ? 'Criando conta...' : 'Entrando...'}
                </>
              ) : (
                isSignUp ? 'Criar conta' : 'Entrar'
              )}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setEmail('');
                setPassword('');
                setConfirmPassword('');
                setName('');
              }}
              className="text-sm text-blue-600 hover:text-blue-500 underline"
            >
              {isSignUp ? 'Já tem uma conta? Faça login' : 'Não tem conta? Cadastre-se'}
            </button>
          </div>

          {!isSignUp && (window.location.hostname === 'localhost' || window.location.hostname.includes('.lovable.app')) && (
            <div className="mt-4 text-center space-y-2 p-3 bg-orange-50 border border-orange-200 rounded">
              <p className="text-xs text-orange-700 font-medium">🔧 Ferramentas de Desenvolvimento</p>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={fillSuperAdminCredentials}
                  className="text-xs text-gray-600 hover:text-gray-700 underline block w-full"
                  disabled={isLoading}
                >
                  Preencher credenciais de super admin
                </button>
                
                 <button
                   type="button"
                   onClick={async () => {
                     setEmail('ampliemarketing.mkt@gmail.com');
                     setPassword('123456');
                     await handleSignIn({ preventDefault: () => {} } as any);
                   }}
                   className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 block w-full"
                   disabled={isLoading}
                 >
                   {isLoading ? 'Entrando...' : 'Login Automático Super Admin'}
                 </button>
              </div>
              
              <p className="text-xs text-orange-600 mt-2">
                ⚠️ Estas opções são removidas automaticamente em produção
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
