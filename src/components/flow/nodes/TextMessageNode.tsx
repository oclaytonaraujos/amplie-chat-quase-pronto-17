import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import { MessageSquare } from 'lucide-react'

export const TextMessageNode = memo(({ data, selected }: { data: any; selected?: boolean }) => {
  return (
    <div className={`bg-white border-2 ${selected ? 'border-primary' : 'border-blue-300'} rounded-lg p-4 min-w-[200px] shadow-lg`}>
      <div className="flex items-center gap-2 mb-2">
        <div className="bg-blue-500 rounded-full p-1">
          <MessageSquare className="h-3 w-3 text-white" />
        </div>
        <div className="font-semibold text-blue-800">Mensagem de Texto</div>
      </div>
      
      <div className="text-sm text-gray-600 max-w-[180px] truncate">
        {data.message || 'Clique para editar mensagem...'}
      </div>
      
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-blue-500 border-2 border-white"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-blue-500 border-2 border-white"
      />
    </div>
  )
})