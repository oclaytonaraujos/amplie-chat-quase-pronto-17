import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import { Keyboard } from 'lucide-react'

export const UserInputNode = memo(({ data, selected }: { data: any; selected?: boolean }) => {
  return (
    <div className={`bg-white border-2 ${selected ? 'border-primary' : 'border-green-300'} rounded-lg p-4 min-w-[200px] shadow-lg`}>
      <div className="flex items-center gap-2 mb-2">
        <div className="bg-green-500 rounded-full p-1">
          <Keyboard className="h-3 w-3 text-white" />
        </div>
        <div className="font-semibold text-green-800">Entrada do Usuário</div>
      </div>
      
      <div className="text-sm text-gray-600 max-w-[180px]">
        <div className="font-medium mb-1">Tipo: {data.inputType || 'texto'}</div>
        <div className="text-xs truncate">
          {data.prompt || 'Digite sua resposta...'}
        </div>
      </div>
      
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-green-500 border-2 border-white"
      />
      
      {/* Duas saídas: válido e inválido */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="valid"
        className="w-3 h-3 bg-green-500 border-2 border-white"
        style={{ left: '30%' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="invalid"
        className="w-3 h-3 bg-red-500 border-2 border-white"
        style={{ left: '70%' }}
      />
      
      <div className="flex justify-between text-xs mt-2 px-1">
        <span className="text-green-600">Válido</span>
        <span className="text-red-600">Inválido</span>
      </div>
    </div>
  )
})