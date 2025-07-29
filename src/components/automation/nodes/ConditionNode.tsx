import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import { GitBranch } from 'lucide-react'

interface ConditionNodeProps {
  data: {
    label: string
    condition?: string
    value?: string
  }
}

export const ConditionNode = memo(({ data }: ConditionNodeProps) => {
  return (
    <div className="bg-background border border-border rounded-lg p-4 shadow-md min-w-[200px] max-w-[250px]">
      <div className="flex items-center gap-2 mb-2">
        <GitBranch className="h-4 w-4 text-purple-600" />
        <span className="font-medium text-sm">Condição</span>
      </div>
      
      <div className="text-xs text-muted-foreground space-y-1">
        <div className="border rounded p-2 bg-muted/50">
          Se resposta {data.condition || 'contém'}: "{data.value || 'valor'}"
        </div>
      </div>
      
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: 'hsl(var(--primary))' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="true"
        style={{ background: '#10b981', top: '70%' }}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="false"
        style={{ background: '#ef4444', top: '70%' }}
      />
      
      {/* Labels for true/false paths */}
      <div className="absolute -right-8 top-16 text-xs text-green-600 font-medium">
        Sim
      </div>
      <div className="absolute -left-8 top-16 text-xs text-red-600 font-medium">
        Não
      </div>
    </div>
  )
})