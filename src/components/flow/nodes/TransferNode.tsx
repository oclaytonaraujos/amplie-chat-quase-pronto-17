import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import { UserPlus } from 'lucide-react'

export const TransferNode = memo(({ data, selected }: { data: any; selected?: boolean }) => {
  return (
    <div className={`bg-white border-2 ${selected ? 'border-primary' : 'border-red-300'} rounded-lg p-4 min-w-[200px] shadow-lg`}>
      <div className="flex items-center gap-2 mb-2">
        <div className="bg-red-500 rounded-full p-1">
          <UserPlus className="h-3 w-3 text-white" />
        </div>
        <div className="font-semibold text-red-800">Transferir</div>
      </div>
      
      <div className="text-sm text-gray-600 space-y-1">
        <div className="truncate">
          <span className="font-medium">Para:</span> {data.department || 'Selecione setor'}
        </div>
        {data.message && (
          <div className="text-xs text-gray-500 max-w-[180px] truncate">
            {data.message}
          </div>
        )}
      </div>
      
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-red-500 border-2 border-white"
      />
    </div>
  )
})