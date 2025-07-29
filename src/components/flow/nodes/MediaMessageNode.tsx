import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import { Image, FileText, Video, Music } from 'lucide-react'

export const MediaMessageNode = memo(({ data, selected }: { data: any; selected?: boolean }) => {
  const getIcon = () => {
    switch (data.mediaType) {
      case 'image': return <Image className="h-3 w-3 text-white" />
      case 'video': return <Video className="h-3 w-3 text-white" />
      case 'audio': return <Music className="h-3 w-3 text-white" />
      default: return <FileText className="h-3 w-3 text-white" />
    }
  }

  return (
    <div className={`bg-white border-2 ${selected ? 'border-primary' : 'border-purple-300'} rounded-lg p-4 min-w-[200px] shadow-lg`}>
      <div className="flex items-center gap-2 mb-2">
        <div className="bg-purple-500 rounded-full p-1">
          {getIcon()}
        </div>
        <div className="font-semibold text-purple-800">Enviar Mídia</div>
      </div>
      
      <div className="text-sm text-gray-600">
        <div className="capitalize">{data.mediaType || 'Selecione tipo'}</div>
        {data.caption && (
          <div className="text-xs text-gray-500 max-w-[180px] truncate mt-1">
            {data.caption}
          </div>
        )}
      </div>
      
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-purple-500 border-2 border-white"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-purple-500 border-2 border-white"
      />
    </div>
  )
})