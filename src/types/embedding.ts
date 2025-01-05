import { CustomLLMModel } from './llm/model'

export type EmbeddingModelId =
  | 'text-embedding-3-small'
  | 'text-embedding-004'
  | 'nomic-embed-text'
  | 'mxbai-embed-large'
  | 'bge-m3'

export type EmbeddingModelOption = {
  id: EmbeddingModelId
  name: string
  model: CustomLLMModel
  dimension: number
}

export type EmbeddingModel = {
  id: EmbeddingModelId
  dimension: number
  getEmbedding: (text: string) => Promise<number[]>
}
