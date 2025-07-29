import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import { List } from 'lucide-react'

export const ListMessageNode = memo(({ data, selected }: { data: any; selected?: boolean }) => {
  const items = (data.sections && data.sections[0]?.items) || [
    { id: '1', title: 'Vendas', description: 'Falar com equipe comercial' }, 
    { id: '2', title: 'Suporte', description: 'Problemas técnicos' }, 
    { id: '3', title: 'Financeiro', description: 'Questões de pagamento' }
  ];
  
  return (
    <div className={`bg-background border-2 ${selected ? 'border-primary' : 'border-teal-300'} rounded-lg p-4 min-w-[280px] max-w-[320px] shadow-lg`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="bg-teal-500 rounded-full p-1.5">
          <List className="h-4 w-4 text-white" />
        </div>
        <div className="font-semibold text-teal-800 text-sm">Lista de Opções</div>
      </div>
      
      {/* Message */}
      <div className="text-sm text-foreground mb-3 font-medium">
        {data.message || 'Qual opção você deseja?'}
      </div>
      
      {/* Button Text */}
      <div className="text-xs text-muted-foreground mb-4 px-3 py-2 bg-teal-50 rounded-md border border-teal-200 flex items-center gap-2">
        <span>📋</span>
        <span>{data.buttonText || 'Ver opções'}</span>
      </div>
      
      {/* Options List with Individual Handles */}
      <div className="space-y-2 mb-3">
        {items.slice(0, 6).map((item: any, index: number) => (
          <div key={index} className="relative group">
            <div className="flex items-center justify-between bg-background border border-teal-200 rounded-md px-3 py-2.5 hover:border-teal-300 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-foreground truncate">
                  {`${index + 1}. ${item.title || `Opção ${index + 1}`}`}
                </div>
                {item.description && (
                  <div className="text-xs text-muted-foreground mt-0.5 truncate">
                    {item.description}
                  </div>
                )}
              </div>
              
              {/* Handle for each option */}
              <div className="flex items-center ml-2">
                <div className="w-2 h-2 rounded-full bg-teal-400 group-hover:bg-teal-500 transition-colors"></div>
                <Handle
                  type="source"
                  position={Position.Right}
                  id={`option-${item.id || index}`}
                  className="w-3 h-3 bg-teal-500 border-2 border-background !absolute !right-[-6px] !top-1/2 !transform !-translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Fallback Handle */}
      <div className="relative group mt-3 pt-2 border-t border-teal-200">
        <div className="flex items-center justify-between bg-orange-50 border border-orange-200 rounded-md px-3 py-2 hover:border-orange-300 transition-colors">
          <div className="flex items-center gap-2">
            <span className="text-orange-500 text-xs">⚠️</span>
            <span className="text-xs font-medium text-orange-700">Opção inválida</span>
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-orange-400 group-hover:bg-orange-500 transition-colors"></div>
            <Handle
              type="source"
              position={Position.Right}
              id="fallback"
              className="w-3 h-3 bg-orange-500 border-2 border-background !absolute !right-[-6px] !top-1/2 !transform !-translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
            />
          </div>
        </div>
      </div>
      
      {/* Main Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-teal-500 border-2 border-background"
      />
    </div>
  )
})