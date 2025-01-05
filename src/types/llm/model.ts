// Model Providers
export enum ModelProviders {
  OPENAI = "openai",
  ANTHROPIC = "anthropic",
  GOOGLE = "google",
  GROQ = "groq",
  deepseek = "deepseek",
  Ollama = "ollama",
}

export type CustomLLMModel = {
  name: string;
  provider: string;
  baseUrl?: string;
  apiKey?: string;
  enabled: boolean;
  isEmbeddingModel: boolean;
  isBuiltIn: boolean;
  dimension?: number;
}
