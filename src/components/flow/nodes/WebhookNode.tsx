import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import { Webhook } from 'lucide-react'

export const WebhookNode = memo(({ data, selected }: { data: any; selected?: boolean }) => {
  return (
    <div className={`bg-white border-2 ${selected ? 'border-primary' : 'border-rose-300'} rounded-lg p-4 min-w-[200px] shadow-lg`}>
      <div className="flex items-center gap-2 mb-2">
        <div className="bg-rose-500 rounded-full p-1">
          <Webhook className="h-3 w-3 text-white" />
        </div>
        <div className="font-semibold text-rose-800">Webhook</div>
      </div>
      
      <div className="text-sm text-gray-600 max-w-[180px]">
        <div className="font-medium truncate">
          {data.method || 'POST'} {data.url || 'Configurar URL...'}
        </div>
        <div className="text-xs mt-1 text-muted-foreground">
          Chamada para API externa
        </div>
      </div>
      
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-rose-500 border-2 border-white"
      />
      
      {/* Duas saídas: sucesso e erro */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="success"
        className="w-3 h-3 bg-green-500 border-2 border-white"
        style={{ left: '30%' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="error"
        className="w-3 h-3 bg-red-500 border-2 border-white"
        style={{ left: '70%' }}
      />
      
      {/* Legendas das saídas */}
      <div className="flex justify-between text-xs mt-2 px-1">
        <span className="text-green-600">Sucesso</span>
        <span className="text-red-600">Erro</span>
      </div>
    </div>
  )
})