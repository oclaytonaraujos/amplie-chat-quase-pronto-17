import { ZoomIn, ZoomOut, Maximize, RotateCcw, Save, Play, Grid, Eye, CheckCircle, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useReactFlow } from '@xyflow/react'

interface FlowValidation {
  isValid: boolean
  errorCount: number
  warningCount: number
}

interface FlowToolbarProps {
  onSave: () => void
  onTest: () => void
  isSaving?: boolean
  nodeCount: number
  edgeCount: number
  hasUnsavedChanges?: boolean
  validation?: FlowValidation
}

export function FlowToolbar({ 
  onSave, 
  onTest, 
  isSaving = false, 
  nodeCount, 
  edgeCount,
  hasUnsavedChanges = false,
  validation
}: FlowToolbarProps) {
  const { zoomIn, zoomOut, fitView } = useReactFlow()

  const handleAutoArrange = () => {
    // Esta função pode ser implementada para organizar os nós automaticamente
    // Por enquanto, apenas centraliza a visualização
    fitView({ padding: 0.2, duration: 800 })
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg p-2">
        <div className="flex items-center gap-1">
          {/* Zoom Controls */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => zoomOut()}
              className="h-8 w-8 p-0"
              title="Diminuir zoom"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => zoomIn()}
              className="h-8 w-8 p-0"
              title="Aumentar zoom"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fitView({ padding: 0.2, duration: 800 })}
              className="h-8 w-8 p-0"
              title="Ajustar à tela"
            >
              <Maximize className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Flow Actions */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAutoArrange}
              className="h-8 w-8 p-0"
              title="Organizar elementos"
            >
              <Grid className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Stats */}
          <div className="flex items-center gap-2 px-2">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-xs text-muted-foreground">{nodeCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-xs text-muted-foreground">{edgeCount}</span>
            </div>
            {validation && (
              <div className="flex items-center gap-1">
                {validation.isValid ? (
                  <CheckCircle className="w-3 h-3 text-green-500" />
                ) : (
                  <AlertTriangle className="w-3 h-3 text-red-500" />
                )}
                <span className="text-xs text-muted-foreground">
                  {validation.isValid ? 'OK' : validation.errorCount}
                </span>
              </div>
            )}
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Main Actions */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={onTest}
              disabled={nodeCount === 0 || (validation && !validation.isValid)}
              className="gap-2 h-8"
              title={validation && !validation.isValid ? 'Corrija os erros antes de testar' : 'Testar fluxo'}
            >
              <Play className="h-3 w-3" />
              <span className="text-xs">Testar</span>
            </Button>
            
            <Button
              onClick={onSave}
              disabled={isSaving}
              size="sm"
              className="gap-2 h-8 relative"
            >
              {isSaving ? (
                <>
                  <div className="w-3 h-3 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                  <span className="text-xs">Salvando...</span>
                </>
              ) : (
                <>
                  <Save className="h-3 w-3" />
                  <span className="text-xs">Salvar</span>
                  {hasUnsavedChanges && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full" />
                  )}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}