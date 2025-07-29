import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import { MessageSquare } from 'lucide-react'

interface MessageNodeProps {
  data: {
    label: string
    message?: string
  }
}

export const MessageNode = memo(({ data }: MessageNodeProps) => {
  return (
    <div className="bg-background border border-border rounded-lg p-4 shadow-md min-w-[200px] max-w-[250px]">
      <div className="flex items-center gap-2 mb-2">
        <MessageSquare className="h-4 w-4 text-blue-600" />
        <span className="font-medium text-sm">Enviar Mensagem</span>
      </div>
      
      <div className="text-xs text-muted-foreground border rounded p-2 bg-muted/50">
        {data.message || 'Mensagem não configurada'}
      </div>
      
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: 'hsl(var(--primary))' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: 'hsl(var(--primary))' }}
      />
    </div>
  )
})