import { DEEPSEEK_BASE_URL } from '../../constants'
import { CustomLLMModel } from '../../types/llm/model'
import {
  LLMOptions,
  LLMRequestNonStreaming,
  LLMRequestStreaming,
} from '../../types/llm/request'
import {
  LLMResponseNonStreaming,
  LLMResponseStreaming,
} from '../../types/llm/response'

import { AnthropicProvider } from './anthropic'
import { GeminiProvider } from './gemini'
import { GroqProvider } from './groq'
import { InfioProvider } from './infio'
import { OllamaProvider } from './ollama'
import { OpenAIAuthenticatedProvider } from './openai'
import { OpenAICompatibleProvider } from './openai-compatible-provider'


export type LLMManagerInterface = {
  generateResponse(
    model: CustomLLMModel,
    request: LLMRequestNonStreaming,
    options?: LLMOptions,
  ): Promise<LLMResponseNonStreaming>
  streamResponse(
    model: CustomLLMModel,
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
  private ollamaProvider: OllamaProvider
  private isInfioEnabled: boolean

  constructor(apiKeys: {
    deepseek?: string
    openai?: string
    anthropic?: string
    gemini?: string
    groq?: string
    infio?: string
  }) {
    this.deepseekProvider = new OpenAICompatibleProvider(apiKeys.deepseek ?? '', DEEPSEEK_BASE_URL)
    this.openaiProvider = new OpenAIAuthenticatedProvider(apiKeys.openai ?? '')
    this.anthropicProvider = new AnthropicProvider(apiKeys.anthropic ?? '')
    this.googleProvider = new GeminiProvider(apiKeys.gemini ?? '')
    this.groqProvider = new GroqProvider(apiKeys.groq ?? '')
    this.infioProvider = new InfioProvider(apiKeys.infio ?? '')
    this.ollamaProvider = new OllamaProvider()
    this.isInfioEnabled = !!apiKeys.infio
  }

  async generateResponse(
    model: CustomLLMModel,
    request: LLMRequestNonStreaming,
    options?: LLMOptions,
  ): Promise<LLMResponseNonStreaming> {
    if (this.isInfioEnabled) {
      return await this.infioProvider.generateResponse(
        model,
        request,
        options,
      )
    }
    // use custom provider
    switch (model.provider) {
      case 'deepseek':
        return await this.deepseekProvider.generateResponse(
          model,
          request,
          options,
        )
      case 'openai':
        return await this.openaiProvider.generateResponse(
          model,
          request,
          options,
        )
      case 'anthropic':
        return await this.anthropicProvider.generateResponse(
          model,
          request,
          options,
        )
      case 'google':
        return await this.googleProvider.generateResponse(
          model,
          request,
          options,
        )
      case 'groq':
        return await this.groqProvider.generateResponse(model, request, options)
      case 'ollama':
        return await this.ollamaProvider.generateResponse(
          model,
          request,
          options,
        )
    }
  }

  async streamResponse(
    model: CustomLLMModel,
    request: LLMRequestStreaming,
    options?: LLMOptions,
  ): Promise<AsyncIterable<LLMResponseStreaming>> {
    if (this.isInfioEnabled) {
      return await this.infioProvider.streamResponse(model, request, options)
    }
    // use custom provider
    switch (model.provider) {
      case 'deepseek':
        return await this.deepseekProvider.streamResponse(model, request, options)
      case 'openai':
        return await this.openaiProvider.streamResponse(model, request, options)
      case 'anthropic':
        return await this.anthropicProvider.streamResponse(
          model,
          request,
          options,
        )
      case 'google':
        return await this.googleProvider.streamResponse(model, request, options)
      case 'groq':
        return await this.groqProvider.streamResponse(model, request, options)
      case 'ollama':
        return await this.ollamaProvider.streamResponse(model, request, options)
    }
  }
}

export default LLMManager
