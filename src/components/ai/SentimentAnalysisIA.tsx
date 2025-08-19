import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Brain, MessageSquare, TrendingUp, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { SyncLoaderInline } from '@/components/ui/sync-loader';

interface AIAssistantQuery {
  id: string;
  type: 'chat' | 'analysis' | 'summary';
  question: string;
  response: string;
  timestamp: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  confidence?: number;
}

interface SentimentResult {
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
  keywords: string[];
  summary: string;
}

export function SentimentAnalysisIA() {
  const [queries, setQueries] = useState<AIAssistantQuery[]>([]);
  const [currentQuery, setCurrentQuery] = useState('');
  const [queryType, setQueryType] = useState<'chat' | 'analysis' | 'summary'>('chat');
  const [isLoading, setIsLoading] = useState(false);
  const [sentimentResults, setSentimentResults] = useState<Record<string, SentimentResult>>({});
  const { toast } = useToast();

  const handleSubmitQuery = async () => {
    if (!currentQuery.trim()) return;

    setIsLoading(true);
    const queryId = Date.now().toString();

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const sentimentScore = Math.random();
      let sentiment: 'positive' | 'negative' | 'neutral';
      if (sentimentScore > 0.6) sentiment = 'positive';
      else if (sentimentScore < 0.4) sentiment = 'negative';
      else sentiment = 'neutral';

      let response = '';
      switch (queryType) {
        case 'chat':
          response = `Entendi sua solicitação sobre "${currentQuery}". Baseado nos dados disponíveis, posso sugerir algumas ações para melhorar o atendimento. Gostaria que eu elabore um plano detalhado?`;
          break;
        case 'analysis':
          response = `Análise completa: Identifiquei padrões interessantes nos dados relacionados a "${currentQuery}". O sentimento geral é ${sentiment} com ${Math.round(sentimentScore * 100)}% de confiança. Principais insights: melhoria na satisfação do cliente (+15%), redução no tempo de resposta (-20%).`;
          break;
        case 'summary':
          response = `Resumo executivo: ${currentQuery} - Status atual mostra tendência ${sentiment}. Principais métricas: eficiência operacional, satisfação do cliente, tempo de resolução. Recomendações: implementar melhorias no fluxo de atendimento.`;
          break;
      }

      const newQuery: AIAssistantQuery = {
        id: queryId,
        type: queryType,
        question: currentQuery,
        response,
        timestamp: new Date().toISOString(),
        sentiment,
        confidence: sentimentScore
      };

      const sentimentResult: SentimentResult = {
        sentiment,
        confidence: sentimentScore,
        keywords: ['atendimento', 'cliente', 'qualidade', 'eficiência'],
        summary: `Análise de sentimento: ${sentiment} (${Math.round(sentimentScore * 100)}% confiança)`
      };

      setQueries(prev => [newQuery, ...prev]);
      setSentimentResults(prev => ({ ...prev, [queryId]: sentimentResult }));
      setCurrentQuery('');

      toast({
        title: "Consulta processada",
        description: "AI Assistant analisou sua solicitação com sucesso"
      });

    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao processar consulta",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'negative': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'bg-green-100 text-green-800';
      case 'negative': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="w-6 h-6" />
            AI Assistant & Análise de Sentimento
          </h2>
          <p className="text-muted-foreground">
            Assistente inteligente com análise avançada de sentimento
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Nova Consulta
          </CardTitle>
          <CardDescription>
            Faça perguntas, solicite análises ou peça resumos para o AI Assistant
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            {(['chat', 'analysis', 'summary'] as const).map((type) => (
              <Button
                key={type}
                variant={queryType === type ? 'default' : 'outline'}
                size="sm"
                onClick={() => setQueryType(type)}
              >
                {type === 'chat' && 'Chat'}
                {type === 'analysis' && 'Análise'}
                {type === 'summary' && 'Resumo'}
              </Button>
            ))}
          </div>
          
          <Textarea
            value={currentQuery}
            onChange={(e) => setCurrentQuery(e.target.value)}
            placeholder={
              queryType === 'chat' 
                ? "Como posso melhorar o atendimento ao cliente?"
                : queryType === 'analysis'
                ? "Analise o desempenho das conversas da última semana"
                : "Resuma os principais problemas reportados hoje"
            }
            rows={3}
          />
          
          <Button 
            onClick={handleSubmitQuery}
            disabled={isLoading || !currentQuery.trim()}
            className="w-full"
          >
            {isLoading ? (
              <>
                <SyncLoaderInline />
                Processando...
              </>
            ) : (
              <>
                <Brain className="w-4 h-4 mr-2" />
                Enviar Consulta
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {queries.map((query) => {
          const sentiment = sentimentResults[query.id];
          return (
            <Card key={query.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{query.type}</Badge>
                      {query.sentiment && (
                        <Badge className={getSentimentColor(query.sentiment)}>
                          {getSentimentIcon(query.sentiment)}
                          {query.sentiment}
                        </Badge>
                      )}
                      {query.confidence && (
                        <Badge variant="secondary">
                          {Math.round(query.confidence * 100)}% confiança
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg">{query.question}</CardTitle>
                    <CardDescription>
                      {new Date(query.timestamp).toLocaleString('pt-BR')}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-sm">{query.response}</p>
                  </div>
                  
                  {sentiment && (
                    <div className="border-t pt-3">
                      <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Análise de Sentimento
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="font-medium">Palavras-chave: </span>
                          {sentiment.keywords.join(', ')}
                        </div>
                        <div>
                          <span className="font-medium">Confiança: </span>
                          {Math.round(sentiment.confidence * 100)}%
                        </div>
                        <div>
                          <span className="font-medium">Classificação: </span>
                          {sentiment.sentiment}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {queries.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Brain className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium text-lg mb-2">Nenhuma consulta ainda</h3>
            <p className="text-muted-foreground">
              Faça sua primeira pergunta para o AI Assistant
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}