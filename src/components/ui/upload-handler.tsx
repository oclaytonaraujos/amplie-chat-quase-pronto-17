/**
 * Componente robusto para upload de arquivos
 */
import React, { useState, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Upload, X, FileText, Image, Video, Music, AlertTriangle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface UploadHandlerProps {
  bucket: string;
  path?: string;
  maxSize?: number; // MB
  acceptedTypes?: string[];
  multiple?: boolean;
  onUploadComplete?: (files: UploadedFile[]) => void;
  onUploadError?: (error: string) => void;
}

interface UploadedFile {
  name: string;
  url: string;
  size: number;
  type: string;
  path: string;
}

interface FileStatus {
  file: File;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  progress: number;
  error?: string;
  url?: string;
}

const MIME_TYPE_ICONS = {
  'image/': Image,
  'video/': Video,
  'audio/': Music,
  'application/pdf': FileText,
  'text/': FileText,
  default: FileText
};

function getFileIcon(type: string) {
  const IconComponent = Object.entries(MIME_TYPE_ICONS).find(([mime]) => 
    type.startsWith(mime)
  )?.[1] || MIME_TYPE_ICONS.default;
  
  return IconComponent;
}

export function UploadHandler({
  bucket,
  path = '',
  maxSize = 10, // 10MB default
  acceptedTypes = [],
  multiple = false,
  onUploadComplete,
  onUploadError
}: UploadHandlerProps) {
  const [files, setFiles] = useState<FileStatus[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    // Verificar tamanho
    if (file.size > maxSize * 1024 * 1024) {
      return `Arquivo muito grande. Máximo: ${maxSize}MB`;
    }

    // Verificar tipo
    if (acceptedTypes.length > 0) {
      const isAccepted = acceptedTypes.some(type => {
        if (type.startsWith('.')) {
          return file.name.toLowerCase().endsWith(type.toLowerCase());
        }
        return file.type.match(new RegExp(type.replace('*', '.*')));
      });
      
      if (!isAccepted) {
        return `Tipo de arquivo não permitido. Aceitos: ${acceptedTypes.join(', ')}`;
      }
    }

    // Verificar nome do arquivo
    if (!/^[a-zA-Z0-9._-]+$/.test(file.name)) {
      return 'Nome do arquivo contém caracteres inválidos';
    }

    return null;
  }, [maxSize, acceptedTypes]);

  const uploadFile = async (fileStatus: FileStatus): Promise<void> => {
    const { file } = fileStatus;
    
    try {
      // Gerar nome único para evitar conflitos
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '');
      const uniqueName = `${timestamp}_${sanitizedName}`;
      const filePath = path ? `${path}/${uniqueName}` : uniqueName;

      // Atualizar status para uploading
      setFiles(prev => prev.map(f => 
        f.file === file 
          ? { ...f, status: 'uploading', progress: 0 }
          : f
      ));

      // Upload para Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw error;
      }

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      // Atualizar status para completed
      setFiles(prev => prev.map(f => 
        f.file === file 
          ? { ...f, status: 'completed', progress: 100, url: publicUrl }
          : f
      ));

      const uploadedFile: UploadedFile = {
        name: file.name,
        url: publicUrl,
        size: file.size,
        type: file.type,
        path: filePath
      };

      // Callback de sucesso
      onUploadComplete?.([uploadedFile]);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      setFiles(prev => prev.map(f => 
        f.file === file 
          ? { ...f, status: 'error', error: errorMessage }
          : f
      ));

      onUploadError?.(errorMessage);
      
      toast({
        title: 'Erro no upload',
        description: `${file.name}: ${errorMessage}`,
        variant: 'destructive'
      });
    }
  };

  const handleFiles = useCallback(async (selectedFiles: FileList) => {
    const fileArray = Array.from(selectedFiles);
    
    // Limitar quantidade se não for multiple
    const filesToProcess = multiple ? fileArray : fileArray.slice(0, 1);
    
    // Validar arquivos
    const validatedFiles: FileStatus[] = [];
    for (const file of filesToProcess) {
      const validationError = validateFile(file);
      
      if (validationError) {
        toast({
          title: 'Arquivo rejeitado',
          description: `${file.name}: ${validationError}`,
          variant: 'destructive'
        });
        continue;
      }
      
      validatedFiles.push({
        file,
        status: 'pending',
        progress: 0
      });
    }

    // Adicionar à lista
    setFiles(prev => multiple ? [...prev, ...validatedFiles] : validatedFiles);

    // Iniciar uploads
    for (const fileStatus of validatedFiles) {
      await uploadFile(fileStatus);
    }
  }, [multiple, validateFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      handleFiles(droppedFiles);
    }
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const removeFile = useCallback((fileToRemove: File) => {
    setFiles(prev => prev.filter(f => f.file !== fileToRemove));
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <Card 
        className={`border-2 border-dashed transition-colors cursor-pointer ${
          isDragging 
            ? 'border-primary bg-primary/10' 
            : 'border-muted-foreground/25 hover:border-primary/50'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Upload className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground text-center">
            {multiple 
              ? 'Arraste arquivos aqui ou clique para selecionar'
              : 'Arraste um arquivo aqui ou clique para selecionar'
            }
          </p>
          {acceptedTypes.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              Tipos aceitos: {acceptedTypes.join(', ')}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Máximo: {maxSize}MB por arquivo
          </p>
        </CardContent>
      </Card>

      {/* Input oculto */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept={acceptedTypes.join(',')}
        className="hidden"
        onChange={(e) => {
          if (e.target.files) {
            handleFiles(e.target.files);
          }
        }}
      />

      {/* Lista de arquivos */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((fileStatus, index) => {
            const IconComponent = getFileIcon(fileStatus.file.type);
            
            return (
              <Card key={index} className="p-3">
                <div className="flex items-center space-x-3">
                  <IconComponent className="h-8 w-8 text-muted-foreground" />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium truncate">
                        {fileStatus.file.name}
                      </p>
                      
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant={
                            fileStatus.status === 'completed' ? 'default' :
                            fileStatus.status === 'error' ? 'destructive' :
                            'secondary'
                          }
                        >
                          {fileStatus.status === 'pending' && 'Pendente'}
                          {fileStatus.status === 'uploading' && 'Enviando...'}
                          {fileStatus.status === 'completed' && 'Concluído'}
                          {fileStatus.status === 'error' && 'Erro'}
                        </Badge>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeFile(fileStatus.file)}
                          disabled={fileStatus.status === 'uploading'}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(fileStatus.file.size)}
                    </p>
                    
                    {fileStatus.status === 'uploading' && (
                      <Progress 
                        value={fileStatus.progress} 
                        className="mt-2 h-2"
                      />
                    )}
                    
                    {fileStatus.error && (
                      <div className="flex items-center mt-2 text-destructive">
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        <p className="text-xs">{fileStatus.error}</p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}