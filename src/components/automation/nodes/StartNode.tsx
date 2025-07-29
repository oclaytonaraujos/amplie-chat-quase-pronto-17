import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import { Play } from 'lucide-react'

interface StartNodeProps {
  data: {
    label: string
  }
}

export const StartNode = memo(({ data }: StartNodeProps) => {
  return (
    <div className="bg-background border-2 border-primary rounded-lg p-4 shadow-md min-w-[150px]">
      <div className="flex items-center gap-2">
        <Play className="h-4 w-4 text-primary" />
        <span className="font-medium text-sm">Início</span>
      </div>
      <p className="text-xs text-muted-foreground mt-1">Ponto de partida do fluxo</p>
      
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: 'hsl(var(--primary))' }}
      />
    </div>
  )
})