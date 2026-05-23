<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useMessagesStore } from '@/stores/messages.store'
import { uploadFile } from '@/api/chats.api'
import AppSpinner from '@/components/shared/AppSpinner.vue'

const props = defineProps({
  chatId: { type: Number, required: true },
})

const messagesStore = useMessagesStore()

const text = ref('')
const textarea = ref(null)
const isSending = ref(false)

// ── File attachment state ─────────────────────────────────────────────────────
const fileInput = ref(null)
const pendingFile = ref(null)      // raw File object
const uploadedAttachment = ref(null) // { fileId, fileName, fileSize, contentType }
const uploadProgress = ref(0)
const isUploading = ref(false)
const uploadError = ref('')

const editingMessage = computed(() => messagesStore.editingMessage)
const isEditing = computed(() => !!editingMessage.value)

const canSend = computed(() =>
  (text.value.trim() || uploadedAttachment.value) && !isSending.value && !isUploading.value
)

// When edit mode starts — pre-fill textarea
watch(editingMessage, async (msg) => {
  if (msg) {
    text.value = msg.content
    await nextTick()
    textarea.value?.focus()
    autoResize()
  } else {
    text.value = ''
  }
})

// ── File handling ─────────────────────────────────────────────────────────────

function openFilePicker() {
  fileInput.value?.click()
}

async function onFileSelected(event) {
  const file = event.target.files?.[0]
  if (!file) return

  const MAX = 50 * 1024 * 1024
  if (file.size > MAX) {
    uploadError.value = 'File is too large (max 50 MB)'
    event.target.value = ''
    return
  }

  pendingFile.value = file
  uploadError.value = ''
  uploadProgress.value = 0
  isUploading.value = true
  uploadedAttachment.value = null

  try {
    const res = await uploadFile(props.chatId, file, (pct) => {
      uploadProgress.value = pct
    })
    uploadedAttachment.value = {
      fileId: res.data.fileId,
      fileName: res.data.fileName,
      fileSize: res.data.fileSize,
      contentType: res.data.contentType,
    }
  } catch (e) {
    uploadError.value = e?.response?.data?.message ?? 'Upload failed'
    pendingFile.value = null
  } finally {
    isUploading.value = false
    // Reset file input so the same file can be re-selected if needed
    event.target.value = ''
  }
}

function removeAttachment() {
  pendingFile.value = null
  uploadedAttachment.value = null
  uploadProgress.value = 0
  uploadError.value = ''
}

// ── Send ──────────────────────────────────────────────────────────────────────

async function handleSend() {
  if (!canSend.value) return

  isSending.value = true
  try {
    if (isEditing.value) {
      const content = text.value.trim()
      if (!content) return
      await messagesStore.editMessage(
        editingMessage.value.chatId,
        editingMessage.value.correlationId,
        content
      )
      messagesStore.cancelEditing()
    } else {
      // Build content: if file-only use "📎 fileName" as preview text
      const content = text.value.trim() ||
        (uploadedAttachment.value ? `📎 ${uploadedAttachment.value.fileName}` : '')

      await messagesStore.sendMessage(props.chatId, content, uploadedAttachment.value)
      removeAttachment()
    }
    text.value = ''
    autoResize()
  } finally {
    isSending.value = false
  }
}

function handleKeydown(event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    handleSend()
  }
  if (event.key === 'Escape' && isEditing.value) {
    messagesStore.cancelEditing()
    text.value = ''
  }
}

function autoResize() {
  const el = textarea.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 120) + 'px'
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

const isImageAttachment = computed(() =>
  uploadedAttachment.value?.contentType?.startsWith('image/') ?? false
)
</script>

<template>
  <div class="message-input-wrap">
    <!-- Edit mode banner -->
    <Transition name="slide-up">
      <div v-if="isEditing" class="message-input__edit-banner">
        <div class="message-input__edit-info">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          <span>Editing message</span>
        </div>
        <button class="icon-btn" title="Cancel edit" @click="messagesStore.cancelEditing(); text = ''">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    </Transition>

    <!-- File attachment preview -->
    <Transition name="slide-up">
      <div v-if="pendingFile || uploadError" class="message-input__attachment">
        <!-- Upload progress -->
        <div v-if="isUploading" class="attachment-preview attachment-preview--loading">
          <AppSpinner size="sm" />
          <span class="attachment-preview__name">{{ pendingFile?.name }}</span>
          <span class="attachment-preview__progress">{{ uploadProgress }}%</span>
          <div class="attachment-preview__bar">
            <div class="attachment-preview__bar-fill" :style="{ width: uploadProgress + '%' }" />
          </div>
        </div>

        <!-- Upload error -->
        <div v-else-if="uploadError" class="attachment-preview attachment-preview--error">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span class="attachment-preview__name">{{ uploadError }}</span>
          <button class="attachment-preview__remove" @click="removeAttachment">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <!-- Ready attachment -->
        <div v-else-if="uploadedAttachment" class="attachment-preview attachment-preview--ready">
          <!-- Image thumbnail -->
          <template v-if="isImageAttachment">
            <img
              class="attachment-preview__thumb"
              :src="URL.createObjectURL(pendingFile)"
              :alt="uploadedAttachment.fileName"
            />
          </template>
          <!-- File icon -->
          <template v-else>
            <svg class="attachment-preview__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          </template>
          <div class="attachment-preview__info">
            <span class="attachment-preview__name">{{ uploadedAttachment.fileName }}</span>
            <span class="attachment-preview__size">{{ formatBytes(uploadedAttachment.fileSize) }}</span>
          </div>
          <button class="attachment-preview__remove" title="Remove attachment" @click="removeAttachment">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>
    </Transition>

    <!-- Input row -->
    <div class="message-input">
      <!-- Hidden file input -->
      <input
        ref="fileInput"
        type="file"
        accept="*/*"
        style="display: none"
        @change="onFileSelected"
      />

      <!-- Attach file button (hidden while editing) -->
      <button
        v-if="!isEditing"
        class="message-input__attach"
        :disabled="isUploading || !!uploadedAttachment"
        title="Attach file"
        @click="openFilePicker"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
        </svg>
      </button>

      <textarea
        ref="textarea"
        v-model="text"
        class="message-input__field"
        placeholder="Write a message…"
        rows="1"
        @keydown="handleKeydown"
        @input="autoResize"
      />

      <button
        class="message-input__send"
        :disabled="!canSend"
        :class="{ 'message-input__send--active': canSend }"
        @click="handleSend"
      >
        <AppSpinner v-if="isSending" size="sm" />
        <svg v-else-if="isEditing" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
        <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.message-input-wrap {
  border-top: 1px solid var(--color-border);
  background: var(--color-bg-secondary);
  flex-shrink: 0;
}

/* ── Edit banner ──────────────────────────────────────────────────────────── */
.message-input__edit-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-xs) var(--space-lg);
  background: var(--color-bg-tertiary);
  border-bottom: 1px solid var(--color-border);
  font-size: var(--font-size-sm);
  color: var(--color-accent-light);
}

.message-input__edit-info {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

/* ── Attachment preview ───────────────────────────────────────────────────── */
.message-input__attachment {
  padding: var(--space-xs) var(--space-md);
  border-bottom: 1px solid var(--color-border);
}

.attachment-preview {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  background: var(--color-bg-tertiary);
  border-radius: var(--radius-md);
  padding: var(--space-xs) var(--space-sm);
  font-size: var(--font-size-sm);
  position: relative;
  overflow: hidden;
}

.attachment-preview--loading {
  color: var(--color-text-muted);
  flex-wrap: wrap;
}

.attachment-preview--error {
  color: var(--color-danger);
  border: 1px solid var(--color-danger);
}

.attachment-preview--ready {
  border: 1px solid var(--color-border);
}

.attachment-preview__thumb {
  width: 40px;
  height: 40px;
  object-fit: cover;
  border-radius: var(--radius-sm);
  flex-shrink: 0;
}

.attachment-preview__icon {
  flex-shrink: 0;
  color: var(--color-text-muted);
}

.attachment-preview__info {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.attachment-preview__name {
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--color-text-primary);
}

.attachment-preview__size {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.attachment-preview__progress {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  margin-left: auto;
}

.attachment-preview__bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--color-bg-hover);
}

.attachment-preview__bar-fill {
  height: 100%;
  background: var(--color-accent);
  transition: width 0.2s ease;
}

.attachment-preview__remove {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
  transition: background-color var(--transition-fast), color var(--transition-fast);
  margin-left: auto;
}

.attachment-preview__remove:hover {
  background: var(--color-bg-hover);
  color: var(--color-text-primary);
}

/* ── Input row ────────────────────────────────────────────────────────────── */
.message-input {
  display: flex;
  align-items: flex-end;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
}

.message-input__attach {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--color-text-muted);
  transition: background-color var(--transition-fast), color var(--transition-fast);
}

.message-input__attach:hover:not(:disabled) {
  background: var(--color-bg-hover);
  color: var(--color-text-primary);
}

.message-input__attach:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.message-input__field {
  flex: 1;
  resize: none;
  background: var(--color-bg-input);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--space-sm) var(--space-md);
  font-size: var(--font-size-md);
  color: var(--color-text-primary);
  line-height: 1.5;
  max-height: 120px;
  overflow-y: auto;
  transition: border-color var(--transition-fast);
}

.message-input__field:focus {
  border-color: var(--color-accent-light);
  outline: none;
}

.message-input__send {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--color-bg-hover);
  color: var(--color-text-muted);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background-color var(--transition-fast), color var(--transition-fast);
}

.message-input__send--active {
  background: var(--color-accent);
  color: #fff;
}

.message-input__send--active:hover:not(:disabled) {
  background: var(--color-accent-hover);
}

.slide-up-enter-active,
.slide-up-leave-active { transition: opacity var(--transition-fast), transform var(--transition-fast); }
.slide-up-enter-from,
.slide-up-leave-to { opacity: 0; transform: translateY(-6px); }
</style>
