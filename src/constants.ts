import { CustomLLMModel } from './types/llm/model'

export const CHAT_VIEW_TYPE = 'infio-chat-view'
export const APPLY_VIEW_TYPE = 'infio-apply-view'

export const DEFAULT_MODELS: CustomLLMModel[] = [
	{
		name: 'claude-3.5-sonnet',
		provider: 'anthropic',
		enabled: true,
		isEmbeddingModel: false,
		isBuiltIn: true,
	},
	{
		name: 'o1-mini',
		provider: 'openai',
		enabled: true,
		isEmbeddingModel: false,
		isBuiltIn: true,
	},
	{
		name: 'o1-preview',
		provider: 'openai',
		enabled: false,
		isEmbeddingModel: false,
		isBuiltIn: true,
	},
	{
		name: 'gpt-4o',
		provider: 'openai',
		enabled: true,
		isEmbeddingModel: false,
		isBuiltIn: true,
	},
	{
		name: 'gpt-4o-mini',
		provider: 'openai',
		enabled: false,
		isEmbeddingModel: false,
		isBuiltIn: true,
	},
	{
		name: 'deepseek-chat',
		provider: 'deepseek',
		enabled: true,
		isEmbeddingModel: false,
		isBuiltIn: true,
	},
	{
		name: 'gemini-1.5-pro',
		provider: 'google',
		enabled: true,
		isEmbeddingModel: false,
		isBuiltIn: true,
	},
	{
		name: 'gemini-2.0-flash-exp',
		provider: 'google',
		enabled: true,
		isEmbeddingModel: false,
		isBuiltIn: true,
	},
	{
		name: 'gemini-2.0-flash-thinking-exp-1219',
		provider: 'google',
		enabled: false,
		isEmbeddingModel: false,
		isBuiltIn: true,
	},
	{
		name: 'llama-3.1-70b-versatile',
		provider: 'groq',
		enabled: true,
		isEmbeddingModel: false,
		isBuiltIn: true,
	},
	{
		name: 'text-embedding-3-small',
		provider: 'openai',
		dimension: 1536,
		enabled: true,
		isEmbeddingModel: true,
		isBuiltIn: true,
	},
	{
		name: 'text-embedding-004',
		provider: 'google',
		dimension: 768,
		enabled: true,
		isEmbeddingModel: true,
		isBuiltIn: true,
	},
	{
		name: 'nomic-embed-text',
		provider: 'ollama',
		dimension: 768,
		enabled: true,
		isEmbeddingModel: true,
		isBuiltIn: true,
	},
	{
		name: 'mxbai-embed-large',
		provider: 'ollama',
		dimension: 1024,
		enabled: true,
		isEmbeddingModel: true,
		isBuiltIn: true,
	},
	{
		name: 'bge-m3',
		provider: 'ollama',
		dimension: 1024,
		enabled: true,
		isEmbeddingModel: true,
		isBuiltIn: true,
	}
]

export const SUPPORT_EMBEDDING_SIMENTION: number[] = [
	384,
	512,
	768,
	1024,
	1536
]

export const DEEPSEEK_BASE_URL = 'https://api.deepseek.com'

// Pricing in dollars per million tokens
type ModelPricing = {
	input: number
	output: number
}

export const OPENAI_PRICES: Record<string, ModelPricing> = {
	'gpt-4o': { input: 2.5, output: 10 },
	'gpt-4o-mini': { input: 0.15, output: 0.6 },
	'deepseek-chat': { input: 0.16, output: 0.32 },
}

export const ANTHROPIC_PRICES: Record<string, ModelPricing> = {
	'claude-3-5-sonnet-latest': { input: 3, output: 15 },
	'claude-3-5-haiku-latest': { input: 1, output: 5 },
}

// Gemini is currently free for low rate limits
export const GEMINI_PRICES: Record<string, ModelPricing> = {
	'gemini-1.5-pro': { input: 0, output: 0 },
	'gemini-1.5-flash': { input: 0, output: 0 },
}

export const GROQ_PRICES: Record<string, ModelPricing> = {
	'llama-3.1-70b-versatile': { input: 0.59, output: 0.79 },
	'llama-3.1-8b-instant': { input: 0.05, output: 0.08 },
}

export const PGLITE_DB_PATH = '.infio_vector_db.tar.gz'
