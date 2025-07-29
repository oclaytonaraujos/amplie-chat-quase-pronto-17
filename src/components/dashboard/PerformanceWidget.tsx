/**
 * Widget simples de performance
 */
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Activity, Zap } from 'lucide-react';

export function PerformanceWidget() {
  const [memoryUsage, setMemoryUsage] = React.useState(0);

  React.useEffect(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      setMemoryUsage(Math.round(memory.usedJSHeapSize / 1024 / 1024));
    }
  }, []);

  const applyOptimizations = () => {
    // Limpar cache básico
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          if (name.includes('old')) {
            caches.delete(name);
          }
        });
      });
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Performance
        </CardTitle>
        <CardDescription>
          Status do sistema
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Status</span>
          <Badge variant="default">Ativo</Badge>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm">Memória</span>
          <span className="text-sm font-mono">{memoryUsage}MB</span>
        </div>

        <Button 
          size="sm" 
          variant="outline" 
          onClick={applyOptimizations}
          className="w-full"
        >
          <Zap className="h-3 w-3 mr-1" />
          Otimizar Sistema
        </Button>
      </CardContent>
    </Card>
  );
}