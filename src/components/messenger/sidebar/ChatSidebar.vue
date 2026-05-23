<script setup>
import { useChatsStore } from '@/stores/chats.store'
import { useUiStore } from '@/stores/ui.store'
import { usePrivacyStore } from '@/stores/privacy.store'
import SidebarHeader from './SidebarHeader.vue'
import ChatListItem from './ChatListItem.vue'
import AppSpinner from '@/components/shared/AppSpinner.vue'

const chatsStore = useChatsStore()
const privacyStore = usePrivacyStore()
const ui = useUiStore()

function openPrivacyBot() {
  chatsStore.setActiveChat(null)   // deselect any regular chat
  privacyStore.openBot()
  ui.closeMobileSidebar()
}

function selectChat(chatId) {
  privacyStore.closeBot()          // close bot when opening regular chat
  chatsStore.setActiveChat(chatId)
  ui.closeMobileSidebar()
}
</script>

<template>
  <aside class="sidebar">
    <SidebarHeader />

    <!-- ── Privacy Mirror Bot (pinned at top) ─────────────── -->
    <div class="sidebar__pinned">
      <div
        class="bot-item"
        :class="{ 'bot-item--active': privacyStore.isBotOpen }"
        @click="openPrivacyBot"
      >
        <div class="bot-item__avatar">🔍</div>
        <div class="bot-item__info">
          <span class="bot-item__name">Privacy Mirror</span>
          <span class="bot-item__sub">Анализ приватности</span>
        </div>
        <span class="bot-item__badge">BOT</span>
      </div>
    </div>

    <div class="sidebar__divider" />

    <!-- ── Regular chats ──────────────────────────────────── -->
    <div v-if="chatsStore.isLoading && chatsStore.sortedChats.length === 0" class="sidebar__loading">
      <AppSpinner size="md" />
    </div>

    <div v-else-if="chatsStore.sortedChats.length === 0" class="sidebar__empty">
      <p>No conversations yet</p>
      <button class="btn btn-primary" @click="ui.openModal('newChat')">Start new chat</button>
    </div>

    <div v-else class="sidebar__list">
      <ChatListItem
        v-for="chat in chatsStore.sortedChats"
        :key="chat.chatId"
        :chat="chat"
        :active="!privacyStore.isBotOpen && chat.chatId === chatsStore.activeChatId"
        @click="selectChat(chat.chatId)"
      />
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  display: flex;
  flex-direction: column;
  width: var(--sidebar-width);
  height: 100%;
  background: var(--color-bg-secondary);
  border-right: 1px solid var(--color-border);
  overflow: hidden;
  flex-shrink: 0;
}

/* ── Bot entry ──────────────────────────────────────────────────────────── */
.sidebar__pinned {
  padding: var(--space-xs);
  flex-shrink: 0;
}

.bot-item {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  cursor: pointer;
  user-select: none;
  transition: background-color var(--transition-fast);
}
.bot-item:hover { background: var(--color-bg-hover); }
.bot-item--active { background: var(--color-accent); }
.bot-item--active:hover { background: var(--color-accent-hover); }

.bot-item__avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--color-bg-hover);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}
.bot-item--active .bot-item__avatar { background: rgba(255,255,255,0.15); }

.bot-item__info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.bot-item__name {
  font-size: var(--font-size-md);
  font-weight: 600;
  color: var(--color-text-primary);
}
.bot-item__sub {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}
.bot-item--active .bot-item__name,
.bot-item--active .bot-item__sub { color: rgba(255,255,255,0.9); }

.bot-item__badge {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 10px;
  background: rgba(255,255,255,0.2);
  color: var(--color-text-secondary);
  flex-shrink: 0;
}
.bot-item--active .bot-item__badge {
  background: rgba(255,255,255,0.25);
  color: rgba(255,255,255,0.9);
}

/* ── Divider ────────────────────────────────────────────────────────────── */
.sidebar__divider {
  height: 1px;
  background: var(--color-border);
  margin: 0 var(--space-md);
  flex-shrink: 0;
}

/* ── Chat list ──────────────────────────────────────────────────────────── */
.sidebar__loading {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sidebar__empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-lg);
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  padding: var(--space-xl);
  text-align: center;
}

.sidebar__list {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-xs) var(--space-xs);
}
</style>
