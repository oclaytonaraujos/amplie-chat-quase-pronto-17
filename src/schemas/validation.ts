/**
 * Schemas de validação centralizados usando Zod
 * Garante consistência na validação em toda a aplicação
 */
import { z } from 'zod';

// Validações robustas client-side expandidas
export const phoneSchema = z.string()
  .min(10, "Telefone deve ter pelo menos 10 dígitos")
  .max(15, "Telefone deve ter no máximo 15 dígitos")
  .regex(/^[\d\s\-\+\(\)]+$/, "Telefone contém caracteres inválidos");

export const emailSchema = z.string()
  .email("Email inválido")
  .max(255, "Email muito longo");

export const passwordSchema = z.string()
  .min(8, "Senha deve ter pelo menos 8 caracteres")
  .max(128, "Senha muito longa")
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Senha deve conter ao menos: 1 minúscula, 1 maiúscula e 1 número");

export const nameSchema = z.string()
  .min(2, "Nome deve ter pelo menos 2 caracteres")
  .max(100, "Nome muito longo")
  .regex(/^[a-zA-ZÀ-ÿ\s]+$/, "Nome deve conter apenas letras e espaços");

export const cnpjSchema = z.string()
  .optional()
  .refine((val) => {
    if (!val) return true;
    const cleanCnpj = val.replace(/\D/g, '');
    return cleanCnpj.length === 14;
  }, "CNPJ deve ter 14 dígitos");

// Validações básicas reutilizáveis
export const commonValidations = {
  email: emailSchema,
  password: passwordSchema,
  telefone: phoneSchema,
  nome: nameSchema,
  documento: z.string()
    .min(11, 'Documento inválido')
    .max(18, 'Documento muito longo')
    .regex(/^[\d\.\-\/]+$/, 'Documento contém caracteres inválidos'),
  url: z.string()
    .url('URL inválida')
    .max(255, 'URL muito longa'),
  slug: z.string()
    .min(3, 'Slug deve ter pelo menos 3 caracteres')
    .max(50, 'Slug muito longo')
    .regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífens'),
};

// Schemas para formulários robustos
export const contatoSchema = z.object({
  nome: nameSchema,
  telefone: phoneSchema.optional(),
  email: emailSchema.optional(),
  empresa: z.string().max(100).optional(),
  observacoes: z.string().max(500).optional(),
  tags: z.array(z.string()).optional()
}).refine(data => data.telefone || data.email, {
  message: "Pelo menos telefone ou email deve ser fornecido"
});

export const empresaSchema = z.object({
  nome: nameSchema,
  cnpj: cnpjSchema,
  email: emailSchema.optional(),
  telefone: phoneSchema.optional(),
  endereco: z.string().max(255).optional()
});

export const usuarioSchema = z.object({
  nome: nameSchema,
  email: emailSchema,
  password: passwordSchema.optional(),
  cargo: z.enum(['admin', 'agente', 'usuario']),
  setor: z.string().optional(),
  ativo: z.boolean().optional()
});

export const chatbotSchema = z.object({
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres").max(100),
  mensagem_inicial: z.string().min(10, "Mensagem inicial muito curta").max(1000),
  status: z.enum(['ativo', 'inativo']),
  fluxo: z.array(z.any()).optional()
});

export const mensagemSchema = z.object({
  conteudo: z.string().min(1, "Mensagem não pode estar vazia").max(4000),
  tipo: z.enum(['text', 'image', 'video', 'audio', 'document']).optional().default('text'),
  destinatario: phoneSchema
});

// Validação para uploads robusta
export const uploadSchema = z.object({
  file: z.instanceof(File),
  maxSize: z.number().positive().optional().default(10), // MB
  allowedTypes: z.array(z.string()).optional()
}).refine((data) => {
  if (data.file.size > data.maxSize * 1024 * 1024) {
    return false;
  }
  if (data.allowedTypes && data.allowedTypes.length > 0) {
    return data.allowedTypes.some(type => data.file.type.includes(type));
  }
  return true;
}, "Arquivo inválido");

// Validação para configurações avançadas
export const evolutionApiConfigSchema = z.object({
  instance_name: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_-]+$/),
  webhook_url: z.string().url().optional(),
  webhook_events: z.array(z.string()).optional(),
  always_online: z.boolean().optional(),
  read_messages: z.boolean().optional(),
  read_status: z.boolean().optional()
});
  email: z.string()
    .min(1, 'Email é obrigatório')
    .email('Email inválido')
    .max(100, 'Email muito longo'),
    
  password: z.string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .max(100, 'Senha muito longa')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Senha deve conter ao menos uma letra minúscula, uma maiúscula e um número'),
    
  telefone: z.string()
    .min(10, 'Telefone deve ter pelo menos 10 dígitos')
    .max(15, 'Telefone muito longo')
    .regex(/^[\d\s\-\(\)\+]+$/, 'Telefone contém caracteres inválidos'),
    
  nome: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome muito longo')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras e espaços'),
    
  documento: z.string()
    .min(11, 'Documento inválido')
    .max(18, 'Documento muito longo')
    .regex(/^[\d\.\-\/]+$/, 'Documento contém caracteres inválidos'),
    
  url: z.string()
    .url('URL inválida')
    .max(255, 'URL muito longa'),
    
  slug: z.string()
    .min(3, 'Slug deve ter pelo menos 3 caracteres')
    .max(50, 'Slug muito longo')
    .regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífens'),
};

// Schema para autenticação
export const authSchemas = {
  login: z.object({
    email: commonValidations.email,
    password: z.string().min(1, 'Senha é obrigatória')
  }),
  
  register: z.object({
    email: commonValidations.email,
    password: commonValidations.password,
    confirmPassword: z.string(),
    nome: commonValidations.nome,
    telefone: commonValidations.telefone.optional(),
    termsAccepted: z.boolean().refine(val => val === true, 'Você deve aceitar os termos de uso')
  }).refine(data => data.password === data.confirmPassword, {
    message: 'Senhas não coincidem',
    path: ['confirmPassword']
  }),
  
  resetPassword: z.object({
    email: commonValidations.email
  }),
  
  changePassword: z.object({
    currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
    newPassword: commonValidations.password,
    confirmPassword: z.string()
  }).refine(data => data.newPassword === data.confirmPassword, {
    message: 'Senhas não coincidem',
    path: ['confirmPassword']
  })
};

// Schema para perfil de usuário
export const userSchemas = {
  profile: z.object({
    nome: commonValidations.nome,
    email: commonValidations.email,
    telefone: commonValidations.telefone.optional(),
    avatar_url: z.string().url().optional(),
    biografia: z.string().max(500, 'Biografia muito longa').optional(),
    cargo: z.string().max(100, 'Cargo muito longo').optional(),
    departamento: z.string().max(100, 'Departamento muito longo').optional()
  }),
  
  createUser: z.object({
    nome: commonValidations.nome,
    email: commonValidations.email,
    telefone: commonValidations.telefone.optional(),
    cargo: z.string().max(100, 'Cargo muito longo').optional(),
    departamento: z.string().max(100, 'Departamento muito longo').optional(),
    role: z.enum(['user', 'admin', 'manager'], {
      errorMap: () => ({ message: 'Role inválido' })
    }),
    senha_temporaria: z.boolean().default(true)
  })
};

// Schema para empresa
export const empresaSchemas = {
  create: z.object({
    nome: z.string().min(2, 'Nome da empresa é obrigatório').max(200, 'Nome muito longo'),
    cnpj: z.string()
      .min(14, 'CNPJ inválido')
      .max(18, 'CNPJ inválido')
      .regex(/^[\d\.\/\-]+$/, 'CNPJ deve conter apenas números, pontos, barras e hífens'),
    email: commonValidations.email,
    telefone: commonValidations.telefone,
    endereco: z.string().min(10, 'Endereço muito curto').max(255, 'Endereço muito longo'),
    plano_id: z.string().uuid('ID do plano inválido'),
    status: z.enum(['ativa', 'inativa', 'suspensa']).default('ativa'),
    configuracoes: z.record(z.any()).optional()
  }),
  
  update: z.object({
    nome: z.string().min(2, 'Nome da empresa é obrigatório').max(200, 'Nome muito longo').optional(),
    email: commonValidations.email.optional(),
    telefone: commonValidations.telefone.optional(),
    endereco: z.string().min(10, 'Endereço muito curto').max(255, 'Endereço muito longo').optional(),
    status: z.enum(['ativa', 'inativa', 'suspensa']).optional(),
    configuracoes: z.record(z.any()).optional()
  })
};

// Schema para contatos
export const contatoSchemas = {
  create: z.object({
    nome: commonValidations.nome,
    telefone: commonValidations.telefone,
    email: commonValidations.email.optional(),
    documento: commonValidations.documento.optional(),
    endereco: z.string().max(255, 'Endereço muito longo').optional(),
    observacoes: z.string().max(1000, 'Observações muito longas').optional(),
    tags: z.array(z.string()).optional(),
    empresa_id: z.string().uuid('ID da empresa inválido').optional()
  }),
  
  update: z.object({
    nome: commonValidations.nome.optional(),
    telefone: commonValidations.telefone.optional(),
    email: commonValidations.email.optional(),
    documento: commonValidations.documento.optional(),
    endereco: z.string().max(255, 'Endereço muito longo').optional(),
    observacoes: z.string().max(1000, 'Observações muito longas').optional(),
    tags: z.array(z.string()).optional()
  })
};

// Schema para chatbot
export const chatbotSchemas = {
  create: z.object({
    nome: z.string().min(2, 'Nome do chatbot é obrigatório').max(100, 'Nome muito longo'),
    descricao: z.string().max(500, 'Descrição muito longa').optional(),
    prompt_sistema: z.string().min(10, 'Prompt do sistema é obrigatório').max(2000, 'Prompt muito longo'),
    ativo: z.boolean().default(true),
    configuracoes: z.object({
      temperatura: z.number().min(0).max(2).default(0.7),
      max_tokens: z.number().min(1).max(4000).default(1000),
      timeout: z.number().min(1).max(60).default(30)
    }).optional()
  }),
  
  message: z.object({
    conteudo: z.string().min(1, 'Mensagem não pode estar vazia').max(2000, 'Mensagem muito longa'),
    tipo: z.enum(['text', 'image', 'audio', 'document']).default('text'),
    metadata: z.record(z.any()).optional()
  })
};

// Schema para configurações
export const configSchemas = {
  whatsapp: z.object({
    instance_id: z.string().min(1, 'Instance ID é obrigatório'),
    token: z.string().min(1, 'Token é obrigatório'),
    webhook_url: commonValidations.url.optional(),
    auto_resposta: z.boolean().default(false),
    mensagem_ausencia: z.string().max(500, 'Mensagem de ausência muito longa').optional()
  }),
  
  sistema: z.object({
    tema: z.enum(['light', 'dark', 'auto']).default('light'),
    idioma: z.enum(['pt-BR', 'en-US']).default('pt-BR'),
    timezone: z.string().default('America/Sao_Paulo'),
    notificacoes_email: z.boolean().default(true),
    notificacoes_push: z.boolean().default(true)
  })
};

// Schema para formulários de filtro
export const filterSchemas = {
  dateRange: z.object({
    inicio: z.date().optional(),
    fim: z.date().optional(),
    periodo: z.enum(['hoje', 'ontem', 'semana', 'mes', 'trimestre', 'ano', 'personalizado']).optional()
  }).refine(data => {
    if (data.inicio && data.fim) {
      return data.inicio <= data.fim;
    }
    return true;
  }, {
    message: 'Data de início deve ser anterior à data de fim',
    path: ['fim']
  }),
  
  pagination: z.object({
    page: z.number().min(1).default(1),
    limit: z.number().min(1).max(100).default(20),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc')
  }),
  
  search: z.object({
    query: z.string().max(100, 'Termo de busca muito longo').optional(),
    filters: z.record(z.any()).optional()
  })
};

// Utilitários para validação
export const validateData = <T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: z.ZodError } => {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, errors: result.error };
  }
};

export const getFieldErrors = (error: z.ZodError): Record<string, string> => {
  const fieldErrors: Record<string, string> = {};
  
  error.errors.forEach((err) => {
    const path = err.path.join('.');
    fieldErrors[path] = err.message;
  });
  
  return fieldErrors;
};

// Export de todos os schemas para fácil importação
export const schemas = {
  auth: authSchemas,
  user: userSchemas,
  empresa: empresaSchemas,
  contato: contatoSchemas,
  chatbot: chatbotSchemas,
  config: configSchemas,
  filter: filterSchemas,
  common: commonValidations
};

export default schemas;