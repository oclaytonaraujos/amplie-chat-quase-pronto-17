
import { Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/layout/Layout";
import ConfiguracoesGerais from "@/pages/configuracoes/ConfiguracoesGerais";
import ConfiguracoesAvancadas from "@/pages/configuracoes/ConfiguracoesAvancadas";
import PreferenciasNotificacao from "@/pages/configuracoes/PreferenciasNotificacao";
import Aparencia from "@/pages/configuracoes/Aparencia";
import Idioma from "@/pages/configuracoes/Idioma";

export function ConfigurationRoutes() {
  return (
    <>
      <Route path="/configuracoes/gerais" element={
        <ProtectedRoute>
          <Layout title="Configurações Gerais" description="Configurações do sistema">
            <ConfiguracoesGerais />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/configuracoes/avancadas" element={
        <ProtectedRoute>
          <Layout title="Configurações Avançadas" description="Configurações técnicas">
            <ConfiguracoesAvancadas />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/configuracoes/notificacoes" element={
        <ProtectedRoute>
          <Layout title="Notificações" description="Preferências de notificação">
            <PreferenciasNotificacao />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/configuracoes/aparencia" element={
        <ProtectedRoute>
          <Layout title="Aparência" description="Personalização visual">
            <Aparencia />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/configuracoes/idioma" element={
        <ProtectedRoute>
          <Layout title="Idioma" description="Configurações de idioma">
            <Idioma />
          </Layout>
        </ProtectedRoute>
      } />
    </>
  );
}
