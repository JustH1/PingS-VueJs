<script setup>
import { ref, watch } from 'vue'
import { useUsersStore } from '@/stores/users.store'
import { useChatsStore } from '@/stores/chats.store'
import { useUiStore } from '@/stores/ui.store'
import { useDebounce } from '@/composables/useDebounce'
import AppSpinner from '@/components/shared/AppSpinner.vue'

const emit = defineEmits(['close'])

const usersStore = useUsersStore()
const chatsStore = useChatsStore()
const ui = useUiStore()

const query = ref('')
const openingChatFor = ref(null)

const { debounced: debouncedSearch } = useDebounce((q) => usersStore.searchUsers(q), 350)

watch(query, (val) => {
  debouncedSearch(val)
})

function getInitials(user) {
  const first = user.firstName?.[0] ?? ''
  const last = user.lastName?.[0] ?? user.firstName?.[1] ?? ''
  return (first + last).toUpperCase()
}

async function startChat(user) {
  openingChatFor.value = user.userId
  try {
    await chatsStore.createOrOpenChat(Number(user.userId))
    emit('close')
  } catch (e) {
    ui.showToast('Failed to open chat', 'error')
  } finally {
    openingChatFor.value = null
  }
}

function handleClose() {
  usersStore.clearSearch()
  emit('close')
}
</script>

<template>
  <div class="modal-overlay" @click.self="handleClose">
    <div class="modal" role="dialog" aria-modal="true">
      <div class="modal__header">
        <h3 class="modal__title">New conversation</h3>
        <button class="icon-btn" @click="handleClose">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <input
        v-model="query"
        class="form-input modal__search"
        type="text"
        placeholder="Search by name or username…"
        autofocus
      />

      <div class="modal__results">
        <div v-if="usersStore.isSearching" class="modal__center">
          <AppSpinner size="md" />
        </div>

        <div
          v-else-if="usersStore.searchResults.length === 0 && query.trim().length > 0"
          class="modal__center modal__empty"
        >
          No users found
        </div>

        <div
          v-else-if="query.trim().length === 0"
          class="modal__center modal__hint"
        >
          Type a name to search
        </div>

        <button
          v-for="user in usersStore.searchResults"
          :key="user.userId"
          class="user-item"
          :disabled="openingChatFor === user.userId"
          @click="startChat(user)"
        >
          <div class="user-item__avatar">{{ getInitials(user) }}</div>
          <div class="user-item__info">
            <span class="user-item__name">
              {{ user.firstName }}{{ user.lastName ? ' ' + user.lastName : '' }}
            </span>
            <span v-if="user.userName" class="user-item__username">@{{ user.userName }}</span>
          </div>
          <AppSpinner v-if="openingChatFor === user.userId" size="sm" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: var(--color-bg-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: var(--space-xl);
}

.modal {
  background: var(--color-bg-modal);
  border-radius: var(--radius-xl);
  padding: var(--space-xl);
  width: 100%;
  max-width: 420px;
  max-height: 80vh;
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal__title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-text-primary);
}

.modal__search {
  width: 100%;
}

.modal__results {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  min-height: 80px;
}

.modal__center {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-xl) 0;
  flex: 1;
}

.modal__empty,
.modal__hint {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.user-item {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background-color var(--transition-fast);
  width: 100%;
  text-align: left;
}

.user-item:hover:not(:disabled) {
  background: var(--color-bg-hover);
}

.user-item:disabled {
  opacity: 0.6;
  cursor: wait;
}

.user-item__avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--color-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
}

.user-item__info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-item__name {
  font-size: var(--font-size-md);
  font-weight: 500;
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-item__username {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
</style>
