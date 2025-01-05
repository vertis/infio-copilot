import { SerializedEditorState } from 'lexical'
import { App } from 'obsidian'

import { editorStateToPlainText } from '../../../components/chat-view/chat-input/utils/editor-state-to-plain-text'
import { ChatAssistantMessage, ChatConversationMeta, ChatMessage, ChatUserMessage } from '../../../types/chat'
import { ContentPart } from '../../../types/llm/request'
import { Mentionable, SerializedMentionable } from '../../../types/mentionable'
import { deserializeMentionable, serializeMentionable } from '../../../utils/mentionable'
import { DBManager } from '../../database-manager'
import { InsertMessage } from '../../schema'

import { ConversationRepository } from './conversation-repository'

export class ConversationManager {
  private app: App
  private repository: ConversationRepository
  private dbManager: DBManager

  constructor(app: App, dbManager: DBManager) {
    this.app = app
    this.dbManager = dbManager
    const db = dbManager.getPgClient()
    if (!db) throw new Error('Database not initialized')
    this.repository = new ConversationRepository(app, db)
  }

  async createConversation(id: string, title = 'New chat'): Promise<void> {
    const conversation = {
      id,
      title,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    await this.repository.create(conversation)
    await this.dbManager.save()
  }

  async saveConversation(id: string, messages: ChatMessage[]): Promise<void> {
    const conversation = await this.repository.findById(id)
    if (!conversation) {
      let title = 'New chat'
      if (messages.length > 0 && messages[0].role === 'user') {
        const query = editorStateToPlainText(messages[0].content)
        if (query.length > 20) {
          title = `${query.slice(0, 20)}...`
        } else {
          title = query
        }
      }
      await this.createConversation(id, title)
    }

    // Delete existing messages
    await this.repository.deleteAllMessagesFromConversation(id)

    // Insert new messages
    for (const message of messages) {
      const insertMessage = this.serializeMessage(message, id)
      await this.repository.createMessage(insertMessage)
    }

    // Update conversation timestamp
    await this.repository.update(id, { updatedAt: new Date() })
    await this.dbManager.save()
  }

  async findConversation(id: string): Promise<ChatMessage[] | null> {
    const conversation = await this.repository.findById(id)
    if (!conversation) {
      return null
    }

    const messages = await this.repository.findMessagesByConversationId(id)
    return messages.map(msg => this.deserializeMessage(msg))
  }

  async deleteConversation(id: string): Promise<void> {
    await this.repository.delete(id)
    await this.dbManager.save()
  }

  getAllConversations(callback: (conversations: ChatConversationMeta[]) => void): void {
    const db = this.dbManager.getPgClient()
    db?.live.query('SELECT * FROM conversations ORDER BY updated_at', [], (results) => {
      callback(results.rows.map(conv => ({
        id: conv.id,
        title: conv.title,
        schemaVersion: 2,
        createdAt: conv.createdAt instanceof Date ? conv.createdAt.getTime() : conv.createdAt,
        updatedAt: conv.updatedAt instanceof Date ? conv.updatedAt.getTime() : conv.updatedAt,
      })))
    })
  }

  async updateConversationTitle(id: string, title: string): Promise<void> {
    await this.repository.update(id, { title })
    await this.dbManager.save()
  }

  private serializeMessage(message: ChatMessage, conversationId: string): InsertMessage {
    const base = {
      id: message.id,
      conversationId,
      role: message.role,
      createdAt: new Date(),
    }

    if (message.role === 'user') {
      const userMessage: ChatUserMessage = message
      return {
        ...base,
        content: userMessage.content ? JSON.stringify(userMessage.content) : null,
        promptContent: userMessage.promptContent
          ? typeof userMessage.promptContent === 'string'
            ? userMessage.promptContent
            : JSON.stringify(userMessage.promptContent)
          : null,
        mentionables: JSON.stringify(userMessage.mentionables.map(serializeMentionable)),
        similaritySearchResults: userMessage.similaritySearchResults
          ? JSON.stringify(userMessage.similaritySearchResults)
          : null,
      }
    } else {
      const assistantMessage: ChatAssistantMessage = message
      return {
        ...base,
        content: assistantMessage.content,
        metadata: assistantMessage.metadata ? JSON.stringify(assistantMessage.metadata) : null,
      }
    }
  }

  private deserializeMessage(message: InsertMessage): ChatMessage {
    if (message.role === 'user') {
      return {
        id: message.id,
        role: 'user',
        content: message.content ? JSON.parse(message.content) as SerializedEditorState : null,
        promptContent: message.promptContent
          ? message.promptContent.startsWith('{')
            ? JSON.parse(message.promptContent) as ContentPart[]
            : message.promptContent
          : null,
        mentionables: message.mentionables
          ? (JSON.parse(message.mentionables) as SerializedMentionable[])
            .map(m => deserializeMentionable(m, this.app))
            .filter((m: Mentionable | null): m is Mentionable => m !== null)
          : [],
        similaritySearchResults: message.similaritySearchResults
          ? JSON.parse(message.similaritySearchResults)
          : undefined,
      }
    } else {
      return {
        id: message.id,
        role: 'assistant',
        content: message.content || '',
        metadata: message.metadata ? JSON.parse(message.metadata) : undefined,
      }
    }
  }
}
