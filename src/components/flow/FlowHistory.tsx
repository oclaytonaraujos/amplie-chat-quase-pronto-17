import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  History, 
  RotateCcw, 
  RotateCw, 
  Eye, 
  Save, 
  User, 
  Clock,
  GitBranch,
  CheckCircle2,
  X
} from 'lucide-react';
import { Node, Edge } from '@xyflow/react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface FlowVersion {
  id: string;
  timestamp: Date;
  author: {
    name: string;
    email: string;
    avatar?: string;
  };
  description?: string;
  changes: {
    type: 'node_added' | 'node_removed' | 'node_modified' | 'edge_added' | 'edge_removed' | 'flow_renamed';
    details: string;
    nodeId?: string;
  }[];
  nodes: Node[];
  edges: Edge[];
  flowName: string;
  isCurrent?: boolean;
  isAutoSave?: boolean;
}

interface FlowHistoryProps {
  versions: FlowVersion[];
  currentVersion: FlowVersion;
  isOpen: boolean;
  onClose: () => void;
  onRestore: (version: FlowVersion) => void;
  onPreview: (version: FlowVersion) => void;
  onCreateSavePoint: (description: string) => void;
  maxUndoSteps: number;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

export function FlowHistory({
  versions,
  currentVersion,
  isOpen,
  onClose,
  onRestore,
  onPreview,
  onCreateSavePoint,
  maxUndoSteps,
  canUndo,
  canRedo,
  onUndo,
  onRedo
}: FlowHistoryProps) {
  const [previewVersion, setPreviewVersion] = useState<FlowVersion | null>(null);
  const [savePointDescription, setSavePointDescription] = useState('');
  const [showSavePointDialog, setShowSavePointDialog] = useState(false);

  const sortedVersions = versions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  const handleCreateSavePoint = useCallback(() => {
    if (savePointDescription.trim()) {
      onCreateSavePoint(savePointDescription.trim());
      setSavePointDescription('');
      setShowSavePointDialog(false);
    }
  }, [savePointDescription, onCreateSavePoint]);

  const getChangeIcon = (changeType: FlowVersion['changes'][0]['type']) => {
    switch (changeType) {
      case 'node_added': return <CheckCircle2 className="h-3 w-3 text-green-600" />;
      case 'node_removed': return <X className="h-3 w-3 text-red-600" />;
      case 'node_modified': return <GitBranch className="h-3 w-3 text-blue-600" />;
      case 'edge_added': return <CheckCircle2 className="h-3 w-3 text-green-600" />;
      case 'edge_removed': return <X className="h-3 w-3 text-red-600" />;
      case 'flow_renamed': return <GitBranch className="h-3 w-3 text-purple-600" />;
      default: return <GitBranch className="h-3 w-3 text-gray-600" />;
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Histórico de Versões
                </CardTitle>
                <CardDescription>
                  Visualize, compare e restaure versões anteriores do fluxo
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {/* Controles de Undo/Redo */}
                <div className="flex items-center gap-1 border rounded-lg p-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onUndo}
                    disabled={!canUndo}
                    title="Desfazer (Ctrl+Z)"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <Separator orientation="vertical" className="h-6" />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onRedo}
                    disabled={!canRedo}
                    title="Refazer (Ctrl+Y)"
                  >
                    <RotateCw className="h-4 w-4" />
                  </Button>
                </div>

                <Button
                  size="sm"
                  onClick={() => setShowSavePointDialog(true)}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  Criar Ponto de Salvamento
                </Button>

                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <GitBranch className="h-4 w-4" />
                {versions.length} versões
              </div>
              <div className="flex items-center gap-1">
                <RotateCcw className="h-4 w-4" />
                {maxUndoSteps} passos de desfazer
              </div>
            </div>
          </CardHeader>

          <CardContent className="overflow-y-auto max-h-[calc(90vh-200px)]">
            <div className="space-y-4">
              {sortedVersions.map((version, index) => {
                const isFirst = index === 0;
                const timeDiff = formatDistanceToNow(version.timestamp, { 
                  addSuffix: true, 
                  locale: ptBR 
                });

                return (
                  <div key={version.id}>
                    <Card className={`${version.isCurrent ? 'ring-2 ring-primary' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            {/* Avatar e informações do autor */}
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>
                                {version.author.name.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>

                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-sm">
                                  {version.author.name}
                                </span>
                                {version.isCurrent && (
                                  <Badge variant="default" className="text-xs">
                                    Atual
                                  </Badge>
                                )}
                                {version.isAutoSave && (
                                  <Badge variant="secondary" className="text-xs">
                                    Auto-salvo
                                  </Badge>
                                )}
                              </div>

                              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                                <Clock className="h-3 w-3" />
                                {timeDiff}
                                <span>•</span>
                                <span>{version.nodes.length} nós</span>
                                <span>•</span>
                                <span>{version.edges.length} conexões</span>
                              </div>

                              {version.description && (
                                <p className="text-sm text-muted-foreground mb-2">
                                  {version.description}
                                </p>
                              )}

                              {/* Lista de mudanças */}
                              {version.changes.length > 0 && (
                                <div className="space-y-1">
                                  {version.changes.slice(0, 3).map((change, changeIndex) => (
                                    <div key={changeIndex} className="flex items-center gap-2 text-xs">
                                      {getChangeIcon(change.type)}
                                      <span className="text-muted-foreground">
                                        {change.details}
                                      </span>
                                    </div>
                                  ))}
                                  {version.changes.length > 3 && (
                                    <div className="text-xs text-muted-foreground">
                                      +{version.changes.length - 3} outras alterações
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Ações */}
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setPreviewVersion(version);
                                onPreview(version);
                              }}
                              title="Visualizar esta versão"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>

                            {!version.isCurrent && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onRestore(version)}
                                title="Restaurar esta versão"
                              >
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {!isFirst && (
                      <div className="flex justify-center py-2">
                        <div className="w-px h-4 bg-border"></div>
                      </div>
                    )}
                  </div>
                );
              })}

              {versions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma versão salva ainda</p>
                  <p className="text-sm">
                    As versões serão criadas automaticamente conforme você edita o fluxo
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog para criar ponto de salvamento */}
      <Dialog open={showSavePointDialog} onOpenChange={setShowSavePointDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Ponto de Salvamento</DialogTitle>
            <DialogDescription>
              Adicione uma descrição para marcar esta versão do fluxo como um ponto importante.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label htmlFor="description" className="text-sm font-medium">
                Descrição (opcional)
              </label>
              <textarea
                id="description"
                value={savePointDescription}
                onChange={(e) => setSavePointDescription(e.target.value)}
                placeholder="Ex: Versão inicial do atendimento, Adicionado fluxo de vendas..."
                className="w-full mt-1 p-2 border rounded-md resize-none"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowSavePointDialog(false)}
              >
                Cancelar
              </Button>
              <Button onClick={handleCreateSavePoint}>
                Criar Ponto de Salvamento
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}