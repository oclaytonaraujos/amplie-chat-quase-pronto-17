import React, { useMemo } from 'react';
import { Node, Edge } from '@xyflow/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Users,
  MessageSquare,
  ArrowRight,
  Eye,
  Target
} from 'lucide-react';

interface FlowAnalyticsProps {
  nodes: Node[];
  edges: Edge[];
  flowData?: {
    totalExecutions: number;
    completionRate: number;
    averageTime: number;
    exitPoints: { nodeId: string; count: number; percentage: number }[];
    popularPaths: { path: string[]; count: number; percentage: number }[];
    nodeMetrics: { nodeId: string; visits: number; exitRate: number; avgTime: number }[];
  };
  isOpen: boolean;
  onClose: () => void;
  onNodeFocus: (nodeId: string) => void;
}

interface FlowMetrics {
  totalNodes: number;
  totalEdges: number;
  averageConnectionsPerNode: number;
  maxDepth: number;
  disconnectedNodes: number;
  cyclomaticComplexity: number;
  estimatedCompletionTime: number;
}

export function FlowAnalytics({ 
  nodes, 
  edges, 
  flowData, 
  isOpen, 
  onClose, 
  onNodeFocus 
}: FlowAnalyticsProps) {
  const metrics = useMemo(() => calculateFlowMetrics(nodes, edges), [nodes, edges]);
  const suggestions = useMemo(() => generateOptimizationSuggestions(nodes, edges, metrics), [nodes, edges, metrics]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <BarChart3 className="h-6 w-6" />
                Analytics do Fluxo
              </h2>
              <p className="text-muted-foreground">
                Análise detalhada e sugestões de otimização
              </p>
            </div>
            <Button variant="ghost" onClick={onClose}>
              ×
            </Button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid gap-6">
            {/* Métricas Gerais */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Total de Nós"
                value={metrics.totalNodes}
                icon={<MessageSquare className="h-4 w-4" />}
                color="blue"
              />
              <MetricCard
                title="Conexões"
                value={metrics.totalEdges}
                icon={<ArrowRight className="h-4 w-4" />}
                color="green"
              />
              <MetricCard
                title="Profundidade Máxima"
                value={metrics.maxDepth}
                subtitle="níveis"
                icon={<TrendingUp className="h-4 w-4" />}
                color="purple"
              />
              <MetricCard
                title="Tempo Estimado"
                value={Math.round(metrics.estimatedCompletionTime)}
                subtitle="segundos"
                icon={<Clock className="h-4 w-4" />}
                color="orange"
              />
            </div>

            {/* Métricas de Produção (se disponível) */}
            {flowData && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Dados de Produção
                  </CardTitle>
                  <CardDescription>
                    Métricas baseadas em execuções reais do fluxo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">
                        {flowData.totalExecutions.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">Execuções Totais</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">
                        {flowData.completionRate.toFixed(1)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Taxa de Conclusão</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-orange-600">
                        {Math.round(flowData.averageTime)}s
                      </div>
                      <div className="text-sm text-muted-foreground">Tempo Médio</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Principais Pontos de Saída</h4>
                      <div className="space-y-2">
                        {flowData.exitPoints.slice(0, 5).map((exit, index) => {
                          const node = nodes.find(n => n.id === exit.nodeId);
                          return (
                            <div key={exit.nodeId} className="flex items-center justify-between p-2 bg-muted rounded">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-mono">
                                  {String(node?.data?.label || node?.type || exit.nodeId)}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onNodeFocus(exit.nodeId)}
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">
                                  {exit.count} saídas
                                </span>
                                <Badge variant="secondary">
                                  {exit.percentage.toFixed(1)}%
                                </Badge>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Análise de Complexidade */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Análise de Complexidade
                </CardTitle>
                <CardDescription>
                  Avaliação da estrutura e complexidade do fluxo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Complexidade Ciclomática</span>
                    <div className="flex items-center gap-2">
                      <Progress value={Math.min(metrics.cyclomaticComplexity / 20 * 100, 100)} className="w-24" />
                      <Badge variant={metrics.cyclomaticComplexity > 10 ? "destructive" : "secondary"}>
                        {metrics.cyclomaticComplexity}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span>Conectividade Média</span>
                    <div className="flex items-center gap-2">
                      <Progress value={Math.min(metrics.averageConnectionsPerNode / 5 * 100, 100)} className="w-24" />
                      <Badge variant="secondary">
                        {metrics.averageConnectionsPerNode.toFixed(1)}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span>Nós Desconectados</span>
                    <Badge variant={metrics.disconnectedNodes > 0 ? "destructive" : "secondary"}>
                      {metrics.disconnectedNodes}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sugestões de Otimização */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Sugestões de Otimização
                </CardTitle>
                <CardDescription>
                  Recomendações baseadas na análise do fluxo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border-l-4 ${
                        suggestion.priority === 'high'
                          ? 'border-red-500 bg-red-50 dark:bg-red-950/20'
                          : suggestion.priority === 'medium'
                          ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20'
                          : 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          {suggestion.priority === 'high' ? (
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 text-blue-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm">{suggestion.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {suggestion.description}
                          </p>
                          {suggestion.impact && (
                            <div className="mt-2">
                              <Badge variant="outline" className="text-xs">
                                Impacto: {suggestion.impact}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'purple' | 'orange';
}

function MetricCard({ title, value, subtitle, icon, color }: MetricCardProps) {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-100 dark:bg-blue-950/20',
    green: 'text-green-600 bg-green-100 dark:bg-green-950/20',
    purple: 'text-purple-600 bg-purple-100 dark:bg-purple-950/20',
    orange: 'text-orange-600 bg-orange-100 dark:bg-orange-950/20',
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">
              {value}
              {subtitle && <span className="text-sm font-normal text-muted-foreground ml-1">{subtitle}</span>}
            </p>
          </div>
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <div>{icon}</div>
        </div>
        </div>
      </CardContent>
    </Card>
  );
}

function calculateFlowMetrics(nodes: Node[], edges: Edge[]): FlowMetrics {
  const totalNodes = nodes.length;
  const totalEdges = edges.length;
  
  // Calcular conectividade média
  const nodeConnections = nodes.map(node => {
    const incomingEdges = edges.filter(edge => edge.target === node.id).length;
    const outgoingEdges = edges.filter(edge => edge.source === node.id).length;
    return incomingEdges + outgoingEdges;
  });
  
  const averageConnectionsPerNode = totalNodes > 0 
    ? nodeConnections.reduce((sum, connections) => sum + connections, 0) / totalNodes 
    : 0;

  // Calcular profundidade máxima
  const maxDepth = calculateMaxDepth(nodes, edges);
  
  // Contar nós desconectados
  const connectedNodeIds = new Set<string>();
  edges.forEach(edge => {
    connectedNodeIds.add(edge.source);
    connectedNodeIds.add(edge.target);
  });
  const disconnectedNodes = nodes.filter(node => 
    node.id !== 'start' && !connectedNodeIds.has(node.id)
  ).length;

  // Complexidade ciclomática simplificada (E - N + 2P)
  // E = arestas, N = nós, P = componentes conectados
  const connectedComponents = calculateConnectedComponents(nodes, edges);
  const cyclomaticComplexity = Math.max(1, totalEdges - totalNodes + 2 * connectedComponents);

  // Tempo estimado de conclusão
  const estimatedCompletionTime = estimateCompletionTime(nodes, edges);

  return {
    totalNodes,
    totalEdges,
    averageConnectionsPerNode,
    maxDepth,
    disconnectedNodes,
    cyclomaticComplexity,
    estimatedCompletionTime
  };
}

function calculateMaxDepth(nodes: Node[], edges: Edge[]): number {
  const startNode = nodes.find(node => node.type === 'start');
  if (!startNode) return 0;

  const visited = new Set<string>();
  const queue: { nodeId: string; depth: number }[] = [{ nodeId: startNode.id, depth: 0 }];
  let maxDepth = 0;

  while (queue.length > 0) {
    const { nodeId, depth } = queue.shift()!;
    
    if (visited.has(nodeId)) continue;
    visited.add(nodeId);
    
    maxDepth = Math.max(maxDepth, depth);
    
    const outgoingEdges = edges.filter(edge => edge.source === nodeId);
    outgoingEdges.forEach(edge => {
      if (!visited.has(edge.target)) {
        queue.push({ nodeId: edge.target, depth: depth + 1 });
      }
    });
  }

  return maxDepth;
}

function calculateConnectedComponents(nodes: Node[], edges: Edge[]): number {
  const visited = new Set<string>();
  let components = 0;

  nodes.forEach(node => {
    if (!visited.has(node.id)) {
      components++;
      const stack = [node.id];
      
      while (stack.length > 0) {
        const currentId = stack.pop()!;
        if (visited.has(currentId)) continue;
        
        visited.add(currentId);
        
        const connectedEdges = edges.filter(edge => 
          edge.source === currentId || edge.target === currentId
        );
        
        connectedEdges.forEach(edge => {
          const nextId = edge.source === currentId ? edge.target : edge.source;
          if (!visited.has(nextId)) {
            stack.push(nextId);
          }
        });
      }
    }
  });

  return components;
}

function estimateCompletionTime(nodes: Node[], edges: Edge[]): number {
  // Tempo base por tipo de nó (em segundos)
  const nodeTimings = {
    textMessage: 3,
    buttonMessage: 5,
    listMessage: 7,
    conditional: 1,
    transfer: 10,
    aiAssistant: 15,
    delay: 2,
    webhook: 3,
    userInput: 10,
    location: 8,
    contact: 5,
    poll: 8,
    template: 4,
    start: 0
  };

  // Calcular tempo médio baseado nos tipos de nós
  const totalTime = nodes.reduce((sum, node) => {
    const nodeType = node.type as keyof typeof nodeTimings;
    return sum + (nodeTimings[nodeType] || 5);
  }, 0);

  return totalTime;
}

interface OptimizationSuggestion {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  impact?: string;
}

function generateOptimizationSuggestions(
  nodes: Node[], 
  edges: Edge[], 
  metrics: FlowMetrics
): OptimizationSuggestion[] {
  const suggestions: OptimizationSuggestion[] = [];

  // Verificar nós desconectados
  if (metrics.disconnectedNodes > 0) {
    suggestions.push({
      title: 'Nós Desconectados Detectados',
      description: `Existem ${metrics.disconnectedNodes} nó(s) sem conexões. Conecte-os ao fluxo ou remova-os.`,
      priority: 'high',
      impact: 'Funcionalidade'
    });
  }

  // Complexidade muito alta
  if (metrics.cyclomaticComplexity > 15) {
    suggestions.push({
      title: 'Complexidade Muito Alta',
      description: 'O fluxo está muito complexo. Considere dividir em subfluxos menores.',
      priority: 'high',
      impact: 'Manutenibilidade'
    });
  }

  // Profundidade excessiva
  if (metrics.maxDepth > 10) {
    suggestions.push({
      title: 'Fluxo Muito Profundo',
      description: 'Fluxos muito longos podem confundir usuários. Considere criar atalhos.',
      priority: 'medium',
      impact: 'Experiência do Usuário'
    });
  }

  // Baixa conectividade
  if (metrics.averageConnectionsPerNode < 1.5) {
    suggestions.push({
      title: 'Baixa Conectividade',
      description: 'Muitos nós têm poucas conexões. Verifique se o fluxo está completo.',
      priority: 'medium',
      impact: 'Robustez'
    });
  }

  // Tempo estimado muito longo
  if (metrics.estimatedCompletionTime > 120) {
    suggestions.push({
      title: 'Tempo de Conclusão Longo',
      description: 'O tempo estimado é alto. Considere otimizar mensagens e remover passos desnecessários.',
      priority: 'medium',
      impact: 'Eficiência'
    });
  }

  // Sugestões positivas
  if (suggestions.length === 0) {
    suggestions.push({
      title: 'Fluxo Bem Estruturado',
      description: 'Seu fluxo está bem organizado e dentro dos parâmetros recomendados.',
      priority: 'low',
      impact: 'Qualidade'
    });
  }

  return suggestions;
}