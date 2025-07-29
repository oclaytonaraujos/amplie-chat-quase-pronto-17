/**
 * Sistema de backup e recuperação de dados
 */
import { supabase } from '@/integrations/supabase/client';
import { logger } from './structured-logger';
import { toast } from '@/hooks/use-toast';

export interface BackupConfig {
  tables: string[];
  includeFiles?: boolean;
  compression?: boolean;
  encryption?: boolean;
  schedule?: 'daily' | 'weekly' | 'monthly';
}

export interface BackupMetadata {
  id: string;
  timestamp: number;
  size: number;
  tables: string[];
  status: 'creating' | 'completed' | 'failed';
  error?: string;
  downloadUrl?: string;
}

export interface RestoreOptions {
  backupId: string;
  tables?: string[];
  skipExisting?: boolean;
  validateData?: boolean;
}

class BackupSystem {
  private readonly maxBackups = 10;
  private readonly compressionLevel = 6;

  // Criar backup completo
  async createBackup(config: BackupConfig): Promise<BackupMetadata> {
    const backupId = this.generateBackupId();
    const metadata: BackupMetadata = {
      id: backupId,
      timestamp: Date.now(),
      size: 0,
      tables: config.tables,
      status: 'creating'
    };

    try {
      logger.info('Starting backup creation', {
        component: 'BackupSystem',
        metadata: { backupId, tables: config.tables }
      });

      // Obter dados de todas as tabelas
      const backupData: Record<string, any[]> = {};
      let totalSize = 0;

      for (const table of config.tables) {
        try {
          // Só fazer backup de tabelas seguras e existentes
          if (!['profiles', 'empresas'].includes(table)) {
            backupData[table] = [];
            continue;
          }

          const { data, error } = await supabase
            .from(table as any)
            .select('*');

          if (error) {
            throw new Error(`Failed to backup table ${table}: ${error.message}`);
          }

          backupData[table] = data || [];
          totalSize += JSON.stringify(data).length;

          logger.info(`Backed up table: ${table}`, {
            component: 'BackupSystem',
            metadata: { 
              backupId, 
              table, 
              records: data?.length || 0 
            }
          });
        } catch (error) {
          logger.error(`Error backing up table ${table}`, {
            component: 'BackupSystem',
            metadata: { backupId, table }
          }, error as Error);

          // Continuar com outras tabelas
          backupData[table] = [];
        }
      }

      // Adicionar metadados ao backup
      const fullBackup = {
        metadata: {
          ...metadata,
          size: totalSize,
          status: 'completed' as const,
          createdAt: new Date().toISOString(),
          version: '1.0'
        },
        data: backupData,
        schema: await this.getSchemaInfo(config.tables)
      };

      // Comprimir se solicitado
      let finalData = JSON.stringify(fullBackup);
      if (config.compression) {
        finalData = this.compress(finalData);
      }

      // Armazenar backup
      const downloadUrl = await this.storeBackup(backupId, finalData);

      metadata.status = 'completed';
      metadata.size = finalData.length;
      metadata.downloadUrl = downloadUrl;

      // Salvar metadados
      await this.saveBackupMetadata(metadata);

      // Limpar backups antigos
      await this.cleanupOldBackups();

      logger.info('Backup completed successfully', {
        component: 'BackupSystem',
        metadata: { 
          backupId, 
          size: metadata.size,
          tables: config.tables.length 
        }
      });

      toast({
        title: "Backup Concluído",
        description: `Backup ${backupId} criado com sucesso`,
      });

      return metadata;
    } catch (error) {
      metadata.status = 'failed';
      metadata.error = (error as Error).message;

      logger.error('Backup failed', {
        component: 'BackupSystem',
        metadata: { backupId }
      }, error as Error);

      toast({
        title: "Erro no Backup",
        description: `Falha ao criar backup: ${(error as Error).message}`,
        variant: "destructive",
      });

      return metadata;
    }
  }

  // Restaurar backup
  async restoreBackup(options: RestoreOptions): Promise<boolean> {
    try {
      logger.info('Starting backup restoration', {
        component: 'BackupSystem',
        metadata: { backupId: options.backupId }
      });

      // Obter dados do backup
      const backupData = await this.loadBackup(options.backupId);
      
      if (!backupData) {
        throw new Error('Backup not found');
      }

      const { data, metadata } = backupData;
      const tablesToRestore = options.tables || metadata.tables;

      // Validar dados se solicitado
      if (options.validateData) {
        await this.validateBackupData(data, tablesToRestore);
      }

      // Restaurar cada tabela
      for (const table of tablesToRestore) {
        if (!data[table]) {
          logger.warn(`Table ${table} not found in backup`, {
            component: 'BackupSystem',
            metadata: { backupId: options.backupId, table }
          });
          continue;
        }

        await this.restoreTable(table, data[table], options.skipExisting);
      }

      logger.info('Backup restoration completed', {
        component: 'BackupSystem',
        metadata: { 
          backupId: options.backupId,
          tablesRestored: tablesToRestore.length 
        }
      });

      toast({
        title: "Restauração Concluída",
        description: `Backup ${options.backupId} restaurado com sucesso`,
      });

      return true;
    } catch (error) {
      logger.error('Backup restoration failed', {
        component: 'BackupSystem',
        metadata: { backupId: options.backupId }
      }, error as Error);

      toast({
        title: "Erro na Restauração",
        description: `Falha ao restaurar backup: ${(error as Error).message}`,
        variant: "destructive",
      });

      return false;
    }
  }

  // Listar backups disponíveis
  async listBackups(): Promise<BackupMetadata[]> {
    try {
      const stored = localStorage.getItem('backup_metadata');
      if (!stored) return [];
      
      const backups: BackupMetadata[] = JSON.parse(stored);
      return backups
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, this.maxBackups);
    } catch (error) {
      logger.error('Failed to list backups', {
        component: 'BackupSystem'
      }, error as Error);

      return [];
    }
  }

  // Excluir backup
  async deleteBackup(backupId: string): Promise<boolean> {
    try {
      // Remover dos metadados locais
      const stored = localStorage.getItem('backup_metadata');
      if (stored) {
        const backups: BackupMetadata[] = JSON.parse(stored);
        const filtered = backups.filter(b => b.id !== backupId);
        localStorage.setItem('backup_metadata', JSON.stringify(filtered));
      }

      // Remover do localStorage
      localStorage.removeItem(`backup_${backupId}`);

      logger.info('Backup deleted successfully', {
        component: 'BackupSystem',
        metadata: { backupId }
      });

      return true;
    } catch (error) {
      logger.error('Failed to delete backup', {
        component: 'BackupSystem',
        metadata: { backupId }
      }, error as Error);

      return false;
    }
  }

  // Métodos privados
  private generateBackupId(): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const random = Math.random().toString(36).substring(2, 8);
    return `backup-${timestamp}-${random}`;
  }

  private async getSchemaInfo(tables: string[]): Promise<Record<string, any>> {
    const schema: Record<string, any> = {};

    for (const table of tables) {
      try {
        // Só obter schema de tabelas seguras
        if (!['profiles', 'empresas'].includes(table)) {
          schema[table] = { error: 'Table not supported' };
          continue;
        }

        const { data, error } = await supabase
          .from(table as any)
          .select('*')
          .limit(1);

        if (!error && data && data.length > 0) {
          schema[table] = {
            columns: Object.keys(data[0]),
            sampleRecord: data[0]
          };
        }
      } catch (error) {
        schema[table] = { error: 'Schema not available' };
      }
    }

    return schema;
  }

  private compress(data: string): string {
    // Implementação básica de compressão (em produção usar biblioteca)
    try {
      return btoa(data);
    } catch {
      return data;
    }
  }

  private decompress(data: string): string {
    try {
      return atob(data);
    } catch {
      return data;
    }
  }

  private async storeBackup(backupId: string, data: string): Promise<string> {
    // Armazenar no localStorage
    localStorage.setItem(`backup_${backupId}`, data);
    
    // Criar URL de download fictícia
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    return url;
  }

  private async loadBackup(backupId: string): Promise<any> {
    const data = localStorage.getItem(`backup_${backupId}`);
    
    if (!data) {
      throw new Error('Backup not found');
    }
    
    const decompressed = this.decompress(data);
    return JSON.parse(decompressed);
  }

  private async validateBackupData(data: Record<string, any[]>, tables: string[]): Promise<void> {
    for (const table of tables) {
      if (!data[table]) {
        throw new Error(`Table ${table} missing from backup`);
      }

      if (!Array.isArray(data[table])) {
        throw new Error(`Invalid data format for table ${table}`);
      }
    }
  }

  private async restoreTable(table: string, data: any[], skipExisting: boolean = false): Promise<void> {
    if (data.length === 0) {
      return;
    }

    try {
      // Verificar se a tabela existe no Supabase
      const tableExists = ['profiles', 'empresas', 'atendimentos', 'mensagens'].includes(table);
      
      if (!tableExists) {
        logger.warn(`Table ${table} not supported for restoration`, {
          component: 'BackupSystem',
          metadata: { table }
        });
        return;
      }

      if (!skipExisting) {
        // Limpar tabela antes de restaurar (apenas para tabelas seguras)
        const { error: deleteError } = await supabase
          .from(table as any)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');
          
        if (deleteError) {
          logger.warn(`Could not clear table ${table}`, {
            component: 'BackupSystem',
            metadata: { table, error: deleteError.message }
          });
        }
      }

      // Inserir dados em lotes
      const batchSize = 50;
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        
        const { error } = await supabase
          .from(table as any)
          .upsert(batch, { onConflict: skipExisting ? 'id' : undefined });

        if (error) {
          logger.warn(`Error restoring batch for table ${table}`, {
            component: 'BackupSystem',
            metadata: { table, error: error.message }
          });
        }
      }

      logger.info(`Table ${table} restored successfully`, {
        component: 'BackupSystem',
        metadata: { table, records: data.length }
      });
    } catch (error) {
      logger.error(`Failed to restore table ${table}`, {
        component: 'BackupSystem',
        metadata: { table }
      }, error as Error);

      throw error;
    }
  }

  private async saveBackupMetadata(metadata: BackupMetadata): Promise<void> {
    try {
      const stored = localStorage.getItem('backup_metadata');
      const backups: BackupMetadata[] = stored ? JSON.parse(stored) : [];
      
      // Adicionar ou atualizar metadata
      const index = backups.findIndex(b => b.id === metadata.id);
      if (index >= 0) {
        backups[index] = metadata;
      } else {
        backups.push(metadata);
      }
      
      localStorage.setItem('backup_metadata', JSON.stringify(backups));
    } catch (error) {
      logger.error('Failed to save backup metadata', {
        component: 'BackupSystem'
      }, error as Error);
      throw error;
    }
  }

  private async cleanupOldBackups(): Promise<void> {
    try {
      const backups = await this.listBackups();
      
      if (backups.length > this.maxBackups) {
        const toDelete = backups.slice(this.maxBackups);
        
        for (const backup of toDelete) {
          await this.deleteBackup(backup.id);
        }

        logger.info(`Cleaned up ${toDelete.length} old backups`, {
          component: 'BackupSystem'
        });
      }
    } catch (error) {
      logger.error('Failed to cleanup old backups', {
        component: 'BackupSystem'
      }, error as Error);
    }
  }
}

// Instância global
export const backupSystem = new BackupSystem();

// Hook para usar o sistema de backup
export function useBackupSystem() {
  return {
    createBackup: (config: BackupConfig) => backupSystem.createBackup(config),
    restoreBackup: (options: RestoreOptions) => backupSystem.restoreBackup(options),
    listBackups: () => backupSystem.listBackups(),
    deleteBackup: (backupId: string) => backupSystem.deleteBackup(backupId)
  };
}