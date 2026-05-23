<script setup>
import { computed } from 'vue'
import { useChatsStore } from '@/stores/chats.store'
import { useAuthStore } from '@/stores/auth.store'
import OnlineDot from '@/components/shared/OnlineDot.vue'
import { formatChatPreviewTime } from '@/utils/dateFormat'

const props = defineProps({
  chat: { type: Object, required: true },
  active: { type: Boolean, default: false },
})

const chatsStore = useChatsStore()
const auth = useAuthStore()

const isOnline = computed(() => chatsStore.isUserOnline(props.chat.interlocutorId))

const displayName = computed(() => {
  const { interlocutorFirstName, interlocutorLastName, interlocutorUserName } = props.chat
  if (interlocutorFirstName && interlocutorLastName) return `${interlocutorFirstName} ${interlocutorLastName}`
  return interlocutorFirstName || interlocutorUserName || 'Unknown'
})

const initials = computed(() => {
  const name = displayName.value
  const parts = name.split(' ')
  return parts.length >= 2
    ? parts[0][0] + parts[1][0]
    : name.slice(0, 2)
})

const previewText = computed(() => {
  const content = props.chat.lastMessageContent
  if (!content) return 'No messages yet'
  return content.length > 45 ? content.slice(0, 45) + '…' : content
})

const previewTime = computed(() => formatChatPreviewTime(props.chat.lastMessageSentAt))
</script>

<template>
  <div class="chat-item" :class="{ 'chat-item--active': active }">
    <!-- Avatar -->
    <div class="chat-item__avatar">
      <span class="chat-item__initials">{{ initials.toUpperCase() }}</span>
      <OnlineDot :online="isOnline" size="sm" class="chat-item__dot" />
    </div>

    <!-- Info -->
    <div class="chat-item__info">
      <div class="chat-item__row">
        <span class="chat-item__name truncate">{{ displayName }}</span>
        <span v-if="previewTime" class="chat-item__time">{{ previewTime }}</span>
      </div>
      <div class="chat-item__row">
        <span class="chat-item__preview truncate">{{ previewText }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat-item {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-sm) var(--space-md);
  cursor: pointer;
  border-radius: var(--radius-md);
  transition: background-color var(--transition-fast);
  user-select: none;
}
.chat-item:hover {
  background-color: var(--color-bg-hover);
}
.chat-item--active {
  background-color: var(--color-accent);
}
.chat-item--active:hover {
  background-color: var(--color-accent-hover);
}

.chat-item__avatar {
  position: relative;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--color-bg-hover);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.chat-item--active .chat-item__avatar {
  background: rgba(255,255,255,0.15);
}

.chat-item__initials {
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--color-text-primary);
  pointer-events: none;
}

.chat-item__dot {
  position: absolute;
  bottom: 1px;
  right: 1px;
}

.chat-item__info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.chat-item__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-xs);
}

.chat-item__name {
  font-size: var(--font-size-md);
  font-weight: 600;
  color: var(--color-text-primary);
}

.chat-item__time {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  flex-shrink: 0;
}

.chat-item--active .chat-item__name,
.chat-item--active .chat-item__time,
.chat-item--active .chat-item__preview {
  color: rgba(255,255,255,0.9);
}

.chat-item__preview {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}
</style>
