// TEMPORARILY DISABLED TO FIX BUILD ERRORS
// This service is disabled while we fix the hooks issue in AtendimentosListReal

export class EvolutionAPIServiceV2 {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  // Placeholder methods
  async getInstance() {
    return { success: false, message: "Service temporarily disabled" };
  }

  async sendMessage() {
    return { success: false, message: "Service temporarily disabled" };
  }
}

export default EvolutionAPIServiceV2;
