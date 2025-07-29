import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import { Play } from 'lucide-react'

export const StartNode = memo(({ data }: { data: any }) => {
  return (
    <div className="bg-gradient-to-br from-green-100 to-green-200 border-2 border-green-300 rounded-lg p-4 min-w-[150px] shadow-lg">
      <div className="flex items-center gap-2">
        <div className="bg-green-500 rounded-full p-2">
          <Play className="h-4 w-4 text-white fill-white" />
        </div>
        <div>
          <div className="font-semibold text-green-800">Início</div>
          <div className="text-xs text-green-600">Ponto de partida do fluxo</div>
        </div>
      </div>
      
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-green-500 border-2 border-white"
      />
    </div>
  )
})