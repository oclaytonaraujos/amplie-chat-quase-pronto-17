import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { ValidationIssue } from '@/hooks/useFlowValidation'
import { cn } from '@/lib/utils'

interface FlowValidationPanelProps {
  issues: ValidationIssue[]
  isValid: boolean
  errorCount: number
  warningCount: number
  infoCount: number
  onClose: () => void
  onNodeSelect?: (nodeId: string) => void
}

export function FlowValidationPanel({
  issues,
  isValid,
  errorCount,
  warningCount,
  infoCount,
  onClose,
  onNodeSelect
}: FlowValidationPanelProps) {
  const getIssueIcon = (type: ValidationIssue['type']) => {
    switch (type) {
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }
  
  const getIssueColor = (type: ValidationIssue['type']) => {
    switch (type) {
      case 'error':
        return 'border-l-red-500 bg-red-50'
      case 'warning':
        return 'border-l-yellow-500 bg-yellow-50'
      case 'info':
        return 'border-l-blue-500 bg-blue-50'
    }
  }
  
  const groupedIssues = {
    error: issues.filter(issue => issue.type === 'error'),
    warning: issues.filter(issue => issue.type === 'warning'),
    info: issues.filter(issue => issue.type === 'info')
  }
  
  return (
    <Card className="w-80 h-full border-l">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            {isValid ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-red-500" />
            )}
            Validação do Fluxo
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex gap-2">
          {errorCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {errorCount} erro{errorCount !== 1 ? 's' : ''}
            </Badge>
          )}
          {warningCount > 0 && (
            <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
              {warningCount} aviso{warningCount !== 1 ? 's' : ''}
            </Badge>
          )}
          {infoCount > 0 && (
            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
              {infoCount} info{infoCount !== 1 ? 's' : ''}
            </Badge>
          )}
          {issues.length === 0 && (
            <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
              Nenhum problema encontrado
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="p-4 space-y-4">
            {issues.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
                <p className="text-sm">
                  Seu fluxo está válido e pronto para uso!
                </p>
              </div>
            ) : (
              <>
                {groupedIssues.error.length > 0 && (
                  <div>
                    <h4 className="font-medium text-red-700 mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Erros ({groupedIssues.error.length})
                    </h4>
                    <div className="space-y-2">
                      {groupedIssues.error.map(issue => (
                        <IssueItem 
                          key={issue.id} 
                          issue={issue} 
                          onNodeSelect={onNodeSelect} 
                        />
                      ))}
                    </div>
                  </div>
                )}
                
                {groupedIssues.warning.length > 0 && (
                  <>
                    {groupedIssues.error.length > 0 && <Separator />}
                    <div>
                      <h4 className="font-medium text-yellow-700 mb-2 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Avisos ({groupedIssues.warning.length})
                      </h4>
                      <div className="space-y-2">
                        {groupedIssues.warning.map(issue => (
                          <IssueItem 
                            key={issue.id} 
                            issue={issue} 
                            onNodeSelect={onNodeSelect} 
                          />
                        ))}
                      </div>
                    </div>
                  </>
                )}
                
                {groupedIssues.info.length > 0 && (
                  <>
                    {(groupedIssues.error.length > 0 || groupedIssues.warning.length > 0) && <Separator />}
                    <div>
                      <h4 className="font-medium text-blue-700 mb-2 flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        Informações ({groupedIssues.info.length})
                      </h4>
                      <div className="space-y-2">
                        {groupedIssues.info.map(issue => (
                          <IssueItem 
                            key={issue.id} 
                            issue={issue} 
                            onNodeSelect={onNodeSelect} 
                          />
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

function IssueItem({ 
  issue, 
  onNodeSelect 
}: { 
  issue: ValidationIssue
  onNodeSelect?: (nodeId: string) => void 
}) {
  const getIssueIcon = (type: ValidationIssue['type']) => {
    switch (type) {
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }
  
  const getIssueColor = (type: ValidationIssue['type']) => {
    switch (type) {
      case 'error':
        return 'border-l-red-500 bg-red-50 hover:bg-red-100'
      case 'warning':
        return 'border-l-yellow-500 bg-yellow-50 hover:bg-yellow-100'
      case 'info':
        return 'border-l-blue-500 bg-blue-50 hover:bg-blue-100'
    }
  }
  
  return (
    <div 
      className={cn(
        'p-3 border-l-4 rounded-r-md cursor-pointer transition-colors',
        getIssueColor(issue.type),
        issue.nodeId && 'hover:shadow-sm'
      )}
      onClick={() => issue.nodeId && onNodeSelect?.(issue.nodeId)}
    >
      <div className="flex items-start gap-2">
        {getIssueIcon(issue.type)}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">
            {issue.message}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-xs">
              {issue.category}
            </Badge>
            {issue.nodeId && (
              <span className="text-xs text-muted-foreground">
                Clique para selecionar o nó
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}