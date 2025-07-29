/**
 * Sistema de validação e sanitização de dados
 */
import { z } from 'zod';
import { logger } from './structured-logger';

// Schemas de validação comuns
export const commonSchemas = {
  email: z.string().email('Email inválido').toLowerCase(),
  
  phone: z.string()
    .regex(/^[\+]?[1-9][\d]{0,15}$/, 'Telefone inválido')
    .transform(val => val.replace(/\D/g, '')),
  
  cpf: z.string()
    .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/, 'CPF inválido')
    .transform(val => val.replace(/\D/g, '')),
  
  cnpj: z.string()
    .regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$|^\d{14}$/, 'CNPJ inválido')
    .transform(val => val.replace(/\D/g, '')),
  
  url: z.string().url('URL inválida'),
  
  uuid: z.string().uuid('UUID inválido'),
  
  password: z.string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Senha deve conter maiúscula, minúscula e número'),
  
  name: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome muito longo')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome contém caracteres inválidos'),
  
  slug: z.string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug inválido')
    .transform(val => val.toLowerCase()),
  
  positiveNumber: z.number().positive('Deve ser um número positivo'),
  
  dateString: z.string().datetime('Data inválida'),
  
  hexColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Cor hexadecimal inválida')
};

// Sanitização de dados
export class DataSanitizer {
  // Remover caracteres perigosos
  static sanitizeString(input: string): string {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/javascript:/gi, '') // Remove javascript:
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  }

  // Sanitizar HTML permitindo apenas tags seguras
  static sanitizeHTML(input: string, allowedTags: string[] = ['b', 'i', 'u', 'strong', 'em']): string {
    const tagRegex = /<(\/?)([\w]+)([^>]*)>/g;
    
    return input.replace(tagRegex, (match, closing, tagName, attributes) => {
      if (allowedTags.includes(tagName.toLowerCase())) {
        // Remove atributos perigosos
        const safeAttributes = attributes.replace(/(on\w+|javascript:|data-)/gi, '');
        return `<${closing}${tagName}${safeAttributes}>`;
      }
      return '';
    });
  }

  // Sanitizar SQL (prevenir injection)
  static sanitizeSQL(input: string): string {
    return input
      .replace(/['";\\]/g, '') // Remove caracteres perigosos
      .replace(/\b(DROP|DELETE|INSERT|UPDATE|SELECT|UNION|ALTER|CREATE)\b/gi, '') // Remove palavras SQL
      .trim();
  }

  // Sanitizar números
  static sanitizeNumber(input: any): number | null {
    const num = Number(input);
    return isNaN(num) ? null : num;
  }

  // Sanitizar boolean
  static sanitizeBoolean(input: any): boolean {
    if (typeof input === 'boolean') return input;
    if (typeof input === 'string') {
      return ['true', '1', 'yes', 'on'].includes(input.toLowerCase());
    }
    return Boolean(input);
  }

  // Sanitizar array
  static sanitizeArray(input: any): any[] {
    if (Array.isArray(input)) return input;
    if (typeof input === 'string') {
      try {
        const parsed = JSON.parse(input);
        return Array.isArray(parsed) ? parsed : [input];
      } catch {
        return [input];
      }
    }
    return [];
  }

  // Sanitizar objeto removendo propriedades perigosas
  static sanitizeObject(input: Record<string, any>, dangerousKeys: string[] = ['__proto__', 'constructor', 'prototype']): Record<string, any> {
    const sanitized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(input)) {
      if (dangerousKeys.includes(key)) continue;
      
      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeString(value);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeObject(value, dangerousKeys);
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }
}

// Validador principal
export class DataValidator {
  private static schemas: Map<string, z.ZodSchema> = new Map();

  // Registrar schema customizado
  static registerSchema(name: string, schema: z.ZodSchema): void {
    this.schemas.set(name, schema);
  }

  // Validar dados com schema
  static async validate<T>(data: unknown, schema: z.ZodSchema<T>): Promise<{
    success: boolean;
    data?: T;
    errors?: string[];
  }> {
    try {
      const validated = await schema.parseAsync(data);
      return { success: true, data: validated };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => 
          `${err.path.join('.')}: ${err.message}`
        );
        
        logger.warn('Data validation failed', {
          component: 'DataValidator',
          metadata: { errors }
        });
        
        return { success: false, errors };
      }
      
      logger.error('Validation error', {
        component: 'DataValidator'
      }, error as Error);
      
      return { success: false, errors: ['Erro de validação'] };
    }
  }

  // Validar com schema registrado
  static async validateWithSchema(data: unknown, schemaName: string): Promise<{
    success: boolean;
    data?: unknown;
    errors?: string[];
  }> {
    const schema = this.schemas.get(schemaName);
    if (!schema) {
      return { success: false, errors: [`Schema '${schemaName}' não encontrado`] };
    }
    
    return this.validate(data, schema);
  }

  // Validar e sanitizar simultaneamente
  static async validateAndSanitize<T>(
    data: unknown, 
    schema: z.ZodSchema<T>,
    sanitizeOptions?: {
      sanitizeStrings?: boolean;
      sanitizeHTML?: boolean;
      allowedHTMLTags?: string[];
    }
  ): Promise<{
    success: boolean;
    data?: T;
    errors?: string[];
  }> {
    try {
      let processedData = data;
      
      // Sanitizar se solicitado
      if (sanitizeOptions?.sanitizeStrings && typeof data === 'object' && data !== null) {
        processedData = DataSanitizer.sanitizeObject(data as Record<string, any>);
      }
      
      // Validar dados sanitizados
      const result = await this.validate(processedData, schema);
      
      return result;
    } catch (error) {
      logger.error('Validation and sanitization error', {
        component: 'DataValidator'
      }, error as Error);
      
      return { success: false, errors: ['Erro na validação e sanitização'] };
    }
  }
}

// Schemas específicos do domínio
export const domainSchemas = {
  // Usuário
  user: z.object({
    nome: commonSchemas.name,
    email: commonSchemas.email,
    telefone: commonSchemas.phone.optional(),
    cargo: z.string().min(2, 'Cargo inválido'),
    setor: z.string().min(2, 'Setor inválido'),
    status: z.enum(['online', 'offline', 'ausente']),
    permissoes: z.array(z.string()).default([])
  }),

  // Empresa
  empresa: z.object({
    nome: z.string().min(2, 'Nome da empresa obrigatório'),
    email: commonSchemas.email,
    telefone: commonSchemas.phone.optional(),
    cnpj: commonSchemas.cnpj.optional(),
    endereco: z.string().optional(),
    plano: z.enum(['basico', 'profissional', 'empresarial']).default('basico'),
    status: z.enum(['ativa', 'inativa', 'suspensa']).default('ativa')
  }),

  // Atendimento
  atendimento: z.object({
    cliente_telefone: commonSchemas.phone,
    cliente_nome: commonSchemas.name,
    assunto: z.string().min(5, 'Assunto muito curto'),
    prioridade: z.enum(['baixa', 'media', 'alta', 'urgente']).default('media'),
    categoria: z.string().min(2, 'Categoria obrigatória'),
    descricao: z.string().optional()
  }),

  // Mensagem
  mensagem: z.object({
    conteudo: z.string().min(1, 'Mensagem não pode estar vazia').max(4096, 'Mensagem muito longa'),
    tipo: z.enum(['texto', 'imagem', 'audio', 'video', 'documento']).default('texto'),
    remetente: z.string().min(1, 'Remetente obrigatório'),
    destinatario: z.string().min(1, 'Destinatário obrigatório')
  }),

  // Configurações
  configuracao: z.object({
    chave: z.string().min(1, 'Chave obrigatória'),
    valor: z.union([z.string(), z.number(), z.boolean()]),
    categoria: z.string().min(1, 'Categoria obrigatória'),
    descricao: z.string().optional()
  })
};

// Registrar schemas
Object.entries(domainSchemas).forEach(([name, schema]) => {
  DataValidator.registerSchema(name, schema);
});

// Hook para validação
export function useDataValidation() {
  return {
    validate: DataValidator.validate,
    validateWithSchema: DataValidator.validateWithSchema,
    validateAndSanitize: DataValidator.validateAndSanitize,
    sanitize: DataSanitizer,
    schemas: { ...commonSchemas, ...domainSchemas }
  };
}

// Middleware de validação para APIs
export function withValidation<T>(schema: z.ZodSchema<T>) {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const [data] = args;
      
      const validation = await DataValidator.validate(data, schema);
      if (!validation.success) {
        throw new Error(`Validation failed: ${validation.errors?.join(', ')}`);
      }
      
      return originalMethod.apply(this, [validation.data, ...args.slice(1)]);
    };
    
    return descriptor;
  };
}