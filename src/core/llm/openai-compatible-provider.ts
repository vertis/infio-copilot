import OpenAI from 'openai'

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

import { BaseLLMProvider } from './base'
import { LLMBaseUrlNotSetException } from './exception'
import { OpenAIMessageAdapter } from './openai-message-adapter'

export class OpenAICompatibleProvider implements BaseLLMProvider {
  private adapter: OpenAIMessageAdapter
  private client: OpenAI
  private apiKey: string
  private baseURL: string

  constructor(apiKey: string, baseURL: string) {
    this.adapter = new OpenAIMessageAdapter()
    this.client = new OpenAI({
      apiKey: apiKey,
      baseURL: baseURL,
      dangerouslyAllowBrowser: true,
    })
    this.apiKey = apiKey
    this.baseURL = baseURL
  }

  async generateResponse(
    model: CustomLLMModel,
    request: LLMRequestNonStreaming,
    options?: LLMOptions,
  ): Promise<LLMResponseNonStreaming> {
    if (!this.baseURL || !this.apiKey) {
      throw new LLMBaseUrlNotSetException(
        'OpenAI Compatible base URL or API key is missing. Please set it in settings menu.',
      )
    }

    return this.adapter.generateResponse(this.client, request, options)
  }

  async streamResponse(
    model: CustomLLMModel,
    request: LLMRequestStreaming,
    options?: LLMOptions,
  ): Promise<AsyncIterable<LLMResponseStreaming>> {
    if (!this.baseURL || !this.apiKey) {
      throw new LLMBaseUrlNotSetException(
        'OpenAI Compatible base URL or API key is missing. Please set it in settings menu.',
      )
    }

    return this.adapter.streamResponse(this.client, request, options)
  }
}
