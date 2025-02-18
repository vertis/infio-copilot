import { useCallback, useEffect, useState } from 'react'

import { useDatabase } from '../contexts/DatabaseContext'
import { DBManager } from '../database/database-manager'
import { ChatConversationMeta, ChatMessage } from '../types/chat'

type UseChatHistory = {
  createOrUpdateConversation: (
    id: string,
    messages: ChatMessage[],
  ) => Promise<void>
  deleteConversation: (id: string) => Promise<void>
  getChatMessagesById: (id: string) => Promise<ChatMessage[] | null>
  updateConversationTitle: (id: string, title: string) => Promise<void>
  chatList: ChatConversationMeta[]
}

export function useChatHistory(): UseChatHistory {
  const { getDatabaseManager } = useDatabase()

  // 这里更新有点繁琐, 但是能保持 chatList 实时更新
  const [chatList, setChatList] = useState<ChatConversationMeta[]>([])

  const getManager = useCallback(async (): Promise<DBManager> => {
    return await getDatabaseManager()
  }, [getDatabaseManager])

  const fetchChatList = useCallback(async () => {
    const dbManager = await getManager()
    dbManager.getConversationManager().getAllConversations((conversations) => {
      setChatList(conversations)
    })
  }, [getManager])

  useEffect(() => {
    void fetchChatList()
  }, [fetchChatList])

  // 只新增消息
  const createConversation = useCallback(
    async (id: string, messages: ChatMessage[]): Promise<void> => {
      const dbManager = await getManager()
      const conversationManager = dbManager.getConversationManager()
      await conversationManager.saveConversation(id, messages)
    },
    [getManager],
  )

  const deleteConversation = useCallback(
    async (id: string): Promise<void> => {
      const dbManager = await getManager()
      const conversationManager = dbManager.getConversationManager()
      await conversationManager.deleteConversation(id)
    },
    [getManager],
  )

  const getChatMessagesById = useCallback(
    async (id: string): Promise<ChatMessage[] | null> => {
      const dbManager = await getManager()
      const conversationManager = dbManager.getConversationManager()
      return await conversationManager.findConversation(id)
    },
    [getManager],
  )

  const updateConversationTitle = useCallback(
    async (id: string, title: string): Promise<void> => {
      const dbManager = await getManager()
      const conversationManager = dbManager.getConversationManager()
      await conversationManager.updateConversationTitle(id, title)
    },
    [getManager],
  )

  return {
    createOrUpdateConversation: createConversation,
    deleteConversation,
    getChatMessagesById,
    updateConversationTitle,
    chatList,
  }
}
