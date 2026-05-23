<script setup>
import { computed } from 'vue'
import { useChatsStore } from '@/stores/chats.store'
import { useUiStore } from '@/stores/ui.store'
import OnlineDot from '@/components/shared/OnlineDot.vue'

const chatsStore = useChatsStore()
const ui = useUiStore()

const chat = computed(() => chatsStore.activeChat)

const displayName = computed(() => {
  if (!chat.value) return ''
  const { interlocutorFirstName, interlocutorLastName, interlocutorUserName } = chat.value
  if (interlocutorFirstName && interlocutorLastName) return `${interlocutorFirstName} ${interlocutorLastName}`
  return interlocutorFirstName || interlocutorUserName || 'Unknown'
})

const isOnline = computed(() =>
  chat.value ? chatsStore.isUserOnline(chat.value.interlocutorId) : false
)

function openClearConfirm() {
  ui.openModal('confirm', {
    title: 'Clear chat history',
    message: 'All messages in this chat will be permanently deleted. Are you sure?',
    confirmText: 'Clear',
    danger: true,
    onConfirm: async () => {
      await chatsStore.clearHistory(chatsStore.activeChatId)
      ui.showToast('Chat history cleared', 'success')
    },
  })
}

function toggleMobileSidebar() {
  ui.toggleMobileSidebar()
}
</script>

<template>
  <header class="chat-header">
    <!-- Mobile hamburger -->
    <button class="icon-btn chat-header__back" title="Back" @click="toggleMobileSidebar">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="3" y1="6" x2="21" y2="6"/>
        <line x1="3" y1="12" x2="21" y2="12"/>
        <line x1="3" y1="18" x2="21" y2="18"/>
      </svg>
    </button>

    <!-- Interlocutor info -->
    <div class="chat-header__info">
      <span class="chat-header__name">{{ displayName }}</span>
      <div class="chat-header__status">
        <OnlineDot :online="isOnline" size="sm" />
        <span class="chat-header__status-text">{{ isOnline ? 'Online' : 'Offline' }}</span>
      </div>
    </div>

    <!-- Actions -->
    <div class="chat-header__actions">
      <button class="icon-btn" title="Clear history" @click="openClearConfirm">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
          <path d="M10 11v6"/>
          <path d="M14 11v6"/>
          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
        </svg>
      </button>
    </div>
  </header>
</template>

<style scoped>
.chat-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  height: var(--header-height);
  padding: 0 var(--space-lg);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-secondary);
  flex-shrink: 0;
}

.chat-header__back {
  display: none;
}

.chat-header__info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.chat-header__name {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-text-primary);
  truncate: true;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chat-header__status {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.chat-header__status-text {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.chat-header__actions {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

@media (max-width: 768px) {
  .chat-header__back {
    display: inline-flex;
  }
}
</style>
