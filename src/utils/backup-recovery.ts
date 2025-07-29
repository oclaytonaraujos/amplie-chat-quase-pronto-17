/**
 * Sistema de backup e recovery
 */

// Configurações de backup
export const BACKUP_CONFIG = {
  autoBackupInterval: 30 * 60 * 1000, // 30 minutos
  maxBackupFiles: 10,
  compressionEnabled: true,
  encryptionEnabled: true,
  retentionDays: 30
};

// Tipos de dados para backup
export type BackupDataType = 
  | 'user_settings'
  | 'chat_history'
  | 'templates'
  | 'automations'
  | 'contacts'
  | 'system_config';

// Interface para backup
interface BackupEntry {
  id: string;
  type: BackupDataType;
  timestamp: Date;
  size: number;
  checksum: string;
  encrypted: boolean;
  compressed: boolean;
  metadata: Record<string, any>;
}

// Interface para dados de backup
interface BackupData {
  version: string;
  timestamp: Date;
  data: Record<BackupDataType, any>;
  checksum: string;
}

class BackupRecoveryManager {
  private backupHistory: BackupEntry[] = [];
  private isBackupInProgress = false;
  private lastBackupTime: Date | null = null;

  // Criar backup completo
  async createFullBackup(): Promise<string> {
    if (this.isBackupInProgress) {
      throw new Error('Backup já em andamento');
    }

    this.isBackupInProgress = true;
    
    try {
      const backupData: BackupData = {
        version: '1.0.0',
        timestamp: new Date(),
        data: await this.collectAllData(),
        checksum: ''
      };

      // Calcular checksum
      backupData.checksum = await this.calculateChecksum(JSON.stringify(backupData.data));

      // Comprimir se habilitado
      let serializedData = JSON.stringify(backupData);
      if (BACKUP_CONFIG.compressionEnabled) {
        serializedData = await this.compressData(serializedData);
      }

      // Criptografar se habilitado
      if (BACKUP_CONFIG.encryptionEnabled) {
        serializedData = await this.encryptData(serializedData);
      }

      // Salvar backup
      const backupId = await this.saveBackup(serializedData, backupData);

      // Registrar na história
      const backupEntry: BackupEntry = {
        id: backupId,
        type: 'system_config', // Backup completo
        timestamp: backupData.timestamp,
        size: serializedData.length,
        checksum: backupData.checksum,
        encrypted: BACKUP_CONFIG.encryptionEnabled,
        compressed: BACKUP_CONFIG.compressionEnabled,
        metadata: { version: backupData.version, types: Object.keys(backupData.data) }
      };

      this.backupHistory.push(backupEntry);
      this.lastBackupTime = new Date();

      // Limpar backups antigos
      await this.cleanupOldBackups();

      return backupId;

    } finally {
      this.isBackupInProgress = false;
    }
  }

  // Criar backup incremental
  async createIncrementalBackup(types: BackupDataType[]): Promise<string> {
    const partialData: Record<string, any> = {};
    
    for (const type of types) {
      partialData[type] = await this.collectDataByType(type);
    }

    const backupData = {
      version: '1.0.0',
      timestamp: new Date(),
      data: partialData,
      checksum: await this.calculateChecksum(JSON.stringify(partialData)),
      incremental: true,
      types
    };

    return this.saveBackup(JSON.stringify(backupData), backupData);
  }

  // Coletar todos os dados
  private async collectAllData(): Promise<Record<BackupDataType, any>> {
    const data: Record<BackupDataType, any> = {
      user_settings: await this.collectUserSettings(),
      chat_history: await this.collectChatHistory(),
      templates: await this.collectTemplates(),
      automations: await this.collectAutomations(),
      contacts: await this.collectContacts(),
      system_config: await this.collectSystemConfig()
    };

    return data;
  }

  // Coletar dados por tipo
  private async collectDataByType(type: BackupDataType): Promise<any> {
    switch (type) {
      case 'user_settings':
        return this.collectUserSettings();
      case 'chat_history':
        return this.collectChatHistory();
      case 'templates':
        return this.collectTemplates();
      case 'automations':
        return this.collectAutomations();
      case 'contacts':
        return this.collectContacts();
      case 'system_config':
        return this.collectSystemConfig();
      default:
        throw new Error(`Tipo de backup não suportado: ${type}`);
    }
  }

  // Métodos de coleta específicos
  private async collectUserSettings(): Promise<any> {
    try {
      return {
        theme: localStorage.getItem('theme'),
        language: localStorage.getItem('language'),
        notifications: JSON.parse(localStorage.getItem('notificationSettings') || '{}'),
        preferences: JSON.parse(localStorage.getItem('userPreferences') || '{}')
      };
    } catch (error) {
      console.error('Erro ao coletar configurações do usuário:', error);
      return {};
    }
  }

  private async collectChatHistory(): Promise<any> {
    // TODO: Implementar coleta do histórico de chat
    return {};
  }

  private async collectTemplates(): Promise<any> {
    try {
      return JSON.parse(localStorage.getItem('messageTemplates') || '[]');
    } catch (error) {
      console.error('Erro ao coletar templates:', error);
      return [];
    }
  }

  private async collectAutomations(): Promise<any> {
    try {
      return JSON.parse(localStorage.getItem('chatbotFlows') || '[]');
    } catch (error) {
      console.error('Erro ao coletar automações:', error);
      return [];
    }
  }

  private async collectContacts(): Promise<any> {
    // TODO: Implementar coleta de contatos
    return {};
  }

  private async collectSystemConfig(): Promise<any> {
    return {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      environment: import.meta.env.MODE
    };
  }

  // Salvar backup
  private async saveBackup(data: string, metadata: any): Promise<string> {
    const backupId = `backup_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
    
    try {
      // Em produção, salvar em storage externo
      if (import.meta.env.PROD) {
        // TODO: Implementar salvamento em cloud storage
        localStorage.setItem(`backup_${backupId}`, data);
      } else {
        // Em desenvolvimento, salvar no localStorage
        localStorage.setItem(`backup_${backupId}`, data);
      }

      return backupId;
    } catch (error) {
      console.error('Erro ao salvar backup:', error);
      throw new Error('Falha ao salvar backup');
    }
  }

  // Restaurar backup
  async restoreBackup(backupId: string): Promise<void> {
    try {
      const backupData = localStorage.getItem(`backup_${backupId}`);
      if (!backupData) {
        throw new Error('Backup não encontrado');
      }

      let data = backupData;

      // Descriptografar se necessário
      if (BACKUP_CONFIG.encryptionEnabled) {
        data = await this.decryptData(data);
      }

      // Descomprimir se necessário
      if (BACKUP_CONFIG.compressionEnabled) {
        data = await this.decompressData(data);
      }

      const parsedData: BackupData = JSON.parse(data);

      // Verificar integridade
      const expectedChecksum = await this.calculateChecksum(JSON.stringify(parsedData.data));
      if (parsedData.checksum !== expectedChecksum) {
        throw new Error('Backup corrompido - checksum inválido');
      }

      // Restaurar dados
      await this.restoreData(parsedData.data);

      console.log('Backup restaurado com sucesso:', backupId);

    } catch (error) {
      console.error('Erro ao restaurar backup:', error);
      throw new Error(`Falha ao restaurar backup: ${error.message}`);
    }
  }

  // Restaurar dados
  private async restoreData(data: Record<string, any>): Promise<void> {
    for (const [type, content] of Object.entries(data)) {
      await this.restoreDataByType(type as BackupDataType, content);
    }
  }

  // Restaurar dados por tipo
  private async restoreDataByType(type: BackupDataType, content: any): Promise<void> {
    switch (type) {
      case 'user_settings':
        await this.restoreUserSettings(content);
        break;
      case 'templates':
        localStorage.setItem('messageTemplates', JSON.stringify(content));
        break;
      case 'automations':
        localStorage.setItem('chatbotFlows', JSON.stringify(content));
        break;
      // TODO: Implementar outros tipos
    }
  }

  // Restaurar configurações do usuário
  private async restoreUserSettings(settings: any): Promise<void> {
    if (settings.theme) localStorage.setItem('theme', settings.theme);
    if (settings.language) localStorage.setItem('language', settings.language);
    if (settings.notifications) localStorage.setItem('notificationSettings', JSON.stringify(settings.notifications));
    if (settings.preferences) localStorage.setItem('userPreferences', JSON.stringify(settings.preferences));
  }

  // Calcular checksum
  private async calculateChecksum(data: string): Promise<string> {
    if ('crypto' in window && 'subtle' in crypto) {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } else {
      // Fallback simples
      let hash = 0;
      for (let i = 0; i < data.length; i++) {
        const char = data.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      return hash.toString(16);
    }
  }

  // Comprimir dados
  private async compressData(data: string): Promise<string> {
    // Implementação simplificada - em produção usar pako ou similar
    return btoa(data);
  }

  // Descomprimir dados
  private async decompressData(data: string): Promise<string> {
    return atob(data);
  }

  // Criptografar dados
  private async encryptData(data: string): Promise<string> {
    // Implementação simplificada - em produção usar Web Crypto API
    return btoa(data);
  }

  // Descriptografar dados
  private async decryptData(data: string): Promise<string> {
    return atob(data);
  }

  // Limpar backups antigos
  private async cleanupOldBackups(): Promise<void> {
    // Manter apenas os últimos N backups
    if (this.backupHistory.length > BACKUP_CONFIG.maxBackupFiles) {
      const toRemove = this.backupHistory.slice(0, this.backupHistory.length - BACKUP_CONFIG.maxBackupFiles);
      
      for (const backup of toRemove) {
        localStorage.removeItem(`backup_${backup.id}`);
      }
      
      this.backupHistory = this.backupHistory.slice(-BACKUP_CONFIG.maxBackupFiles);
    }

    // Remover backups mais antigos que o período de retenção
    const cutoffDate = new Date(Date.now() - BACKUP_CONFIG.retentionDays * 24 * 60 * 60 * 1000);
    this.backupHistory = this.backupHistory.filter(backup => backup.timestamp > cutoffDate);
  }

  // Listar backups disponíveis
  getAvailableBackups(): BackupEntry[] {
    return [...this.backupHistory].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // Verificar integridade de um backup
  async verifyBackupIntegrity(backupId: string): Promise<boolean> {
    try {
      const backupData = localStorage.getItem(`backup_${backupId}`);
      if (!backupData) return false;

      // TODO: Implementar verificação completa
      return true;
    } catch (error) {
      return false;
    }
  }

  // Inicializar backup automático
  startAutoBackup(): void {
    setInterval(async () => {
      try {
        await this.createIncrementalBackup(['user_settings', 'templates']);
        console.log('Backup automático realizado');
      } catch (error) {
        console.error('Erro no backup automático:', error);
      }
    }, BACKUP_CONFIG.autoBackupInterval);
  }

  // Status do sistema de backup
  getBackupStatus(): {
    lastBackup: Date | null;
    totalBackups: number;
    totalSize: number;
    autoBackupEnabled: boolean;
  } {
    const totalSize = this.backupHistory.reduce((acc, backup) => acc + backup.size, 0);

    return {
      lastBackup: this.lastBackupTime,
      totalBackups: this.backupHistory.length,
      totalSize,
      autoBackupEnabled: true
    };
  }
}

// Singleton instance
export const backupManager = new BackupRecoveryManager();

// Inicializar backup automático
backupManager.startAutoBackup();

export default backupManager;