import { useEffect, useRef, useCallback } from 'react'
import { Node, Edge } from '@xyflow/react'
import { toast } from '@/hooks/use-toast'

interface AutoSaveOptions {
  interval?: number // milliseconds
  enabled?: boolean
  onSave: (nodes: Node[], edges: Edge[], flowName: string) => Promise<void>
  onError?: (error: Error) => void
}

export function useAutoSave(
  nodes: Node[], 
  edges: Edge[], 
  flowName: string,
  options: AutoSaveOptions
) {
  const {
    interval = 30000, // 30 segundos
    enabled = true,
    onSave,
    onError
  } = options
  
  const lastSaveRef = useRef<string>('')
  const timeoutRef = useRef<NodeJS.Timeout>()
  const isSavingRef = useRef(false)
  
  // Gerar hash simples dos dados para detectar mudanças
  const generateHash = useCallback((nodes: Node[], edges: Edge[], name: string) => {
    return JSON.stringify({ nodes, edges, name })
  }, [])
  
  const performAutoSave = useCallback(async () => {
    if (isSavingRef.current) return
    
    const currentHash = generateHash(nodes, edges, flowName)
    
    // Se não houve mudanças, não salvar
    if (currentHash === lastSaveRef.current) return
    
    try {
      isSavingRef.current = true
      await onSave(nodes, edges, flowName)
      lastSaveRef.current = currentHash
      
      toast({
        title: 'Auto-salvo',
        description: 'Fluxo salvo automaticamente',
        duration: 2000
      })
    } catch (error) {
      console.error('Erro no auto-salvamento:', error)
      if (onError) {
        onError(error instanceof Error ? error : new Error('Erro desconhecido'))
      }
    } finally {
      isSavingRef.current = false
    }
  }, [nodes, edges, flowName, onSave, onError, generateHash])
  
  // Configurar auto-salvamento
  useEffect(() => {
    if (!enabled || nodes.length === 0) return
    
    // Limpar timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    // Agendar próximo auto-salvamento
    timeoutRef.current = setTimeout(performAutoSave, interval)
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [enabled, interval, performAutoSave, nodes.length])
  
  // Salvar quando a página for fechada/recarregada
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const currentHash = generateHash(nodes, edges, flowName)
      if (currentHash !== lastSaveRef.current) {
        e.preventDefault()
        e.returnValue = 'Você tem alterações não salvas. Deseja sair mesmo assim?'
        return e.returnValue
      }
    }
    
    window.addEventListener('beforeunload', handleBeforeUnload)
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [nodes, edges, flowName, generateHash])
  
  // Salvar quando o componente for desmontado
  useEffect(() => {
    return () => {
      const currentHash = generateHash(nodes, edges, flowName)
      if (currentHash !== lastSaveRef.current && nodes.length > 0) {
        // Tentativa de salvamento síncrono (pode não funcionar sempre)
        onSave(nodes, edges, flowName).catch(console.error)
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  
  const hasUnsavedChanges = useCallback(() => {
    const currentHash = generateHash(nodes, edges, flowName)
    return currentHash !== lastSaveRef.current
  }, [nodes, edges, flowName, generateHash])
  
  const markAsSaved = useCallback(() => {
    lastSaveRef.current = generateHash(nodes, edges, flowName)
  }, [nodes, edges, flowName, generateHash])
  
  return {
    hasUnsavedChanges: hasUnsavedChanges(),
    markAsSaved,
    performAutoSave
  }
}