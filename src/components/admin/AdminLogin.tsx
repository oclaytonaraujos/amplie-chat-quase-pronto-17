import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield, Eye, EyeOff } from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
export function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {
    adminLogin
  } = useAdminAuth();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await adminLogin(email, password);
    if (!result.success) {
      setError(result.error || 'Erro ao fazer login');
    }
    setLoading(false);
  };
  const fillAdminCredentials = () => {
    // SEGURANÇA: Remover em produção - apenas para desenvolvimento
    const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname.includes('.lovable.app');
    if (isDevelopment) {
      setEmail('ampliemarketing.mkt@gmail.com');
      setPassword('Amplie123@'); // TODO: Remover credenciais hardcoded
    } else {
      console.warn('Credenciais de desenvolvimento não disponíveis em produção');
    }
  };
  return <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-white p-3 rounded-full shadow-lg">
              <img src="/lovable-uploads/eddc7fb8-220e-433f-89b2-915fbe2e2daf.png" alt="Amplie Icon" className="h-12 w-12 object-contain" />
            </div>
          </div>
          <div className="flex justify-center mb-2">
            
          </div>
          <CardTitle className="text-2xl font-bold text-primary mt-4">
            Painel Super Admin
          </CardTitle>
          <CardDescription>
            Área restrita - Autenticação adicional necessária
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>}
            
            <div className="space-y-2">
              <Label htmlFor="admin-email">Email do Administrador</Label>
              <Input id="admin-email" type="email" placeholder="admin@exemplo.com" value={email} onChange={e => setEmail(e.target.value)} required disabled={loading} />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="admin-password">Senha</Label>
              <div className="relative">
                <Input id="admin-password" type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required disabled={loading} className="pr-10" />
                <button type="button" className="absolute inset-y-0 right-0 pr-3 flex items-center" onClick={() => setShowPassword(!showPassword)} disabled={loading}>
                  {showPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                </button>
              </div>
            </div>
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verificando...
                </> : <>
                  <Shield className="mr-2 h-4 w-4" />
                  Acessar Painel Admin
                </>}
            </Button>
          </form>
          
          {/* DESENVOLVIMENTO: Botão para preenchimento rápido */}
          {(window.location.hostname === 'localhost' || window.location.hostname.includes('.lovable.app')) && (
            <div className="mt-4 pt-4 border-t">
              <Button variant="outline" size="sm" onClick={fillAdminCredentials} className="w-full text-xs" disabled={loading}>
                🔓 Preencher credenciais (desenvolvimento)
              </Button>
              <p className="text-xs text-orange-600 mt-1 text-center">
                ⚠️ Não disponível em produção
              </p>
            </div>
          )}
          
          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground">
              ⚠️ Esta é uma área restrita para super administradores.<br />
              Todas as ações são registradas e monitoradas.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>;
}