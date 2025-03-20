import { App, TFile } from 'obsidian'

import { QueryProgressState } from '../../components/chat-view/QueryProgress'
import { DBManager } from '../../database/database-manager'
import { VectorManager } from '../../database/modules/vector/vector-manager'
import { SelectVector } from '../../database/schema'
import { EmbeddingModel } from '../../types/embedding'
import { InfioSettings } from '../../types/settings'

import { getEmbeddingModel } from './embedding'

export class RAGEngine {
  private app: App
  private settings: InfioSettings
  private vectorManager: VectorManager
	private embeddingModel: EmbeddingModel | null = null
	private initialized = false

  constructor(
    app: App,
    settings: InfioSettings,
    dbManager: DBManager,
  ) {
    this.app = app
    this.settings = settings
    this.vectorManager = dbManager.getVectorManager()
		this.embeddingModel = getEmbeddingModel(settings)
  }

  setSettings(settings: InfioSettings) {
    this.settings = settings
    this.embeddingModel = getEmbeddingModel(settings)
  }

  // TODO: Implement automatic vault re-indexing when settings are changed.
  // Currently, users must manually re-index the vault.
  async updateVaultIndex(
    options: { reindexAll: boolean },
    onQueryProgressChange?: (queryProgress: QueryProgressState) => void,
	): Promise<void> {
		if (!this.embeddingModel) {
			throw new Error('Embedding model is not set')
    }
    await this.vectorManager.updateVaultIndex(
			this.embeddingModel,
      {
        chunkSize: this.settings.ragOptions.chunkSize,
        excludePatterns: this.settings.ragOptions.excludePatterns,
        includePatterns: this.settings.ragOptions.includePatterns,
        reindexAll: options.reindexAll,
      },
      (indexProgress) => {
        onQueryProgressChange?.({
          type: 'indexing',
          indexProgress,
        })
      },
    )
		this.initialized = true
	}

  async updateFileIndex(file: TFile) {
    await this.vectorManager.UpdateFileVectorIndex(
      this.embeddingModel,
      this.settings.ragOptions.chunkSize,
      file,
    )
	}
	
	async deleteFileIndex(file: TFile) {
		await this.vectorManager.DeleteFileVectorIndex(
			this.embeddingModel,
			file,
		)
	}

  async processQuery({
    query,
    scope,
    onQueryProgressChange,
  }: {
    query: string
    scope?: {
      files: string[]
      folders: string[]
    }
    onQueryProgressChange?: (queryProgress: QueryProgressState) => void
  }): Promise<
    (Omit<SelectVector, 'embedding'> & {
      similarity: number
    })[]
  > {
    if (!this.embeddingModel) {
      throw new Error('Embedding model is not set')
    }

		if (!this.initialized) {
      await this.updateVaultIndex({ reindexAll: false }, onQueryProgressChange)
    }
    const queryEmbedding = await this.getEmbedding(query)
    onQueryProgressChange?.({
      type: 'querying',
		})
		console.log('query, ', {
			minSimilarity: this.settings.ragOptions.minSimilarity,
			limit: this.settings.ragOptions.limit,
			scope,
		})
    const queryResult = await this.vectorManager.performSimilaritySearch(
      queryEmbedding,
      this.embeddingModel,
      {
        minSimilarity: this.settings.ragOptions.minSimilarity,
        limit: this.settings.ragOptions.limit,
        scope,
      },
		)
		console.log('queryResult', queryResult)
    onQueryProgressChange?.({
      type: 'querying-done',
      queryResult,
    })
    return queryResult
  }

  async getEmbedding(query: string): Promise<number[]> {
    if (!this.embeddingModel) {
      throw new Error('Embedding model is not set')
    }
    return this.embeddingModel.getEmbedding(query)
  }
}
