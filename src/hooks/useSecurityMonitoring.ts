/**
 * Hook para monitoramento de segurança
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { securityManager, SecurityThreat } from '@/utils/security-manager';
import { backupManager } from '@/utils/backup-recovery';
import { toast } from '@/hooks/use-toast';

interface SecurityStatus {
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  activeThreats: number;
  blockedAttempts: number;
  lastSecurityCheck: Date | null;
  backupStatus: 'healthy' | 'warning' | 'error';
}

interface SecurityAlert {
  id: string;
  type: SecurityThreat;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  acknowledged: boolean;
}

export const useSecurityMonitoring = () => {
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus>({
    threatLevel: 'low',
    activeThreats: 0,
    blockedAttempts: 0,
    lastSecurityCheck: null,
    backupStatus: 'healthy'
  });

  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const monitoringInterval = useRef<NodeJS.Timeout | null>(null);

  // Inicializar monitoramento
  const startMonitoring = useCallback(() => {
    if (isMonitoring) return;

    setIsMonitoring(true);
    
    // Verificação inicial
    performSecurityCheck();

    // Monitoramento contínuo
    monitoringInterval.current = setInterval(() => {
      performSecurityCheck();
    }, 30000); // A cada 30 segundos

  }, [isMonitoring]);

  // Parar monitoramento
  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
    
    if (monitoringInterval.current) {
      clearInterval(monitoringInterval.current);
      monitoringInterval.current = null;
    }
  }, []);

  // Realizar verificação de segurança
  const performSecurityCheck = useCallback(() => {
    try {
      const report = securityManager.getSecurityReport();
      const backupStatus = backupManager.getBackupStatus();

      // Calcular nível de ameaça
      const threatLevel = calculateThreatLevel(report);

      // Atualizar status
      setSecurityStatus({
        threatLevel,
        activeThreats: report.totalThreats,
        blockedAttempts: report.blockedIPs,
        lastSecurityCheck: new Date(),
        backupStatus: getBackupHealthStatus(backupStatus)
      });

      // Processar alertas recentes
      processSecurityAlerts(report.recentActivity);

    } catch (error) {
      console.error('Erro na verificação de segurança:', error);
      
      setSecurityStatus(prev => ({
        ...prev,
        threatLevel: 'critical',
        lastSecurityCheck: new Date()
      }));
    }
  }, []);

  // Calcular nível de ameaça
  const calculateThreatLevel = (report: any): 'low' | 'medium' | 'high' | 'critical' => {
    const criticalThreats = Object.entries(report.threatsByType).filter(
      ([_, count]) => (count as number) > 0
    ).length;

    const blockedIPs = report.blockedIPs || 0;

    if (blockedIPs > 10 || criticalThreats > 5) return 'critical';
    if (blockedIPs > 5 || criticalThreats > 3) return 'high';
    if (blockedIPs > 0 || criticalThreats > 0) return 'medium';
    return 'low';
  };

  // Obter status de saúde do backup
  const getBackupHealthStatus = (backupStatus: any): 'healthy' | 'warning' | 'error' => {
    if (!backupStatus.lastBackup) return 'error';
    
    const timeSinceLastBackup = Date.now() - backupStatus.lastBackup.getTime();
    const oneHour = 60 * 60 * 1000;
    
    if (timeSinceLastBackup > oneHour * 2) return 'error';
    if (timeSinceLastBackup > oneHour) return 'warning';
    return 'healthy';
  };

  // Processar alertas de segurança
  const processSecurityAlerts = (recentActivity: any[]) => {
    const newAlerts: SecurityAlert[] = recentActivity.map(activity => ({
      id: activity.id || crypto.randomUUID(),
      type: activity.threat,
      severity: activity.severity,
      message: generateAlertMessage(activity),
      timestamp: new Date(activity.timestamp),
      acknowledged: false
    }));

    setAlerts(prev => {
      const existingIds = new Set(prev.map(alert => alert.id));
      const uniqueNewAlerts = newAlerts.filter(alert => !existingIds.has(alert.id));
      
      return [...prev, ...uniqueNewAlerts].slice(-50); // Manter apenas 50 alertas
    });

    // Mostrar toast para alertas críticos
    newAlerts.forEach(alert => {
      if (alert.severity === 'critical' || alert.severity === 'high') {
        toast({
          title: `Alerta de Segurança: ${alert.type}`,
          description: alert.message,
          variant: 'destructive',
          duration: 0 // Persistir até ser fechado manualmente
        });
      }
    });
  };

  // Gerar mensagem do alerta
  const generateAlertMessage = (activity: any): string => {
    switch (activity.threat) {
      case 'brute_force':
        return `Tentativa de força bruta detectada de ${activity.ip}`;
      case 'rate_limit_exceeded':
        return `Limite de requisições excedido por ${activity.ip}`;
      case 'suspicious_activity':
        return `Atividade suspeita detectada: ${activity.details?.action || 'Desconhecida'}`;
      case 'xss_attempt':
        return 'Tentativa de ataque XSS detectada';
      case 'csrf_attempt':
        return 'Tentativa de ataque CSRF detectada';
      case 'unauthorized_access':
        return 'Tentativa de acesso não autorizado';
      default:
        return `Ameaça de segurança detectada: ${activity.threat}`;
    }
  };

  // Reconhecer alerta
  const acknowledgeAlert = useCallback((alertId: string) => {
    setAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, acknowledged: true }
          : alert
      )
    );
  }, []);

  // Limpar alertas antigos
  const clearOldAlerts = useCallback(() => {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 horas
    setAlerts(prev => prev.filter(alert => alert.timestamp > cutoff));
  }, []);

  // Forçar backup de emergência
  const emergencyBackup = useCallback(async () => {
    try {
      toast({
        title: 'Iniciando backup de emergência...',
        description: 'Aguarde enquanto criamos um backup de segurança'
      });

      const backupId = await backupManager.createFullBackup();
      
      toast({
        title: 'Backup de emergência concluído',
        description: `Backup ${backupId} criado com sucesso`
      });

      return backupId;
    } catch (error) {
      console.error('Erro no backup de emergência:', error);
      
      toast({
        title: 'Erro no backup de emergência',
        description: 'Falha ao criar backup de segurança',
        variant: 'destructive'
      });
      
      throw error;
    }
  }, []);

  // Bloquear IP manualmente
  const blockIP = useCallback((ip: string, reason: string) => {
    securityManager.logSecurityEvent({
      threat: 'unauthorized_access',
      severity: 'high',
      ip,
      details: { reason, manual_block: true }
    });

    toast({
      title: 'IP bloqueado',
      description: `Endereço ${ip} foi bloqueado por: ${reason}`
    });
  }, []);

  // Obter estatísticas detalhadas
  const getDetailedStats = useCallback(() => {
    const securityReport = securityManager.getSecurityReport();
    const backupStatus = backupManager.getBackupStatus();

    return {
      security: securityReport,
      backup: backupStatus,
      alerts: {
        total: alerts.length,
        unacknowledged: alerts.filter(a => !a.acknowledged).length,
        bySeverity: alerts.reduce((acc, alert) => {
          acc[alert.severity] = (acc[alert.severity] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      }
    };
  }, [alerts]);

  // Validar senha
  const validatePassword = useCallback((password: string) => {
    return securityManager.validatePasswordStrength(password);
  }, []);

  // Sanitizar input
  const sanitizeInput = useCallback((input: string) => {
    return securityManager.sanitizeInput(input);
  }, []);

  // Efeitos
  useEffect(() => {
    startMonitoring();
    
    // Cleanup automático de alertas
    const cleanupInterval = setInterval(clearOldAlerts, 60 * 60 * 1000); // 1 hora

    return () => {
      stopMonitoring();
      clearInterval(cleanupInterval);
    };
  }, [startMonitoring, stopMonitoring, clearOldAlerts]);

  return {
    // Estado
    securityStatus,
    alerts: alerts.filter(alert => !alert.acknowledged),
    allAlerts: alerts,
    isMonitoring,

    // Ações
    startMonitoring,
    stopMonitoring,
    performSecurityCheck,
    acknowledgeAlert,
    clearOldAlerts,
    emergencyBackup,
    blockIP,

    // Utilitários
    getDetailedStats,
    validatePassword,
    sanitizeInput,

    // Status helpers
    isThreatLevelHigh: securityStatus.threatLevel === 'high' || securityStatus.threatLevel === 'critical',
    hasUnacknowledgedAlerts: alerts.some(alert => !alert.acknowledged),
    isBackupHealthy: securityStatus.backupStatus === 'healthy'
  };
};

export default useSecurityMonitoring;