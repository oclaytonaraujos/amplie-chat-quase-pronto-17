import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import { Clock } from 'lucide-react'

export const DelayNode = memo(({ data, selected }: { data: any; selected?: boolean }) => {
  const duration = data.duration || 2
  const unit = data.unit || 'seconds'
  
  const formatDuration = () => {
    if (unit === 'minutes') {
      return `${duration} min`
    }
    return `${duration}s`
  }

  return (
    <div className={`bg-white border-2 ${selected ? 'border-primary' : 'border-slate-300'} rounded-lg p-4 min-w-[200px] shadow-lg`}>
      <div className="flex items-center gap-2 mb-2">
        <div className="bg-slate-500 rounded-full p-1">
          <Clock className="h-3 w-3 text-white" />
        </div>
        <div className="font-semibold text-slate-800">Aguardar</div>
      </div>
      
      <div className="text-sm text-gray-600 max-w-[180px]">
        <div className="font-medium">Duração: {formatDuration()}</div>
        {data.message && (
          <div className="text-xs mt-1 truncate">{data.message}</div>
        )}
      </div>
      
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-slate-500 border-2 border-white"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-slate-500 border-2 border-white"
      />
    </div>
  )
})