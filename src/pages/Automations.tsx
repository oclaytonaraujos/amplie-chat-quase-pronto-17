import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Plus, Play, Pause, Edit, Trash2, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/integrations/supabase/client'
import { toast } from '@/hooks/use-toast'

export default function Automations() {
  const navigate = useNavigate()

  // Fetch automations
  const { data: automations, isLoading, refetch } = useQuery({
    queryKey: ['automations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('automations')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    }
  })

  const handleStatusToggle = async (automationId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    
    const { error } = await supabase
      .from('automations')
      .update({ status: newStatus })
      .eq('id', automationId)

    if (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao alterar status da automação',
        variant: 'destructive'
      })
    } else {
      toast({
        title: 'Sucesso',
        description: `Automação ${newStatus === 'active' ? 'ativada' : 'desativada'} com sucesso!`
      })
      refetch()
    }
  }

  const handleDelete = async (automationId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta automação?')) return

    const { error } = await supabase
      .from('automations')
      .delete()
      .eq('id', automationId)

    if (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao excluir automação',
        variant: 'destructive'
      })
    } else {
      toast({
        title: 'Sucesso',
        description: 'Automação excluída com sucesso!'
      })
      refetch()
    }
  }

  const handleDuplicate = async (automation: any) => {
    const { error } = await supabase
      .from('automations')
      .insert({
        name: `${automation.name} (Cópia)`,
        flow_data: automation.flow_data,
        empresa_id: automation.empresa_id,
        status: 'draft'
      })

    if (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao duplicar automação',
        variant: 'destructive'
      })
    } else {
      toast({
        title: 'Sucesso',
        description: 'Automação duplicada com sucesso!'
      })
      refetch()
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      case 'draft': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Ativo'
      case 'inactive': return 'Inativo'
      case 'draft': return 'Rascunho'
      default: return 'Desconhecido'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Carregando automações...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Automações</h1>
          <p className="text-muted-foreground">
            Gerencie seus fluxos de automação de chatbot
          </p>
        </div>
        <Button disabled>
          <Plus className="w-4 h-4 mr-2" />
          Nova Automação (Em breve)
        </Button>
      </div>

      {automations?.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="text-muted-foreground mb-4">
              <svg
                className="mx-auto h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium mb-2">Nenhuma automação encontrada</h3>
            <p className="text-muted-foreground mb-6">
              Crie sua primeira automação para começar a automatizar atendimentos.
            </p>
            <Button disabled>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeira Automação (Em breve)
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {automations?.map((automation) => (
            <Card key={automation.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{automation.name}</CardTitle>
                    <Badge className={`mt-2 ${getStatusColor(automation.status)}`}>
                      {getStatusLabel(automation.status)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground mb-4">
                  <p>Criado em: {new Date(automation.created_at).toLocaleDateString('pt-BR')}</p>
                  <p>Última modificação: {new Date(automation.updated_at).toLocaleDateString('pt-BR')}</p>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Editar (Em breve)
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusToggle(automation.id, automation.status)}
                    disabled={automation.status === 'draft'}
                  >
                    {automation.status === 'active' ? (
                      <>
                        <Pause className="w-3 h-3 mr-1" />
                        Pausar
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3 mr-1" />
                        Ativar
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDuplicate(automation)}
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    Duplicar
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(automation.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Excluir
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}