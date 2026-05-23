<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { useMessagesStore } from '@/stores/messages.store'
import { useAuthStore } from '@/stores/auth.store'
import { useInfiniteScroll } from '@/composables/useInfiniteScroll'
import { isDifferentDay, formatDateSeparator } from '@/utils/dateFormat'
import MessageBubble from './MessageBubble.vue'
import AppSpinner from '@/components/shared/AppSpinner.vue'

const props = defineProps({
  chatId: { type: Number, required: true },
})

const messagesStore = useMessagesStore()
const auth = useAuthStore()

const listEl = ref(null)
const sentinel = ref(null)
const initialLoaded = ref(false)

const messages = computed(() => messagesStore.getMessages(props.chatId))
const pagination = computed(() => messagesStore.paginationByChatId.get(props.chatId) ?? { hasMore: false, isLoading: false })

/** Build a list of items with optional date separators inserted between groups */
const items = computed(() => {
  const result = []
  messages.value.forEach((msg, i) => {
    const prev = messages.value[i - 1]
    if (!prev || isDifferentDay(prev.sentAt, msg.sentAt)) {
      result.push({ type: 'separator', key: 'sep-' + msg.sentAt, label: formatDateSeparator(msg.sentAt) })
    }
    result.push({ type: 'message', key: msg.correlationId, msg })
  })
  return result
})

const canLoadMore = computed(() => pagination.value.hasMore && !pagination.value.isLoading)

// Infinite scroll sentinel
useInfiniteScroll(sentinel, () => messagesStore.loadMore(props.chatId), canLoadMore)

// Scroll helpers
function isNearBottom() {
  if (!listEl.value) return true
  const { scrollTop, scrollHeight, clientHeight } = listEl.value
  return scrollHeight - scrollTop - clientHeight < 120
}

async function scrollToBottom(smooth = false) {
  await nextTick()
  if (listEl.value) {
    listEl.value.scrollTop = listEl.value.scrollHeight
  }
}

// On chat open — load messages and scroll to bottom
onMounted(async () => {
  await messagesStore.fetchMessages(props.chatId)
  await scrollToBottom()
  initialLoaded.value = true
})

// When new messages arrive (list grows at bottom) — auto-scroll if near bottom
watch(
  () => messages.value.length,
  async (newLen, oldLen) => {
    if (!initialLoaded.value) return
    // Appended at the end (new message)
    const appended = newLen > oldLen
    if (appended && isNearBottom()) {
      await scrollToBottom()
    }
  }
)
</script>

<template>
  <div class="message-list" ref="listEl">
    <!-- Load more sentinel (top) -->
    <div ref="sentinel" class="message-list__sentinel">
      <AppSpinner v-if="pagination.isLoading" size="sm" />
    </div>

    <!-- Messages and date separators -->
    <TransitionGroup name="msg" tag="div" class="message-list__inner">
      <template v-for="item in items" :key="item.key">
        <!-- Date separator -->
        <div v-if="item.type === 'separator'" class="message-list__separator">
          <span>{{ item.label }}</span>
        </div>

        <!-- Message bubble -->
        <MessageBubble
          v-else
          :message="item.msg"
          :is-own="Number(item.msg.senderId) === Number(auth.userId)"
          :chat-id="chatId"
        />
      </template>
    </TransitionGroup>

    <div v-if="messages.length === 0 && !pagination.isLoading" class="message-list__no-messages">
      No messages yet. Say hello! 👋
    </div>
  </div>
</template>

<style scoped>
.message-list {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  scroll-behavior: smooth;
}

.message-list__sentinel {
  display: flex;
  justify-content: center;
  padding: var(--space-sm) 0;
  min-height: 24px;
}

.message-list__inner {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.message-list__separator {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: var(--space-md) 0;
}

.message-list__separator span {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  background: var(--color-bg-tertiary);
  padding: 2px var(--space-md);
  border-radius: var(--radius-full);
}

.message-list__no-messages {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

/* Message appear animation */
.msg-enter-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.msg-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
</style>
