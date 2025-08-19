import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { Link } from 'react-router-dom';

export default function TestPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const { role, loading: roleLoading, isSuperAdmin } = useUserRole();

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Carregando dados de teste...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Página de Teste - Debug</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Dados do Usuário:</h3>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify({ 
                user: user ? { id: user.id, email: user.email } : null,
                profile: profile,
                role,
                isSuperAdmin,
                authLoading,
                roleLoading
              }, null, 2)}
            </pre>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Links de Navegação:</h3>
            <div className="space-x-2">
              <Link to="/painel">
                <Button variant="outline">Painel</Button>
              </Link>
              <Link to="/admin">
                <Button variant="outline">Admin</Button>
              </Link>
              <Link to="/dashboard">
                <Button variant="outline">Dashboard</Button>
              </Link>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Status do Sistema:</h3>
            <ul className="space-y-1 text-sm">
              <li>✅ AuthContext carregado: {!authLoading ? 'Sim' : 'Não'}</li>
              <li>✅ Usuário logado: {user ? 'Sim' : 'Não'}</li>
              <li>✅ Perfil carregado: {profile ? 'Sim' : 'Não'}</li>
              <li>✅ Role determinado: {role ? 'Sim' : 'Não'}</li>
              <li>✅ É super admin: {isSuperAdmin ? 'Sim' : 'Não'}</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}