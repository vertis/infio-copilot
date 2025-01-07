import { requestUrl } from 'obsidian'

type OllamaTagsResponse = {
	models: { name: string }[]
}

export async function getOllamaModels(ollamaUrl: string) {
	try {
		const response: OllamaTagsResponse = await requestUrl(`${ollamaUrl}/api/tags`).json
		return response.models.map((model) => model.name)
	} catch (error) {
		return []
	}
}
