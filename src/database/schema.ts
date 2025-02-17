import { SerializedLexicalNode } from 'lexical'

import { SUPPORT_EMBEDDING_SIMENTION } from '../constants'
// import { EmbeddingModelId } from '../types/embedding'

// PostgreSQL column types
type ColumnDefinition = {
	type: string
	notNull?: boolean
	primaryKey?: boolean
	defaultRandom?: boolean
	unique?: boolean
	defaultNow?: boolean
	dimensions?: number
}

type TableDefinition = {
	name: string
	columns: Record<string, ColumnDefinition>
	indices?: Record<string, {
		type: string
		columns: string[]
		options?: string
	}>
}

/* Vector Table */
const createVectorTable = (dimension: number): TableDefinition => {
	const tableName = `embeddings_${dimension}`

	const table: TableDefinition = {
		name: tableName,
		columns: {
			id: { type: 'SERIAL', primaryKey: true },
			path: { type: 'TEXT', notNull: true },
			mtime: { type: 'BIGINT', notNull: true },
			content: { type: 'TEXT', notNull: true },
			embedding: { type: 'VECTOR', dimensions: dimension },
			metadata: { type: 'JSONB', notNull: true },
		}
	}

	if (dimension <= 2000) {
		table.indices = {
			[`embeddingIndex_${dimension}`]: {
				type: 'HNSW',
				columns: ['embedding'],
				options: 'vector_cosine_ops'
			}
		}
	}

	return table
}

export const vectorTables = SUPPORT_EMBEDDING_SIMENTION.reduce<
	Record<number, TableDefinition>
>((acc, dimension) => {
	acc[dimension] = createVectorTable(dimension)
	return acc
}, {})

// Type definitions for vector table
export type VectorRecord = {
	id: number
	path: string
	mtime: number
	content: string
	embedding: number[]
	metadata: VectorMetaData
}

export type SelectVector = VectorRecord
export type InsertVector = Omit<VectorRecord, 'id'>

export type VectorMetaData = {
	startLine: number
	endLine: number
}

// // Export individual vector tables for reference
// export const vectorTable0 = vectorTables[EMBEDDING_MODEL_OPTIONS[0].id]
// export const vectorTable1 = vectorTables[EMBEDDING_MODEL_OPTIONS[1].id]
// export const vectorTable2 = vectorTables[EMBEDDING_MODEL_OPTIONS[2].id]
// export const vectorTable3 = vectorTables[EMBEDDING_MODEL_OPTIONS[3].id]
// export const vectorTable4 = vectorTables[EMBEDDING_MODEL_OPTIONS[4].id]
// export const vectorTable5 = vectorTables[EMBEDDING_MODEL_OPTIONS[5].id]

/* Template Table */
export type TemplateContent = {
	nodes: SerializedLexicalNode[]
}

export type TemplateRecord = {
	id: string
	name: string
	content: TemplateContent
	createdAt: Date
	updatedAt: Date
}

export type SelectTemplate = TemplateRecord
export type InsertTemplate = Omit<TemplateRecord, 'id' | 'createdAt' | 'updatedAt'>

export const templateTable: TableDefinition = {
	name: 'template',
	columns: {
		id: { type: 'UUID', primaryKey: true, defaultRandom: true },
		name: { type: 'TEXT', notNull: true, unique: true },
		content: { type: 'JSONB', notNull: true },
		createdAt: { type: 'TIMESTAMP', notNull: true, defaultNow: true },
		updatedAt: { type: 'TIMESTAMP', notNull: true, defaultNow: true }
	}
}

export type Conversation = {
	id: string // uuid
	title: string
	createdAt: Date
	updatedAt: Date
}

export type Message = {
	id: string // uuid
	conversationId: string // uuid
	role: 'user' | 'assistant'
	content: string | null
	promptContent?: string | null
	metadata?: string | null
	mentionables?: string | null
	similaritySearchResults?: string | null
	createdAt: Date
}

export type InsertConversation = {
	id: string
	title: string
	createdAt?: Date
	updatedAt?: Date
}

export type SelectConversation = Conversation

export type InsertMessage = {
	id: string
	conversationId: string
	role: 'user' | 'assistant'
	content: string | null
	promptContent?: string | null
	metadata?: string | null
	mentionables?: string | null
	similaritySearchResults?: string | null
	createdAt?: Date
}

export type SelectMessage = Message
