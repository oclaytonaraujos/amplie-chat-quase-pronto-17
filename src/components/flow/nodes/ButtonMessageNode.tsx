import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import { Square } from 'lucide-react'

export const ButtonMessageNode = memo(({ data, selected }: { data: any; selected?: boolean }) => {
  const buttons = data.buttons || [{ id: '1', text: 'Opção 1' }, { id: '2', text: 'Opção 2' }];
  const maxButtons = Math.min(buttons.length, 3);
  
  return (
    <div className={`bg-white border-2 ${selected ? 'border-primary' : 'border-orange-300'} rounded-lg p-3 min-w-[220px] shadow-lg`}>
      <div className="flex items-center gap-2 mb-3">
        <div className="bg-orange-500 rounded-full p-1">
          <Square className="h-3 w-3 text-white" />
        </div>
        <div className="font-semibold text-orange-800 text-sm">Botões de Resposta</div>
      </div>
      
      <div className="text-sm text-gray-700 mb-3 max-w-[200px] break-words">
        {data.message || 'Clique para editar mensagem...'}
      </div>
      
      {/* Botões com handles na lateral direita */}
      <div className="space-y-2">
        {buttons.slice(0, 3).map((button: any, index: number) => (
          <div key={index} className="relative flex items-center">
            <div className="flex-1 text-xs bg-orange-50 border border-orange-200 rounded px-3 py-2 pr-8">
              {button.text || `Botão ${index + 1}`}
            </div>
            <Handle
              type="source"
              position={Position.Right}
              id={`button-${index}`}
              className="w-2 h-2 bg-orange-500 border border-white !relative !transform-none !right-0 !top-0 ml-1"
            />
          </div>
        ))}
      </div>
      
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-orange-500 border-2 border-white"
      />
    </div>
  )
})