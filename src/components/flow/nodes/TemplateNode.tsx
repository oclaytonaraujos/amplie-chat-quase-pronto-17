import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import { FileText } from 'lucide-react'

export const TemplateNode = memo(({ data, selected }: { data: any; selected?: boolean }) => {
  return (
    <div className={`bg-white border-2 ${selected ? 'border-primary' : 'border-emerald-300'} rounded-lg p-4 min-w-[200px] shadow-lg`}>
      <div className="flex items-center gap-2 mb-2">
        <div className="bg-emerald-500 rounded-full p-1">
          <FileText className="h-3 w-3 text-white" />
        </div>
        <div className="font-semibold text-emerald-800">Template WhatsApp</div>
      </div>
      
      <div className="text-sm text-gray-600 max-w-[180px]">
        <div className="font-medium truncate">
          {data.templateName || 'Selecionar template...'}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          Idioma: {data.language || 'pt_BR'}
        </div>
        {data.parameters && data.parameters.length > 0 && (
          <div className="text-xs text-muted-foreground">
            {data.parameters.length} parâmetros
          </div>
        )}
      </div>
      
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-emerald-500 border-2 border-white"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-emerald-500 border-2 border-white"
      />
    </div>
  )
})