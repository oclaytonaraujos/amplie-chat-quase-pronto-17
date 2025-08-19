
import { Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/layout/Layout";
import Dashboard from "@/pages/Dashboard";
import Atendimento from "@/pages/Atendimento";
import ChatInterno from "@/pages/ChatInterno";
import Contatos from "@/pages/Contatos";
import Kanban from "@/pages/Kanban";
import ChatBot from "@/pages/ChatBot";
import Usuarios from "@/pages/Usuarios";
import Setores from "@/pages/Setores";
import GerenciarEquipe from "@/pages/GerenciarEquipe";
import MeuPerfil from "@/pages/MeuPerfil";
import PlanoFaturamento from "@/pages/PlanoFaturamento";
import Painel from "@/pages/Painel";

export function ProtectedRoutes() {
  return (
    <>
      <Route path="/painel" element={
        <ProtectedRoute>
          <Layout title="Painel" description="Visão geral do sistema">
            <Painel />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Layout title="Dashboard" description="Métricas e estatísticas">
            <Dashboard />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/atendimento" element={
        <ProtectedRoute>
          <Layout title="Atendimento" description="Central de atendimento">
            <Atendimento />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/chat-interno" element={
        <ProtectedRoute>
          <Layout title="Chat Interno" description="Comunicação da equipe">
            <ChatInterno />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/contatos" element={
        <ProtectedRoute>
          <Layout title="Contatos" description="Gerenciamento de contatos">
            <Contatos />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/kanban" element={
        <ProtectedRoute>
          <Layout title="Kanban" description="Quadro de tarefas">
            <Kanban />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/chatbot" element={
        <ProtectedRoute>
          <Layout title="ChatBot" description="Automação inteligente">
            <ChatBot />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/usuarios" element={
        <ProtectedRoute>
          <Layout title="Usuários" description="Gerenciamento de usuários">
            <Usuarios />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/setores" element={
        <ProtectedRoute>
          <Layout title="Setores" description="Organização por setores">
            <Setores />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/gerenciar-equipe" element={
        <ProtectedRoute>
          <Layout title="Gerenciar Equipe" description="Administração da equipe">
            <GerenciarEquipe />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/meu-perfil" element={
        <ProtectedRoute>
          <Layout title="Meu Perfil" description="Configurações pessoais">
            <MeuPerfil />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/plano-faturamento" element={
        <ProtectedRoute>
          <Layout title="Plano e Faturamento" description="Gerenciamento financeiro">
            <PlanoFaturamento />
          </Layout>
        </ProtectedRoute>
      } />
      
    </>
  );
}
