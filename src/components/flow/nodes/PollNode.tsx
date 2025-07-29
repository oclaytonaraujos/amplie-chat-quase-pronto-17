import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import { BarChart3 } from 'lucide-react'

export const PollNode = memo(({ data, selected }: { data: any; selected?: boolean }) => {
  const options = data.options || []
  
  return (
    <div className={`bg-white border-2 ${selected ? 'border-primary' : 'border-cyan-300'} rounded-lg p-4 min-w-[200px] shadow-lg`}>
      <div className="flex items-center gap-2 mb-2">
        <div className="bg-cyan-500 rounded-full p-1">
          <BarChart3 className="h-3 w-3 text-white" />
        </div>
        <div className="font-semibold text-cyan-800">Enquete</div>
      </div>
      
      <div className="text-sm text-gray-600 max-w-[180px]">
        <div className="font-medium mb-1 truncate">
          {data.question || 'Qual sua preferência?'}
        </div>
        <div className="text-xs text-muted-foreground">
          {options.length} opções • {data.multipleAnswers ? 'Múltipla' : 'Única'} escolha
        </div>
      </div>
      
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-cyan-500 border-2 border-white"
      />
      
      {/* Multiple source handles for each poll option */}
      {(data.options || [{ id: '1' }, { id: '2' }]).slice(0, 4).map((option: any, index: number) => (
        <Handle
          key={`option-${index}`}
          type="source"
          position={Position.Bottom}
          id={`option-${index}`}
          className="w-3 h-3 bg-cyan-500 border-2 border-white"
          style={{ left: `${20 + (index * 20)}%` }}
        />
      ))}
    </div>
  )
})