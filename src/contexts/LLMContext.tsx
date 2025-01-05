import {
	PropsWithChildren,
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from 'react'

import LLMManager from '../core/llm/manager'
import { CustomLLMModel } from '../types/llm/model'
import {
	LLMOptions,
	LLMRequestNonStreaming,
	LLMRequestStreaming,
} from '../types/llm/request'
import {
	LLMResponseNonStreaming,
	LLMResponseStreaming,
} from '../types/llm/response'

import { useSettings } from './SettingsContext'

export type LLMContextType = {
	generateResponse: (
		model: CustomLLMModel,
		request: LLMRequestNonStreaming,
		options?: LLMOptions,
	) => Promise<LLMResponseNonStreaming>
	streamResponse: (
		model: CustomLLMModel,
		request: LLMRequestStreaming,
		options?: LLMOptions,
	) => Promise<AsyncIterable<LLMResponseStreaming>>
	chatModel: CustomLLMModel
	applyModel: CustomLLMModel
}

const LLMContext = createContext<LLMContextType | null>(null)

export function LLMProvider({ children }: PropsWithChildren) {
	const [llmManager, setLLMManager] = useState<LLMManager | null>(null)
	const { settings } = useSettings()

	const chatModel = useMemo((): CustomLLMModel => {
		const model = settings.activeModels.find(
			(option) => option.name === settings.chatModelId,
		)
		if (!model) {
			throw new Error('Invalid chat model ID')
		}
		return model as CustomLLMModel
	}, [settings])

	const applyModel = useMemo((): CustomLLMModel => {
		const model = settings.activeModels.find(
			(option) => option.name === settings.applyModelId,
		)
		if (!model) {
			throw new Error('Invalid apply model ID')
		}
		if (model.provider === 'ollama') {
			return {
				...model,
				baseUrl: settings.ollamaApplyModel.baseUrl,
				name: settings.ollamaApplyModel.model,
			} as CustomLLMModel
		}
		return model as CustomLLMModel
	}, [settings])

	useEffect(() => {
		const manager = new LLMManager({
			deepseek: settings.deepseekApiKey,
			openai: settings.openAIApiKey,
			anthropic: settings.anthropicApiKey,
			gemini: settings.geminiApiKey,
			groq: settings.groqApiKey,
			infio: settings.infioApiKey,
		})
		setLLMManager(manager)
	}, [
		settings.deepseekApiKey,
		settings.openAIApiKey,
		settings.anthropicApiKey,
		settings.geminiApiKey,
		settings.groqApiKey,
		settings.infioApiKey,
	])

	const generateResponse = useCallback(
		async (
			model: CustomLLMModel,
			request: LLMRequestNonStreaming,
			options?: LLMOptions,
		) => {
			if (!llmManager) {
				throw new Error('LLMManager is not initialized')
			}
			return await llmManager.generateResponse(model, request, options)
		},
		[llmManager],
	)

	const streamResponse = useCallback(
		async (
			model: CustomLLMModel,
			request: LLMRequestStreaming,
			options?: LLMOptions,
		) => {
			if (!llmManager) {
				throw new Error('LLMManager is not initialized')
			}
			return await llmManager.streamResponse(model, request, options)
		},
		[llmManager],
	)

	return (
		<LLMContext.Provider
			value={{ generateResponse, streamResponse, chatModel, applyModel }}
		>
			{children}
		</LLMContext.Provider>
	)
}

export function useLLM() {
	const context = useContext(LLMContext)
	if (!context) {
		throw new Error('useLLM must be used within an LLMProvider')
	}
	return context
}
