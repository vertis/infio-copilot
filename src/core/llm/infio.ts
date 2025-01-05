import OpenAI from 'openai'
import {
	ChatCompletion,
	ChatCompletionChunk,
} from 'openai/resources/chat/completions'

import { CustomLLMModel } from '../../types/llm/model'
import {
	LLMOptions,
	LLMRequestNonStreaming,
	LLMRequestStreaming,
	RequestMessage,
} from '../../types/llm/request'
import {
	LLMResponseNonStreaming,
	LLMResponseStreaming,
} from '../../types/llm/response'

import { BaseLLMProvider } from './base'
import {
	LLMAPIKeyInvalidException,
	LLMAPIKeyNotSetException,
} from './exception'

export interface RangeFilter {
	gte?: number;
	lte?: number;
}

export interface ChunkFilter {
	field: string;
	match_all?: string[];
	range?: RangeFilter;
}

/**
 * Interface for making requests to the Infio API
 */
export interface InfioRequest {
	/** Required: The content of the user message to attach to the topic and then generate an assistant message in response to */
	messages: RequestMessage[];
	// /** Required: The ID of the topic to attach the message to */
	// topic_id: string;
	/** Optional: URLs to include */
	links?: string[];
	/** Optional: Files to include */
	files?: string[];
	/** Optional: Whether to highlight results in chunk_html. Default is true */
	highlight_results?: boolean;
	/** Optional: Delimiters for highlighting citations. Default is [".", "!", "?", "\n", "\t", ","] */
	highlight_delimiters?: string[];
	/** Optional: Search type - "semantic", "fulltext", or "hybrid". Default is "hybrid" */
	search_type?: string;
	/** Optional: Filters for chunk filtering */
	filters?: ChunkFilter;
	/** Optional: Whether to use web search API. Default is false */
	use_web_search?: boolean;
	/** Optional: LLM model to use */
	llm_model?: string;
	/** Optional: Force source */
	force_source?: string;
	/** Optional: Whether completion should come before chunks in stream. Default is false */
	completion_first?: boolean;
	/** Optional: Whether to stream the response. Default is true */
	stream_response?: boolean;
	/** Optional: Sampling temperature between 0 and 2. Default is 0.5 */
	temperature?: number;
	/** Optional: Frequency penalty between -2.0 and 2.0. Default is 0.7 */
	frequency_penalty?: number;
	/** Optional: Presence penalty between -2.0 and 2.0. Default is 0.7 */
	presence_penalty?: number;
	/** Optional: Maximum tokens to generate */
	max_tokens?: number;
	/** Optional: Stop tokens (up to 4 sequences) */
	stop_tokens?: string[];
}

export class InfioProvider implements BaseLLMProvider {
	//   private adapter: OpenAIMessageAdapter
	//   private client: OpenAI
	private apiKey: string
	private baseUrl: string

	constructor(apiKey: string) {
		// this.client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true })
		// this.adapter = new OpenAIMessageAdapter()
		this.apiKey = apiKey
		this.baseUrl = 'https://api.infio.com/api/raw_message'
	}

	async generateResponse(
		model: CustomLLMModel,
		request: LLMRequestNonStreaming,
		options?: LLMOptions,
	): Promise<LLMResponseNonStreaming> {
		if (!this.apiKey) {
			throw new LLMAPIKeyNotSetException(
				'OpenAI API key is missing. Please set it in settings menu.',
			)
		}
		try {
			const req: InfioRequest = {
				messages: request.messages,
				stream_response: false,
				temperature: request.temperature,
				frequency_penalty: request.frequency_penalty,
				presence_penalty: request.presence_penalty,
				max_tokens: request.max_tokens,
			}
			const options = {
				method: 'POST',
				headers: {
					Authorization: this.apiKey,
					"TR-Dataset": "74aaec22-0cf0-4cba-80a5-ae5c0518344e",
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(req)
			};

			const response = await fetch(this.baseUrl, options);
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			const data = await response.json() as ChatCompletion;
			return InfioProvider.parseNonStreamingResponse(data);
		} catch (error) {
			if (error instanceof OpenAI.AuthenticationError) {
				throw new LLMAPIKeyInvalidException(
					'OpenAI API key is invalid. Please update it in settings menu.',
				)
			}
			throw error
		}
	}

	async streamResponse(
		model: CustomLLMModel,
		request: LLMRequestStreaming,
		options?: LLMOptions,
	): Promise<AsyncIterable<LLMResponseStreaming>> {
		if (!this.apiKey) {
			throw new LLMAPIKeyNotSetException(
				'OpenAI API key is missing. Please set it in settings menu.',
			)
		}

		try {
			const req: InfioRequest = {
				llm_model: request.model,
				messages: request.messages,
				stream_response: true,
				temperature: request.temperature,
				frequency_penalty: request.frequency_penalty,
				presence_penalty: request.presence_penalty,
				max_tokens: request.max_tokens,
			}
			const options = {
				method: 'POST',
				headers: {
					Authorization: this.apiKey,
					"TR-Dataset": "74aaec22-0cf0-4cba-80a5-ae5c0518344e",
					"Content-Type": "application/json"
				},
				body: JSON.stringify(req)
			};

			const response = await fetch(this.baseUrl, options);
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			if (!response.body) {
				throw new Error('Response body is null');
			}

			const reader = response.body.getReader();
			const decoder = new TextDecoder();

			return {
				[Symbol.asyncIterator]: async function* () {
					try {
						while (true) {
							const { done, value } = await reader.read();
							if (done) break;

							const chunk = decoder.decode(value);
							const lines = chunk.split('\n').filter(line => line.trim());

							for (const line of lines) {
								if (line.startsWith('data: ')) {
									const jsonData = JSON.parse(line.slice(6)) as ChatCompletionChunk;
									if (!jsonData || typeof jsonData !== 'object' || !('choices' in jsonData)) {
										throw new Error('Invalid chunk format received');
									}
									yield InfioProvider.parseStreamingResponseChunk(jsonData);
								}
							}
						}
					} finally {
						reader.releaseLock();
					}
				}
			};
		} catch (error) {
			if (error instanceof OpenAI.AuthenticationError) {
				throw new LLMAPIKeyInvalidException(
					'OpenAI API key is invalid. Please update it in settings menu.',
				)
			}
			throw error
		}
	}

	static parseNonStreamingResponse(
		response: ChatCompletion,
	): LLMResponseNonStreaming {
		return {
			id: response.id,
			choices: response.choices.map((choice) => ({
				finish_reason: choice.finish_reason,
				message: {
					content: choice.message.content,
					role: choice.message.role,
				},
			})),
			created: response.created,
			model: response.model,
			object: 'chat.completion',
			system_fingerprint: response.system_fingerprint,
			usage: response.usage,
		}
	}

	static parseStreamingResponseChunk(
		chunk: ChatCompletionChunk,
	): LLMResponseStreaming {
		return {
			id: chunk.id,
			choices: chunk.choices.map((choice) => ({
				finish_reason: choice.finish_reason ?? null,
				delta: {
					content: choice.delta.content ?? null,
					role: choice.delta.role,
				},
			})),
			created: chunk.created,
			model: chunk.model,
			object: 'chat.completion.chunk',
			system_fingerprint: chunk.system_fingerprint,
			usage: chunk.usage ?? undefined,
		}
	}
}
