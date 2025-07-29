import { Node, Edge } from '@xyflow/react'
import { useMemo } from 'react'

export interface ValidationIssue {
  id: string
  type: 'error' | 'warning' | 'info'
  message: string
  nodeId?: string
  category: 'connection' | 'configuration' | 'flow' | 'performance'
}

export function useFlowValidation(nodes: Node[], edges: Edge[]) {
  const validation = useMemo(() => {
    const issues: ValidationIssue[] = []
    
    // 1. Verificar nós desconectados
    const connectedNodeIds = new Set<string>()
    edges.forEach(edge => {
      connectedNodeIds.add(edge.source)
      connectedNodeIds.add(edge.target)
    })
    
    nodes.forEach(node => {
      if (node.id !== 'start' && !connectedNodeIds.has(node.id)) {
        issues.push({
          id: `disconnected-${node.id}`,
          type: 'warning',
          message: `Nó "${node.data.label || node.type}" está desconectado`,
          nodeId: node.id,
          category: 'connection'
        })
      }
    })
    
    // 2. Verificar campos obrigatórios
    nodes.forEach(node => {
      const validationResult = validateNodeConfiguration(node)
      issues.push(...validationResult)
    })
    
    // 3. Verificar loops infinitos básicos
    const loopIssues = detectPotentialLoops(nodes, edges)
    issues.push(...loopIssues)
    
    // 4. Verificar se há nó inicial
    const hasStartNode = nodes.some(node => node.type === 'start')
    if (!hasStartNode && nodes.length > 0) {
      issues.push({
        id: 'no-start-node',
        type: 'error',
        message: 'Fluxo deve ter um nó de início',
        category: 'flow'
      })
    }
    
    // 5. Verificar nós sem saída (exceto transfer e finalizadores)
    const finalNodes = ['transfer', 'template']
    nodes.forEach(node => {
      if (!finalNodes.includes(node.type)) {
        const hasOutput = edges.some(edge => edge.source === node.id)
        if (!hasOutput) {
          issues.push({
            id: `no-output-${node.id}`,
            type: 'warning',
            message: `Nó "${node.data.label || node.type}" não possui saída`,
            nodeId: node.id,
            category: 'connection'
          })
        }
      }
    })
    
    const errorCount = issues.filter(issue => issue.type === 'error').length
    const warningCount = issues.filter(issue => issue.type === 'warning').length
    const infoCount = issues.filter(issue => issue.type === 'info').length
    
    return {
      issues,
      isValid: errorCount === 0,
      hasWarnings: warningCount > 0,
      errorCount,
      warningCount,
      infoCount,
      totalIssues: issues.length
    }
  }, [nodes, edges])
  
  return validation
}

function validateNodeConfiguration(node: Node): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  
  switch (node.type) {
    case 'textMessage':
      if (!String(node.data.message || '').trim()) {
        issues.push({
          id: `empty-message-${node.id}`,
          type: 'error',
          message: 'Mensagem de texto não pode estar vazia',
          nodeId: node.id,
          category: 'configuration'
        })
      }
      // Verificar limite de caracteres do WhatsApp (4096)
      if (String(node.data.message || '').length > 4096) {
        issues.push({
          id: `message-too-long-${node.id}`,
          type: 'warning',
          message: 'Mensagem muito longa para WhatsApp (máx: 4096 caracteres)',
          nodeId: node.id,
          category: 'configuration'
        })
      }
      break
      
    case 'buttonMessage':
      if (!String(node.data.message || '').trim()) {
        issues.push({
          id: `empty-button-message-${node.id}`,
          type: 'error',
          message: 'Mensagem dos botões não pode estar vazia',
          nodeId: node.id,
          category: 'configuration'
        })
      }
      if (!Array.isArray(node.data.buttons) || node.data.buttons.length === 0) {
        issues.push({
          id: `no-buttons-${node.id}`,
          type: 'error',
          message: 'Deve ter pelo menos um botão',
          nodeId: node.id,
          category: 'configuration'
        })
      } else {
        // Verificar botões vazios
        node.data.buttons.forEach((button: any, index: number) => {
          if (!String(button.text || '').trim()) {
            issues.push({
              id: `empty-button-${node.id}-${index}`,
              type: 'error',
              message: `Botão ${index + 1} não pode estar vazio`,
              nodeId: node.id,
              category: 'configuration'
            })
          }
          // Limite WhatsApp: 20 caracteres por botão
          if (String(button.text || '').length > 20) {
            issues.push({
              id: `button-too-long-${node.id}-${index}`,
              type: 'warning',
              message: `Botão ${index + 1} muito longo (máx: 20 caracteres)`,
              nodeId: node.id,
              category: 'configuration'
            })
          }
        })
      }
      break
      
    case 'listMessage':
      if (!String(node.data.message || '').trim()) {
        issues.push({
          id: `empty-list-message-${node.id}`,
          type: 'error',
          message: 'Mensagem da lista não pode estar vazia',
          nodeId: node.id,
          category: 'configuration'
        })
      }
      if (!String(node.data.buttonText || '').trim()) {
        issues.push({
          id: `empty-button-text-${node.id}`,
          type: 'error',
          message: 'Texto do botão não pode estar vazio',
          nodeId: node.id,
          category: 'configuration'
        })
      }
      if (!Array.isArray(node.data.sections) || node.data.sections.length === 0) {
        issues.push({
          id: `no-sections-${node.id}`,
          type: 'error',
          message: 'Lista deve ter pelo menos uma seção',
          nodeId: node.id,
          category: 'configuration'
        })
      }
      break
      
    case 'conditional':
      if (!String(node.data.variable || '').trim()) {
        issues.push({
          id: `empty-variable-${node.id}`,
          type: 'error',
          message: 'Variável da condição não pode estar vazia',
          nodeId: node.id,
          category: 'configuration'
        })
      }
      if (!String(node.data.value || '').trim()) {
        issues.push({
          id: `empty-condition-value-${node.id}`,
          type: 'error',
          message: 'Valor da condição não pode estar vazio',
          nodeId: node.id,
          category: 'configuration'
        })
      }
      break
      
    case 'transfer':
      if (!String(node.data.department || '').trim()) {
        issues.push({
          id: `empty-department-${node.id}`,
          type: 'error',
          message: 'Setor de transferência deve ser selecionado',
          nodeId: node.id,
          category: 'configuration'
        })
      }
      break
      
    case 'webhook':
      if (!String(node.data.url || '').trim()) {
        issues.push({
          id: `empty-webhook-url-${node.id}`,
          type: 'error',
          message: 'URL do webhook não pode estar vazia',
          nodeId: node.id,
          category: 'configuration'
        })
      }
      try {
        if (node.data.url) new URL(String(node.data.url))
      } catch {
        issues.push({
          id: `invalid-webhook-url-${node.id}`,
          type: 'error',
          message: 'URL do webhook inválida',
          nodeId: node.id,
          category: 'configuration'
        })
      }
      break
      
    case 'mediaMessage':
      if (!String(node.data.mediaUrl || '').trim()) {
        issues.push({
          id: `empty-media-url-${node.id}`,
          type: 'error',
          message: 'URL da mídia não pode estar vazia',
          nodeId: node.id,
          category: 'configuration'
        })
      }
      break
  }
  
  return issues
}

function detectPotentialLoops(nodes: Node[], edges: Edge[]): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  
  // Detecção básica de loops: se um nó aponta para si mesmo
  edges.forEach(edge => {
    if (edge.source === edge.target) {
      const node = nodes.find(n => n.id === edge.source)
      issues.push({
        id: `self-loop-${edge.source}`,
        type: 'warning',
        message: `Possível loop infinito no nó "${node?.data.label || node?.type}"`,
        nodeId: edge.source,
        category: 'flow'
      })
    }
  })
  
  return issues
}