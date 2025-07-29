
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Trash2, RefreshCw, Search, User, Clock } from 'lucide-react';
import type { Json } from '@/integrations/supabase/types';

interface ChatbotState {
  id: string;
  contact_phone: string;
  current_stage: string;
  context: Json;
  created_at: string;
  updated_at: string;
}

export function ChatbotStateManager() {
  const [states, setStates] = useState<ChatbotState[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchPhone, setSearchPhone] = useState('');
  const { toast } = useToast();

  const loadStates = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('chatbot_state')
        .select('*')
        .order('updated_at', { ascending: false });

      if (searchPhone.trim()) {
        query = query.ilike('contact_phone', `%${searchPhone.trim()}%`);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      setStates(data || []);
    } catch (error) {
      console.error('Erro ao carregar estados:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os estados do chatbot",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteState = async (id: string, phone: string) => {
    try {
      const { error } = await supabase
        .from('chatbot_state')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      toast({
        title: "Estado removido",
        description: `Estado do chatbot para ${phone} foi removido`,
      });

      loadStates();
    } catch (error) {
      console.error('Erro ao remover estado:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o estado",
        variant: "destructive",
      });
    }
  };

  const clearOldStates = async () => {
    try {
      // Remover estados com mais de 24 horas de inatividade
      const oneDayAgo = new Date();
      oneDayAgo.setHours(oneDayAgo.getHours() - 24);

      const { error } = await supabase
        .from('chatbot_state')
        .delete()
        .lt('updated_at', oneDayAgo.toISOString());

      if (error) {
        throw error;
      }

      toast({
        title: "Limpeza concluída",
        description: "Estados antigos foram removidos",
      });

      loadStates();
    } catch (error) {
      console.error('Erro na limpeza:', error);
      toast({
        title: "Erro",
        description: "Não foi possível limpar estados antigos",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadStates();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'start':
        return 'bg-blue-100 text-blue-800';
      case 'awaiting_option':
        return 'bg-yellow-100 text-yellow-800';
      case 'collecting_name_products':
      case 'collecting_name_support':
        return 'bg-purple-100 text-purple-800';
      case 'collecting_product_interest':
      case 'collecting_support_issue':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getContextValue = (context: Json, key: string): string => {
    if (!context || typeof context !== 'object' || context === null) {
      return 'Não informado';
    }
    
    const contextObj = context as Record<string, any>;
    return contextObj[key] || 'Não informado';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Gerenciador de Estados do Chatbot
        </CardTitle>
        <CardDescription>
          Visualize e gerencie os estados ativos das conversas do chatbot
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-1">
            <Label htmlFor="search-phone">Buscar por telefone:</Label>
            <Input
              id="search-phone"
              placeholder="Digite o número..."
              value={searchPhone}
              onChange={(e) => setSearchPhone(e.target.value)}
              className="max-w-xs"
            />
            <Button onClick={loadStates} variant="outline" size="sm">
              <Search className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={loadStates} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
            <Button onClick={clearOldStates} variant="outline" size="sm">
              <Clock className="w-4 h-4 mr-2" />
              Limpar Antigos
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Carregando estados...</p>
            </div>
          ) : states.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Nenhum estado ativo encontrado</p>
            </div>
          ) : (
            states.map((state) => (
              <div
                key={state.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-medium">{state.contact_phone}</span>
                    <Badge className={getStageColor(state.current_stage)}>
                      {state.current_stage}
                    </Badge>
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>
                      <strong>Nome:</strong> {getContextValue(state.context, 'name')}
                    </p>
                    <p>
                      <strong>Criado:</strong> {formatDate(state.created_at)}
                    </p>
                    <p>
                      <strong>Atualizado:</strong> {formatDate(state.updated_at)}
                    </p>
                    {getContextValue(state.context, 'product_interest') !== 'Não informado' && (
                      <p>
                        <strong>Interesse:</strong> {getContextValue(state.context, 'product_interest')}
                      </p>
                    )}
                    {getContextValue(state.context, 'support_issue') !== 'Não informado' && (
                      <p>
                        <strong>Problema:</strong> {getContextValue(state.context, 'support_issue')}
                      </p>
                    )}
                  </div>
                </div>
                
                <Button
                  onClick={() => deleteState(state.id, state.contact_phone)}
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
