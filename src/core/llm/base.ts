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

export type BaseLLMProvider = {
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
