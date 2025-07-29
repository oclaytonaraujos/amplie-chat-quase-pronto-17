import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import { Bot } from 'lucide-react'

export const AIAssistantNode = memo(({ data, selected }: { data: any; selected?: boolean }) => {
  return (
    <div className={`bg-white border-2 ${selected ? 'border-primary' : 'border-indigo-300'} rounded-lg p-4 min-w-[200px] shadow-lg`}>
      <div className="flex items-center gap-2 mb-2">
        <div className="bg-indigo-500 rounded-full p-1">
          <Bot className="h-3 w-3 text-white" />
        </div>
        <div className="font-semibold text-indigo-800">IA Provisória</div>
      </div>
      
      <div className="text-sm text-gray-600 space-y-1">
        <div className="text-xs text-gray-500 max-w-[180px] truncate">
          {data.prompt || 'Assistente IA ativo'}
        </div>
        <div className="text-xs text-gray-400">
          Timeout: {data.timeout ? `${Math.floor(data.timeout / 60)}min` : '5min'}
        </div>
      </div>
      
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-indigo-500 border-2 border-white"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-indigo-500 border-2 border-white"
      />
    </div>
  )
})