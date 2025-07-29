import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import { MapPin } from 'lucide-react'

export const LocationNode = memo(({ data, selected }: { data: any; selected?: boolean }) => {
  return (
    <div className={`bg-white border-2 ${selected ? 'border-primary' : 'border-pink-300'} rounded-lg p-4 min-w-[200px] shadow-lg`}>
      <div className="flex items-center gap-2 mb-2">
        <div className="bg-pink-500 rounded-full p-1">
          <MapPin className="h-3 w-3 text-white" />
        </div>
        <div className="font-semibold text-pink-800">Solicitar Localização</div>
      </div>
      
      <div className="text-sm text-gray-600 max-w-[180px] truncate">
        {data.message || 'Compartilhe sua localização...'}
      </div>
      
      <div className="text-xs text-muted-foreground mt-1">
        {data.required ? 'Obrigatório' : 'Opcional'}
      </div>
      
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-pink-500 border-2 border-white"
      />
      
      {/* Duas saídas: recebido e recusado */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="received"
        className="w-3 h-3 bg-green-500 border-2 border-white"
        style={{ left: '30%' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="declined"
        className="w-3 h-3 bg-red-500 border-2 border-white"
        style={{ left: '70%' }}
      />
      
      <div className="flex justify-between text-xs mt-2 px-1">
        <span className="text-green-600">Recebido</span>
        <span className="text-red-600">Recusado</span>
      </div>
    </div>
  )
})