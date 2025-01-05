import { PGliteInterface } from '@electric-sql/pglite'
import { App } from 'obsidian'

import {
  InsertConversation,
  InsertMessage,
  SelectConversation,
  SelectMessage,
} from '../../schema'

type QueryResult<T> = {
  rows: T[]
}

export class ConversationRepository {
  private app: App
  private db: PGliteInterface

  constructor(app: App, db: PGliteInterface) {
    this.app = app
    this.db = db
  }

  async create(conversation: InsertConversation): Promise<SelectConversation> {
    const result = await this.db.query<SelectConversation>(
      `INSERT INTO conversations (id, title, created_at, updated_at)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [
        conversation.id,
        conversation.title,
        conversation.createdAt || new Date(),
        conversation.updatedAt || new Date()
      ]
    ) as QueryResult<SelectConversation>
    return result.rows[0]
  }

  async createMessage(message: InsertMessage): Promise<SelectMessage> {
    const result = await this.db.query<SelectMessage>(
      `INSERT INTO messages (
        id, conversation_id, role, content, 
        prompt_content, metadata, mentionables, 
        similarity_search_results, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        message.id,
        message.conversationId,
        message.role,
        message.content,
        message.promptContent,
        message.metadata,
        message.mentionables,
        message.similaritySearchResults,
        message.createdAt || new Date()
      ]
    ) as QueryResult<SelectMessage>
    return result.rows[0]
  }

  async findById(id: string): Promise<SelectConversation | undefined> {
    const result = await this.db.query<SelectConversation>(
      `SELECT * FROM conversations WHERE id = $1 LIMIT 1`,
      [id]
    ) as QueryResult<SelectConversation>
    return result.rows[0]
  }

  async findMessagesByConversationId(conversationId: string): Promise<SelectMessage[]> {
    const result = await this.db.query<SelectMessage>(
      `SELECT * FROM messages 
       WHERE conversation_id = $1 
       ORDER BY created_at`,
      [conversationId]
    ) as QueryResult<SelectMessage>
    return result.rows
  }

  async findAll(): Promise<SelectConversation[]> {
    const result = await this.db.query<SelectConversation>(
      `SELECT * FROM conversations ORDER BY updated_at DESC`
    ) as QueryResult<SelectConversation>
    return result.rows
  }

  async update(id: string, data: Partial<InsertConversation>): Promise<SelectConversation> {
    const setClauses: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (data.title !== undefined) {
      setClauses.push(`title = $${paramIndex}`)
      values.push(data.title)
      paramIndex++
    }

    // Always update updated_at
    setClauses.push(`updated_at = $${paramIndex}`)
    values.push(new Date())
    paramIndex++

    // Add id as the last parameter
    values.push(id)

    const result = await this.db.query<SelectConversation>(
      `UPDATE conversations 
       SET ${setClauses.join(', ')} 
       WHERE id = $${paramIndex}
       RETURNING *`,
      values
    ) as QueryResult<SelectConversation>
    return result.rows[0]
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.query<SelectConversation>(
      `DELETE FROM conversations WHERE id = $1 RETURNING *`,
      [id]
    ) as QueryResult<SelectConversation>
    return result.rows.length > 0
  }

  async deleteAllMessagesFromConversation(conversationId: string): Promise<void> {
    await this.db.query(
      `DELETE FROM messages WHERE conversation_id = $1`,
      [conversationId]
    )
  }
}
