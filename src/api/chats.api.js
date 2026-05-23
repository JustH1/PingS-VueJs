import { chatApi } from './axios'

const TOKEN_KEY = 'pings_token'

/** Get all chats for the current user (sorted by last message). */
export function getChats() {
  return chatApi.get('/api/chats')
}

/**
 * Create a new chat or return existing one with target user.
 * @param {number} targetUserId
 */
export function createChat(targetUserId) {
  return chatApi.post('/api/chats', { targetUserId })
}

/**
 * Get details of a single chat.
 * @param {number} chatId
 */
export function getChatById(chatId) {
  return chatApi.get(`/api/chats/${chatId}`)
}

/**
 * Get paginated messages from a chat.
 * @param {number} chatId
 * @param {number|null} cursor - ID of the last known message (for loading older messages)
 * @param {number} limit
 */
export function getMessages(chatId, cursor = null, limit = 50) {
  const params = { limit }
  if (cursor != null) params.cursor = cursor
  return chatApi.get(`/api/chats/${chatId}/messages`, { params })
}

/**
 * Delete all messages in a chat.
 * @param {number} chatId
 */
export function clearHistory(chatId) {
  return chatApi.delete(`/api/chats/${chatId}/messages`)
}

/**
 * Upload a file to a chat.
 * @param {number} chatId
 * @param {File} file
 * @param {(percent: number) => void} [onProgress]
 */
export function uploadFile(chatId, file, onProgress) {
  const form = new FormData()
  form.append('file', file)
  return chatApi.post(`/api/chats/${chatId}/files`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded * 100) / e.total))
      }
    },
  })
}

/**
 * Build a download URL for a file attachment.
 * Uses ?token=xxx query param so the URL can be used in <img src>.
 * @param {number} chatId
 * @param {string} fileId
 * @returns {string}
 */
export function getFileDownloadUrl(chatId, fileId) {
  const token = localStorage.getItem(TOKEN_KEY) ?? ''
  return `${import.meta.env.VITE_API_URL}/api/chats/${chatId}/files/${fileId}?token=${token}`
}
