<script setup>
import { computed } from 'vue'
import { useMessagesStore } from '@/stores/messages.store'
import { useUiStore } from '@/stores/ui.store'
import { getFileDownloadUrl } from '@/api/chats.api'
import { formatMessageTime } from '@/utils/dateFormat'

const props = defineProps({
  message: { type: Object, required: true },
  isOwn: { type: Boolean, default: false },
  chatId: { type: Number, required: true },
})

const messagesStore = useMessagesStore()
const ui = useUiStore()

const timeLabel = computed(() => formatMessageTime(props.message.sentAt))
const isEdited = computed(() => !!props.message.editedAt)

const attachment = computed(() => props.message.attachment ?? null)

/** True when the content is just a file-only placeholder like "📎 filename" */
const hideContent = computed(() =>
  attachment.value != null && props.message.content?.startsWith('📎')
)

const isImage = computed(() =>
  attachment.value?.contentType?.startsWith('image/') ?? false
)

const downloadUrl = computed(() =>
  attachment.value
    ? getFileDownloadUrl(props.chatId, attachment.value.fileId)
    : null
)

function formatBytes(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function handleEdit() {
  messagesStore.startEditing({ ...props.message, chatId: props.chatId })
}

async function handleDelete() {
  ui.openModal('confirm', {
    title: 'Delete message',
    message: 'This message will be deleted for everyone. Continue?',
    confirmText: 'Delete',
    danger: true,
    onConfirm: async () => {
      await messagesStore.deleteMessage(props.chatId, props.message.correlationId)
    },
  })
}
</script>

<template>
  <div class="bubble-wrapper" :class="{ 'bubble-wrapper--own': isOwn }">
    <!-- Sender name (only for other's messages) -->
    <span v-if="!isOwn" class="bubble__sender">{{ message.senderFirstName }}</span>

    <div class="bubble" :class="{
      'bubble--own': isOwn,
      'bubble--pending': message.isPending,
      'bubble--failed': message.isFailed,
    }">

      <!-- ── File attachment ─────────────────────────────────────────────── -->
      <div v-if="attachment" class="bubble__attachment">
        <!-- Image -->
        <template v-if="isImage">
          <a :href="downloadUrl" target="_blank" rel="noopener">
            <img
              class="bubble__image"
              :src="downloadUrl"
              :alt="attachment.fileName"
              loading="lazy"
            />
          </a>
        </template>

        <!-- Non-image file -->
        <template v-else>
          <div class="bubble__file">
            <svg class="bubble__file-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            <div class="bubble__file-info">
              <span class="bubble__file-name">{{ attachment.fileName }}</span>
              <span class="bubble__file-size">{{ formatBytes(attachment.fileSize) }}</span>
            </div>
            <a
              class="bubble__file-download"
              :href="downloadUrl"
              :download="attachment.fileName"
              target="_blank"
              rel="noopener"
              title="Download"
              @click.stop
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </a>
          </div>
        </template>
      </div>

      <!-- ── Text content ───────────────────────────────────────────────── -->
      <span v-if="!hideContent" class="bubble__text">{{ message.content }}</span>

      <!-- ── Meta ──────────────────────────────────────────────────────── -->
      <div class="bubble__meta">
        <span v-if="isEdited" class="bubble__edited">edited</span>
        <span class="bubble__time">{{ timeLabel }}</span>
        <span v-if="isOwn && message.isPending" class="bubble__status" title="Sending…">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" stroke-dasharray="4 2"/></svg>
        </span>
        <span v-else-if="isOwn && !message.isPending" class="bubble__status" title="Sent">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
        </span>
      </div>

      <!-- ── Action buttons ─────────────────────────────────────────────── -->
      <div v-if="isOwn && !message.isPending" class="bubble__actions">
        <button v-if="!attachment" class="bubble__action-btn" title="Edit" @click.stop="handleEdit">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button class="bubble__action-btn bubble__action-btn--danger" title="Delete" @click.stop="handleDelete">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bubble-wrapper {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  max-width: 70%;
}

.bubble-wrapper--own {
  align-items: flex-end;
  align-self: flex-end;
}

.bubble__sender {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  padding-left: var(--space-xs);
}

.bubble {
  position: relative;
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-bubble);
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
  font-size: var(--font-size-md);
  line-height: 1.5;
  word-break: break-word;
  max-width: 100%;
}

.bubble--own {
  background: var(--color-accent);
  border-bottom-right-radius: var(--radius-sm);
}

.bubble:not(.bubble--own) {
  border-bottom-left-radius: var(--radius-sm);
}

.bubble--pending {
  opacity: 0.7;
}

.bubble--failed {
  border: 1px solid var(--color-danger);
}

.bubble__text {
  display: block;
  white-space: pre-wrap;
}

/* ── Attachment styles ─────────────────────────────────────────────────────── */

.bubble__attachment {
  margin-bottom: 4px;
}

/* Image */
.bubble__image {
  display: block;
  max-width: 280px;
  max-height: 300px;
  width: auto;
  height: auto;
  border-radius: var(--radius-sm);
  object-fit: cover;
  cursor: pointer;
  transition: opacity var(--transition-fast);
}

.bubble__image:hover {
  opacity: 0.9;
}

/* File card */
.bubble__file {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  background: rgba(0, 0, 0, 0.12);
  border-radius: var(--radius-sm);
  padding: var(--space-xs) var(--space-sm);
  min-width: 200px;
}

.bubble--own .bubble__file {
  background: rgba(0, 0, 0, 0.15);
}

.bubble__file-icon {
  flex-shrink: 0;
  opacity: 0.8;
}

.bubble__file-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.bubble__file-name {
  font-size: var(--font-size-sm);
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bubble__file-size {
  font-size: var(--font-size-xs);
  opacity: 0.65;
}

.bubble__file-download {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  opacity: 0.7;
  transition: opacity var(--transition-fast), background-color var(--transition-fast);
}

.bubble__file-download:hover {
  opacity: 1;
  background: rgba(255, 255, 255, 0.15);
}

/* ── Meta & status ─────────────────────────────────────────────────────────── */

.bubble__meta {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-xs);
  margin-top: 4px;
}

.bubble__time {
  font-size: var(--font-size-xs);
  color: rgba(255,255,255,0.5);
}

.bubble--own .bubble__time {
  color: rgba(255,255,255,0.6);
}

.bubble:not(.bubble--own) .bubble__time {
  color: var(--color-text-muted);
}

.bubble__edited {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  font-style: italic;
}

.bubble__status {
  display: inline-flex;
  color: rgba(255,255,255,0.7);
}

/* ── Action buttons ────────────────────────────────────────────────────────── */

.bubble__actions {
  display: none;
  position: absolute;
  top: -28px;
  right: 0;
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  z-index: 10;
}

.bubble:hover .bubble__actions {
  display: flex;
}

.bubble__action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  color: var(--color-text-secondary);
  transition: background-color var(--transition-fast), color var(--transition-fast);
}

.bubble__action-btn:hover {
  background: var(--color-bg-hover);
  color: var(--color-text-primary);
}

.bubble__action-btn--danger:hover {
  background: var(--color-danger);
  color: #fff;
}
</style>
