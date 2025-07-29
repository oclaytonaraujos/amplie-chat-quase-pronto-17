
export interface NLPIntent {
  intent: string;
  confidence: number;
  parameters?: Record<string, any>;
  targetStage?: string;
}

export interface NLPResult {
  intent?: string;
  confidence: number;
  parameters?: Record<string, any>;
  targetStage?: string;
  shouldOverrideFlow: boolean;
}

export class NLPProcessor {
  private supabase: any;
  private logger: any;

  constructor(supabase: any, logger: any) {
    this.supabase = supabase;
    this.logger = logger;
  }

  async processMessage(message: string, contactPhone: string, empresaId: string): Promise<NLPResult> {
    try {
      // Primeiro, tentar análise com OpenAI se disponível
      const openaiResult = await this.analyzeWithOpenAI(message);
      
      // Em seguida, verificar intents configuradas na empresa
      const configuredIntents = await this.getConfiguredIntents(empresaId);
      const matchedIntent = this.matchConfiguredIntent(message, configuredIntents);

      // Combinar resultados
      let finalResult: NLPResult = {
        confidence: 0,
        shouldOverrideFlow: false
      };

      if (matchedIntent && matchedIntent.confidence > (openaiResult?.confidence || 0)) {
        finalResult = {
          intent: matchedIntent.intent,
          confidence: matchedIntent.confidence,
          parameters: matchedIntent.parameters,
          targetStage: matchedIntent.targetStage,
          shouldOverrideFlow: matchedIntent.confidence >= 0.7
        };
      } else if (openaiResult && openaiResult.confidence > 0.7) {
        finalResult = {
          intent: openaiResult.intent,
          confidence: openaiResult.confidence,
          parameters: openaiResult.parameters,
          shouldOverrideFlow: true
        };
      }

      await this.logger.debug(
        'NLP processing completed',
        contactPhone,
        undefined,
        { message, finalResult, openaiResult, matchedIntent }
      );

      return finalResult;
    } catch (error) {
      await this.logger.error(
        'Error in NLP processing',
        contactPhone,
        undefined,
        { error: error.message, message }
      );
      return { confidence: 0, shouldOverrideFlow: false };
    }
  }

  private async analyzeWithOpenAI(message: string): Promise<NLPResult | null> {
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      return null;
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `Você é um analisador de intenções para chatbot. Analise a mensagem do usuário e retorne um JSON com:
              {
                "intent": "product_inquiry|support_request|complaint|greeting|appointment|payment|other",
                "confidence": 0.9,
                "parameters": {
                  "product_mentioned": "nome do produto se mencionado",
                  "urgency_level": "low|medium|high",
                  "emotion": "positive|neutral|negative"
                }
              }`
            },
            {
              role: 'user',
              content: message
            }
          ],
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const result = JSON.parse(data.choices[0].message.content);
      
      return {
        intent: result.intent,
        confidence: result.confidence,
        parameters: result.parameters,
        shouldOverrideFlow: result.confidence >= 0.7
      };
    } catch (error) {
      await this.logger.warn('OpenAI analysis failed', undefined, undefined, { error: error.message });
      return null;
    }
  }

  private async getConfiguredIntents(empresaId: string): Promise<any[]> {
    try {
      const { data, error } = await this.supabase
        .from('nlp_intents')
        .select('*')
        .eq('empresa_id', empresaId)
        .eq('active', true);

      if (error) {
        await this.logger.warn('Failed to fetch configured intents', undefined, undefined, { error: error.message });
        return [];
      }

      return data || [];
    } catch (error) {
      await this.logger.error('Error fetching configured intents', undefined, undefined, { error: error.message });
      return [];
    }
  }

  private matchConfiguredIntent(message: string, intents: any[]): NLPResult | null {
    const lowerMessage = message.toLowerCase();
    
    for (const intent of intents) {
      const phrases = intent.training_phrases || [];
      let maxConfidence = 0;
      
      for (const phrase of phrases) {
        const similarity = this.calculateSimilarity(lowerMessage, phrase.toLowerCase());
        maxConfidence = Math.max(maxConfidence, similarity);
      }
      
      if (maxConfidence >= intent.confidence_threshold) {
        return {
          intent: intent.intent_name,
          confidence: maxConfidence,
          parameters: intent.parameters || {},
          targetStage: intent.target_stage,
          shouldOverrideFlow: maxConfidence >= intent.confidence_threshold
        };
      }
    }
    
    return null;
  }

  private calculateSimilarity(str1: string, str2: string): number {
    // Simple similarity calculation based on common words
    const words1 = str1.split(' ').filter(w => w.length > 2);
    const words2 = str2.split(' ').filter(w => w.length > 2);
    
    if (words1.length === 0 || words2.length === 0) {
      return 0;
    }
    
    const commonWords = words1.filter(word => words2.includes(word));
    return commonWords.length / Math.max(words1.length, words2.length);
  }
}
