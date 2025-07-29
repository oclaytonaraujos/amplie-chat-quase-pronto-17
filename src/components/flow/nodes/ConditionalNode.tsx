import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import { GitBranch } from 'lucide-react'

export const ConditionalNode = memo(({ data, selected }: { data: any; selected?: boolean }) => {
  return (
    <div className={`bg-white border-2 ${selected ? 'border-primary' : 'border-yellow-300'} rounded-lg p-3 min-w-[240px] shadow-lg relative`}>
      <div className="flex items-center gap-2 mb-3">
        <div className="bg-yellow-500 rounded-full p-1">
          <GitBranch className="h-3 w-3 text-white" />
        </div>
        <div className="font-semibold text-yellow-800 text-sm">Condicional</div>
      </div>
      
      <div className="text-sm text-gray-700 mb-4 space-y-2">
        <div>
          <span className="text-xs font-medium text-gray-600">Variável:</span>
          <div className="text-xs bg-yellow-50 border border-yellow-200 rounded px-2 py-1 mt-1 font-mono">
            {data.variable || '{{ultima_resposta}}'}
          </div>
        </div>
        <div>
          <span className="text-xs font-medium text-gray-600">Condição:</span>
          <div className="text-xs bg-yellow-50 border border-yellow-200 rounded px-2 py-1 mt-1">
            {data.condition || 'contains'} "{data.value || 'sim'}"
          </div>
        </div>
      </div>
      
      {/* Caminhos com handles na lateral direita */}
      <div className="space-y-2 mb-2">
        <div className="relative flex items-center">
          <div className="flex-1 text-xs bg-green-50 border border-green-200 rounded px-3 py-2 pr-8">
            <span className="font-medium text-green-700">✓ Verdadeiro</span>
          </div>
          <Handle
            type="source"
            position={Position.Right}
            id="true"
            className="w-2 h-2 bg-green-500 border border-white !relative !transform-none !right-0 !top-0 ml-1"
          />
        </div>
        
        <div className="relative flex items-center">
          <div className="flex-1 text-xs bg-red-50 border border-red-200 rounded px-3 py-2 pr-8">
            <span className="font-medium text-red-700">✗ Falso</span>
          </div>
          <Handle
            type="source"
            position={Position.Right}
            id="false"
            className="w-2 h-2 bg-red-500 border border-white !relative !transform-none !right-0 !top-0 ml-1"
          />
        </div>
      </div>
      
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-yellow-500 border-2 border-white"
      />
    </div>
  )
})