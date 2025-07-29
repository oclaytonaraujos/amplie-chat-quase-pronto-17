import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle, Clock, Activity, Database, Cpu, MemoryStick } from 'lucide-react';
import { useSystemMonitoring } from '@/hooks/useSystemMonitoring';

export function SystemMonitoringDashboard() {
  const { 
    alerts, 
    metrics, 
    isMonitoring, 
    resolveAlert, 
    clearResolvedAlerts 
  } = useSystemMonitoring();

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getMetricStatus = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return 'good';
    if (value <= thresholds.warning) return 'warning';
    return 'critical';
  };

  const unresolvedAlerts = alerts.filter(alert => !alert.resolved);
  const criticalAlerts = unresolvedAlerts.filter(alert => alert.severity === 'critical');

  return (
    <div className="space-y-6">
      {/* Status Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isMonitoring ? 'bg-green-500' : 'bg-red-500'}`} />
          <h2 className="text-2xl font-bold">System Monitoring</h2>
          <Badge variant={isMonitoring ? 'default' : 'destructive'}>
            {isMonitoring ? 'Active' : 'Inactive'}
          </Badge>
        </div>
        
        {unresolvedAlerts.length > 0 && (
          <Button onClick={clearResolvedAlerts} variant="outline" size="sm">
            Clear Resolved ({alerts.filter(a => a.resolved).length})
          </Button>
        )}
      </div>

      {/* Alerts Summary */}
      {unresolvedAlerts.length > 0 && (
        <Card className="border-red-200 bg-red-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              Active Alerts ({unresolvedAlerts.length})
              {criticalAlerts.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {criticalAlerts.length} Critical
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {unresolvedAlerts.slice(0, 5).map(alert => (
              <div key={alert.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={getSeverityColor(alert.severity)}>
                      {alert.severity}
                    </Badge>
                    <span className="font-medium">{alert.message}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </p>
                </div>
                <Button 
                  onClick={() => resolveAlert(alert.id)}
                  variant="ghost" 
                  size="sm"
                  className="text-green-600 hover:text-green-700"
                >
                  <CheckCircle className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {unresolvedAlerts.length > 5 && (
              <p className="text-sm text-muted-foreground text-center pt-2">
                And {unresolvedAlerts.length - 5} more alerts...
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* System Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Response Time */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4" />
                Response Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-2">
                {Math.round(metrics.responseTime)}ms
              </div>
              <Progress 
                value={Math.min((metrics.responseTime / 5000) * 100, 100)} 
                className="h-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Target: &lt;2000ms
              </p>
            </CardContent>
          </Card>

          {/* Error Rate */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <AlertTriangle className="h-4 w-4" />
                Error Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-2">
                {metrics.errorRate.toFixed(1)}%
              </div>
              <Progress 
                value={Math.min((metrics.errorRate / 20) * 100, 100)} 
                className="h-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Target: &lt;5%
              </p>
            </CardContent>
          </Card>

          {/* Active Users */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Activity className="h-4 w-4" />
                Active Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-2">
                {metrics.activeUsers}
              </div>
              <p className="text-xs text-muted-foreground">
                Currently online
              </p>
            </CardContent>
          </Card>

          {/* Memory Usage */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <MemoryStick className="h-4 w-4" />
                Memory Usage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-2">
                {Math.round(metrics.memoryUsage)}MB
              </div>
              <Progress 
                value={Math.min((metrics.memoryUsage / 300) * 100, 100)} 
                className="h-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Warning: &gt;100MB
              </p>
            </CardContent>
          </Card>

          {/* CPU Usage */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Cpu className="h-4 w-4" />
                CPU Usage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-2">
                {metrics.cpuUsage.toFixed(1)}%
              </div>
              <Progress 
                value={metrics.cpuUsage} 
                className="h-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Warning: &gt;80%
              </p>
            </CardContent>
          </Card>

          {/* DB Connections */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Database className="h-4 w-4" />
                DB Connections
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-2">
                {metrics.dbConnections}
              </div>
              <p className="text-xs text-muted-foreground">
                Active connections
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Status Messages */}
      {!isMonitoring && (
        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-yellow-700">
              <AlertTriangle className="h-5 w-5" />
              <span>System monitoring is currently inactive</span>
            </div>
          </CardContent>
        </Card>
      )}

      {unresolvedAlerts.length === 0 && isMonitoring && (
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-5 w-5" />
              <span>All systems operational - No active alerts</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}