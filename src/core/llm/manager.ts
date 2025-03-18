import { ALIBABA_QWEN_BASE_URL, DEEPSEEK_BASE_URL, OPENROUTER_BASE_URL, SILICONFLOW_BASE_URL } from '../../constants'
import { ApiProvider, LLMModel } from '../../types/llm/model'
import {
	LLMOptions,
	LLMRequestNonStreaming,
	LLMRequestStreaming,
} from '../../types/llm/request'
import {
	LLMResponseNonStreaming,
	LLMResponseStreaming,
} from '../../types/llm/response'
import { InfioSettings } from '../../types/settings'

import { AnthropicProvider } from './anthropic'
import { GeminiProvider } from './gemini'
import { GroqProvider } from './groq'
import { InfioProvider } from './infio'
import { OllamaProvider } from './ollama'
import { OpenAIAuthenticatedProvider } from './openai'
import { OpenAICompatibleProvider } from './openai-compatible-provider'


export type LLMManagerInterface = {
	generateResponse(
		model: LLMModel,
		request: LLMRequestNonStreaming,
		options?: LLMOptions,
	): Promise<LLMResponseNonStreaming>
	streamResponse(
		model: LLMModel,
		request: LLMRequestStreaming,
		options?: LLMOptions,
	): Promise<AsyncIterable<LLMResponseStreaming>>
}

class LLMManager implements LLMManagerInterface {
	private openaiProvider: OpenAIAuthenticatedProvider
	private deepseekProvider: OpenAICompatibleProvider
	private anthropicProvider: AnthropicProvider
	private googleProvider: GeminiProvider
	private groqProvider: GroqProvider
	private infioProvider: InfioProvider
	private openrouterProvider: OpenAICompatibleProvider
	private siliconflowProvider: OpenAICompatibleProvider
	private alibabaQwenProvider: OpenAICompatibleProvider
	private ollamaProvider: OllamaProvider
	private openaiCompatibleProvider: OpenAICompatibleProvider
	private isInfioEnabled: boolean

	constructor(settings: InfioSettings) {
		this.infioProvider = new InfioProvider(settings.infioProvider.apiKey)
		this.openrouterProvider = new OpenAICompatibleProvider(settings.openrouterProvider.apiKey, OPENROUTER_BASE_URL)
		this.siliconflowProvider = new OpenAICompatibleProvider(settings.siliconflowProvider.apiKey, SILICONFLOW_BASE_URL)
		this.alibabaQwenProvider = new OpenAICompatibleProvider(settings.alibabaQwenProvider.apiKey, ALIBABA_QWEN_BASE_URL)
		this.deepseekProvider = new OpenAICompatibleProvider(settings.deepseekProvider.apiKey, DEEPSEEK_BASE_URL)
		this.openaiProvider = new OpenAIAuthenticatedProvider(settings.openaiProvider.apiKey)
		this.anthropicProvider = new AnthropicProvider(settings.anthropicProvider.apiKey)
		this.googleProvider = new GeminiProvider(settings.googleProvider.apiKey)
		this.groqProvider = new GroqProvider(settings.groqProvider.apiKey)
		this.ollamaProvider = new OllamaProvider(settings.groqProvider.baseUrl)
		this.openaiCompatibleProvider = new OpenAICompatibleProvider(settings.openaicompatibleProvider.apiKey, settings.openaicompatibleProvider.baseUrl)
		this.isInfioEnabled = !!settings.infioProvider.apiKey
	}

	async generateResponse(
		model: LLMModel,
		request: LLMRequestNonStreaming,
		options?: LLMOptions,
	): Promise<LLMResponseNonStreaming> {
		if (this.isInfioEnabled) {
			return await this.infioProvider.generateResponse(
				model,
				request,
			)
		}
		// use custom provider
		switch (model.provider) {
			case ApiProvider.OpenRouter:
				return await this.openrouterProvider.generateResponse(
					model,
					request,
					options,
				)
			case ApiProvider.SiliconFlow:
				return await this.siliconflowProvider.generateResponse(
					model,
					request,
					options,
				)
			case ApiProvider.AlibabaQwen:
				return await this.alibabaQwenProvider.generateResponse(
					model,
					request,
					options,
				)
			case ApiProvider.Deepseek:
				return await this.deepseekProvider.generateResponse(
					model,
					request,
					options,
				)
			case ApiProvider.OpenAI:
				return await this.openaiProvider.generateResponse(
					model,
					request,
					options,
				)
			case ApiProvider.Anthropic:
				return await this.anthropicProvider.generateResponse(
					model,
					request,
					options,
				)
			case ApiProvider.Google:
				return await this.googleProvider.generateResponse(
					model,
					request,
					options,
				)
			case ApiProvider.Groq:
				return await this.groqProvider.generateResponse(model, request, options)
			case ApiProvider.Ollama:
				return await this.ollamaProvider.generateResponse(
					model,
					request,
					options,
				)
			default:
				throw new Error(`Unsupported model provider: ${model.provider}`)
		}
	}

	async streamResponse(
		model: LLMModel,
		request: LLMRequestStreaming,
		options?: LLMOptions,
	): Promise<AsyncIterable<LLMResponseStreaming>> {
		if (this.isInfioEnabled) {
			return await this.infioProvider.streamResponse(model, request)
		}
		// use custom provider
		switch (model.provider) {
			case ApiProvider.OpenRouter:
				return await this.openrouterProvider.streamResponse(model, request, options)
			case ApiProvider.SiliconFlow:
				return await this.siliconflowProvider.streamResponse(model, request, options)
			case ApiProvider.AlibabaQwen:
				return await this.alibabaQwenProvider.streamResponse(model, request, options)
			case ApiProvider.Deepseek:
				return await this.deepseekProvider.streamResponse(model, request, options)
			case ApiProvider.OpenAI:
				return await this.openaiProvider.streamResponse(model, request, options)
			case ApiProvider.Anthropic:
				return await this.anthropicProvider.streamResponse(
					model,
					request,
					options,
				)
			case ApiProvider.Google:
				return await this.googleProvider.streamResponse(model, request, options)
			case ApiProvider.Groq:
				return await this.groqProvider.streamResponse(model, request, options)
			case ApiProvider.Ollama:
				return await this.ollamaProvider.streamResponse(model, request, options)
			case ApiProvider.OpenAICompatible:
				return await this.openaiCompatibleProvider.streamResponse(model, request, options)
		}
	}
}

export default LLMManager
