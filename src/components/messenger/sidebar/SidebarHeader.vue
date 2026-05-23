<script setup>
import { useAuthStore } from '@/stores/auth.store'
import { useUiStore } from '@/stores/ui.store'

const auth = useAuthStore()
const ui = useUiStore()

function getInitials(user) {
  if (!user) return '?'
  return (user.firstName?.[0] ?? '') + (user.lastName?.[0] ?? user.firstName?.[1] ?? '')
}
</script>

<template>
  <div class="sidebar-header">
    <!-- Avatar / profile button -->
    <button
      class="sidebar-header__avatar"
      :title="auth.displayName"
      @click="ui.openModal('profile')"
    >
      <span class="sidebar-header__initials">{{ getInitials(auth.currentUser) }}</span>
    </button>

    <span class="sidebar-header__name truncate">
      {{ auth.currentUser?.userName ? '@' + auth.currentUser.userName : auth.displayName }}
    </span>

    <!-- New chat -->
    <button class="icon-btn sidebar-header__new" title="New chat" @click="ui.openModal('newChat')">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        <line x1="12" y1="8" x2="12" y2="16"/>
        <line x1="8" y1="12" x2="16" y2="12"/>
      </svg>
    </button>
  </div>
</template>

<style scoped>
.sidebar-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  height: var(--header-height);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.sidebar-header__avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--color-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  cursor: pointer;
  transition: background-color var(--transition-fast);
}
.sidebar-header__avatar:hover {
  background: var(--color-accent-hover);
}

.sidebar-header__initials {
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: #fff;
  text-transform: uppercase;
  user-select: none;
  pointer-events: none;
}

.sidebar-header__name {
  flex: 1;
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text-primary);
}

.sidebar-header__new {
  flex-shrink: 0;
}
</style>
