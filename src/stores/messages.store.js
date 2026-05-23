import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as chatsApi from '@/api/chats.api'
import { generateGuid } from '@/utils/guid'
import { getConnection, HubConnectionState } from '@/api/signalr'

export const useMessagesStore = defineStore('messages', () => {
  /** @type {import('vue').Ref<Map<number, object[]>>} */
  const messagesByChatId = ref(new Map())

  /** @type {import('vue').Ref<Map<number, {hasMore: boolean, nextCursor: number|null, isLoading: boolean}>>} */
  const paginationByChatId = ref(new Map())

  /** Currently being edited: { chatId, correlationId, content } */
  const editingMessage = ref(null)

  // ─── helpers ─────────────────────────────────────────────────────────────

  function getMessages(chatId) {
    return messagesByChatId.value.get(Number(chatId)) ?? []
  }

  function _getPagination(chatId) {
    const id = Number(chatId)
    if (!paginationByChatId.value.has(id)) {
      paginationByChatId.value.set(id, { hasMore: true, nextCursor: null, isLoading: false })
    }
    return paginationByChatId.value.get(id)
  }

  /**
   * Returns the active SignalR connection only if it is in the Connected state.
   * Throws a user-friendly error otherwise.
   */
  function _requireConnection() {
    const conn = getConnection()
    if (conn && conn.state === HubConnectionState.Connected) return conn
    const state = conn ? conn.state : 'null'
    throw new Error(`SignalR not connected (state: ${state}). Please wait and try again.`)
  }

  // ─── HTTP actions ─────────────────────────────────────────────────────────

  async function fetchMessages(chatId, cursor = null) {
    const id = Number(chatId)
    const page = _getPagination(id)
    if (page.isLoading) return
    page.isLoading = true
    try {
      const res = await chatsApi.getMessages(id, cursor)
      const { messages, hasMore, nextCursor } = res.data
      page.hasMore = hasMore
      page.nextCursor = nextCursor

      // Normalise: ensure attachment field always exists
      const normalised = messages.map((m) => ({ ...m, attachment: m.attachment ?? null }))

      const existing = messagesByChatId.value.get(id) ?? []
      if (cursor == null) {
        messagesByChatId.value.set(id, normalised)
      } else {
        // Prepend older messages
        messagesByChatId.value.set(id, [...normalised, ...existing])
      }
    } finally {
      page.isLoading = false
    }
  }

  async function loadMore(chatId) {
    const id = Number(chatId)
    const page = _getPagination(id)
    if (!page.hasMore || page.isLoading || page.nextCursor == null) return
    await fetchMessages(id, page.nextCursor)
  }

  // ─── SignalR send actions ─────────────────────────────────────────────────

  /**
   * @param {number} chatId
   * @param {string} content
   * @param {{ fileId: string, fileName: string, fileSize: number, contentType: string }|null} [attachment]
   */
  async function sendMessage(chatId, content, attachment = null) {
    const id = Number(chatId)
    const correlationId = generateGuid()

    const { useAuthStore } = await import('@/stores/auth.store')
    const auth = useAuthStore()

    // Optimistic bubble — shown immediately before server confirms
    const optimistic = {
      messageId: null,
      correlationId,
      senderId: auth.userId,
      senderUserName: auth.currentUser?.userName ?? '',
      senderFirstName: auth.currentUser?.firstName ?? '',
      content,
      sentAt: new Date().toISOString(),
      editedAt: null,
      isPending: true,
      attachment: attachment ?? null,
    }
    const list = messagesByChatId.value.get(id) ?? []
    messagesByChatId.value.set(id, [...list, optimistic])

    const { useChatsStore } = await import('@/stores/chats.store')
    useChatsStore().updateLastMessage(id, content, optimistic.sentAt)

    try {
      const conn = _requireConnection()
      await conn.invoke('SendMessage', {
        chatId: id,
        correlationId,
        content,
        senderUserName: auth.currentUser?.userName ?? '',
        senderFirstName: auth.currentUser?.firstName ?? '',
        fileId: attachment?.fileId ?? null,
        attachmentFileName: attachment?.fileName ?? null,
        attachmentFileSize: attachment?.fileSize ?? null,
        attachmentContentType: attachment?.contentType ?? null,
      })
    } catch (e) {
      // Mark bubble as failed
      const msgs = messagesByChatId.value.get(id) ?? []
      const idx = msgs.findIndex((m) => m.correlationId === correlationId)
      if (idx !== -1) {
        const updated = [...msgs]
        updated[idx] = { ...updated[idx], isFailed: true, isPending: false }
        messagesByChatId.value.set(id, updated)
      }
      const { useUiStore } = await import('@/stores/ui.store')
      useUiStore().showToast(e.message ?? 'Failed to send message', 'error')
    }
  }

  async function editMessage(chatId, correlationId, newContent) {
    try {
      const conn = _requireConnection()
      await conn.invoke('EditMessageInChat', Number(chatId), { correlationId, newContent })
    } catch (e) {
      const { useUiStore } = await import('@/stores/ui.store')
      useUiStore().showToast(e.message ?? 'Failed to edit message', 'error')
      throw e // re-throw so MessageInput can reset its loading state
    }
  }

  async function deleteMessage(chatId, correlationId) {
    try {
      const conn = _requireConnection()
      await conn.invoke('DeleteMessageInChat', Number(chatId), { correlationId })
    } catch (e) {
      const { useUiStore } = await import('@/stores/ui.store')
      useUiStore().showToast(e.message ?? 'Failed to delete message', 'error')
      throw e
    }
  }

  // ─── SignalR event handlers ───────────────────────────────────────────────

  function handleReceiveMessage(event) {
    const chatId = Number(event.chatId)
    const list = messagesByChatId.value.get(chatId) ?? []

    // Confirm our own optimistic message
    const pendingIdx = list.findIndex(
      (m) => m.isPending && m.correlationId === event.correlationId
    )

    if (pendingIdx !== -1) {
      const updated = [...list]
      updated[pendingIdx] = { ...updated[pendingIdx], isPending: false, sentAt: event.sentAt }
      messagesByChatId.value.set(chatId, updated)
    } else {
      // Incoming message from another user (dedup guard)
      const exists = list.some((m) => m.correlationId === event.correlationId)
      if (!exists) {
        const msg = {
          messageId: null,
          correlationId: event.correlationId,
          senderId: Number(event.senderId),
          senderUserName: event.senderUserName,
          senderFirstName: event.senderFirstName,
          content: event.content,
          sentAt: event.sentAt,
          editedAt: null,
          isPending: false,
          attachment: event.attachment ?? null,
        }
        messagesByChatId.value.set(chatId, [...list, msg])
      }
    }

    import('@/stores/chats.store').then(({ useChatsStore }) => {
      useChatsStore().updateLastMessage(chatId, event.content, event.sentAt)
    })
  }

  function handleMessageEdited(event) {
    const chatId = Number(event.chatId)
    const list = messagesByChatId.value.get(chatId)
    if (!list) return
    const idx = list.findIndex((m) => m.correlationId === event.correlationId)
    if (idx !== -1) {
      const updated = [...list]
      updated[idx] = { ...updated[idx], content: event.newContent, editedAt: event.editedAt }
      messagesByChatId.value.set(chatId, updated)
    }
  }

  function handleMessageDeleted(event) {
    const chatId = Number(event.chatId)
    const list = messagesByChatId.value.get(chatId)
    if (!list) return
    messagesByChatId.value.set(
      chatId,
      list.filter((m) => m.correlationId !== event.correlationId)
    )
  }

  // ─── misc ─────────────────────────────────────────────────────────────────

  function clearChatMessages(chatId) {
    const id = Number(chatId)
    messagesByChatId.value.set(id, [])
    paginationByChatId.value.set(id, { hasMore: false, nextCursor: null, isLoading: false })
  }

  function startEditing(message) {
    editingMessage.value = {
      chatId: message.chatId,
      correlationId: message.correlationId,
      content: message.content,
    }
  }

  function cancelEditing() {
    editingMessage.value = null
  }

  function $reset() {
    messagesByChatId.value = new Map()
    paginationByChatId.value = new Map()
    editingMessage.value = null
  }

  return {
    messagesByChatId,
    paginationByChatId,
    editingMessage,
    getMessages,
    fetchMessages,
    loadMore,
    sendMessage,
    handleReceiveMessage,
    editMessage,
    handleMessageEdited,
    deleteMessage,
    handleMessageDeleted,
    clearChatMessages,
    startEditing,
    cancelEditing,
    $reset,
  }
})
