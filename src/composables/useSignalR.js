import { buildConnection, startConnection, stopConnection } from '@/api/signalr'
import { useAuthStore } from '@/stores/auth.store'
import { useChatsStore } from '@/stores/chats.store'
import { useMessagesStore } from '@/stores/messages.store'
import { useUiStore } from '@/stores/ui.store'

export function useSignalR() {
  async function connect() {
    const auth = useAuthStore()
    if (!auth.token) return

    const chatsStore = useChatsStore()
    const messagesStore = useMessagesStore()
    const ui = useUiStore()

    // buildConnection() создаёт НОВЫЙ объект соединения каждый раз —
    // обработчики нужно вешать именно на него, а не проверять флаг.
    const conn = buildConnection(auth.token)

    conn.on('ReceiveMessage',  (e) => messagesStore.handleReceiveMessage(e))
    conn.on('MessageEdited',   (e) => messagesStore.handleMessageEdited(e))
    conn.on('MessageDeleted',  (e) => messagesStore.handleMessageDeleted(e))
    conn.on('UserOnline',      (e) => chatsStore.handleUserOnline(e))
    conn.on('UserOffline',     (e) => chatsStore.handleUserOffline(e))

    conn.onreconnected(async () => {
      ui.showToast('Reconnected', 'success', 2000)
      await chatsStore.fetchChats()
    })

    conn.onclose(() => {
      ui.showToast('Connection lost. Reconnecting…', 'error', 5000)
    })

    try {
      await startConnection()
    } catch (e) {
      console.error('SignalR connect failed:', e)
      ui.showToast('Real-time connection failed', 'error')
    }
  }

  async function disconnect() {
    await stopConnection()
  }

  return { connect, disconnect }
}
