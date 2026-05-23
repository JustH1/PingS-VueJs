import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as chatsApi from '@/api/chats.api'

export const useChatsStore = defineStore('chats', () => {
  /** @type {import('vue').Ref<Map<number, object>>} */
  const chats = ref(new Map())
  const sortedChatIds = ref([])
  const activeChatId = ref(null)
  const onlineUsers = ref(new Set())
  const isLoading = ref(false)

  const sortedChats = computed(() =>
    sortedChatIds.value.map((id) => chats.value.get(id)).filter(Boolean)
  )

  const activeChat = computed(() =>
    activeChatId.value != null ? chats.value.get(activeChatId.value) ?? null : null
  )

  function isUserOnline(userId) {
    return onlineUsers.value.has(Number(userId))
  }

  async function fetchChats() {
    isLoading.value = true
    try {
      const res = await chatsApi.getChats()
      const list = res.data ?? []
      const map = new Map()
      list.forEach((c) => map.set(c.chatId, c))
      chats.value = map
      sortedChatIds.value = list.map((c) => c.chatId)
    } finally {
      isLoading.value = false
    }
  }

  function setActiveChat(chatId) {
    activeChatId.value = chatId
  }

  async function createOrOpenChat(targetUserId) {
    const res = await chatsApi.createChat(targetUserId)
    const { chatId } = res.data
    // Refresh chat list to include the new chat
    await fetchChats()
    setActiveChat(chatId)
    return chatId
  }

  async function clearHistory(chatId) {
    await chatsApi.clearHistory(chatId)
    // Clear messages in messages store
    const { useMessagesStore } = await import('@/stores/messages.store')
    useMessagesStore().clearChatMessages(chatId)
    // Update last message preview in sidebar
    if (chats.value.has(chatId)) {
      const chat = { ...chats.value.get(chatId), lastMessageContent: null, lastMessageSentAt: null }
      chats.value.set(chatId, chat)
    }
  }

  /**
   * Called after any new message to bubble the chat to the top of the sidebar.
   */
  function updateLastMessage(chatId, content, sentAt) {
    const id = Number(chatId)
    if (chats.value.has(id)) {
      const chat = { ...chats.value.get(id), lastMessageContent: content, lastMessageSentAt: sentAt }
      chats.value.set(id, chat)
    }
    // Move to top
    const idx = sortedChatIds.value.indexOf(id)
    if (idx > 0) {
      sortedChatIds.value.splice(idx, 1)
      sortedChatIds.value.unshift(id)
    } else if (idx === -1) {
      sortedChatIds.value.unshift(id)
    }
  }

  function handleUserOnline(event) {
    onlineUsers.value.add(Number(event.userId))
  }

  function handleUserOffline(event) {
    onlineUsers.value.delete(Number(event.userId))
  }

  function $reset() {
    chats.value = new Map()
    sortedChatIds.value = []
    activeChatId.value = null
    onlineUsers.value = new Set()
    isLoading.value = false
  }

  return {
    chats,
    sortedChatIds,
    activeChatId,
    onlineUsers,
    isLoading,
    sortedChats,
    activeChat,
    isUserOnline,
    fetchChats,
    setActiveChat,
    createOrOpenChat,
    clearHistory,
    updateLastMessage,
    handleUserOnline,
    handleUserOffline,
    $reset,
  }
})
