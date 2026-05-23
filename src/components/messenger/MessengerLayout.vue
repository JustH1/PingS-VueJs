<script setup>
import { computed } from 'vue'
import { useUiStore } from '@/stores/ui.store'
import { useChatsStore } from '@/stores/chats.store'
import { usePrivacyStore } from '@/stores/privacy.store'
import ChatSidebar from './sidebar/ChatSidebar.vue'
import ChatPanel from './chat/ChatPanel.vue'
import EmptyChatState from './chat/EmptyChatState.vue'
import PrivacyBotPanel from './privacy/PrivacyBotPanel.vue'

const ui = useUiStore()
const chatsStore = useChatsStore()
const privacyStore = usePrivacyStore()

const hasActiveChat = computed(() => chatsStore.activeChatId != null)
</script>

<template>
  <div class="messenger-layout">
    <!-- Mobile overlay -->
    <Transition name="fade">
      <div
        v-if="ui.isMobileSidebarOpen"
        class="messenger-layout__overlay"
        @click="ui.closeMobileSidebar"
      />
    </Transition>

    <!-- Sidebar -->
    <div
      class="messenger-layout__sidebar"
      :class="{ 'messenger-layout__sidebar--open': ui.isMobileSidebarOpen }"
    >
      <ChatSidebar />
    </div>

    <!-- Main area -->
    <div class="messenger-layout__main">
      <Transition name="chat-switch" mode="out-in">
        <PrivacyBotPanel v-if="privacyStore.isBotOpen"   key="privacy-bot" />
        <ChatPanel       v-else-if="hasActiveChat"        :key="chatsStore.activeChatId" />
        <EmptyChatState  v-else                           key="empty" />
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.messenger-layout {
  display: flex;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.messenger-layout__sidebar {
  flex-shrink: 0;
}

.messenger-layout__main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: var(--color-bg-primary);
}

/* Mobile overlay */
.messenger-layout__overlay {
  position: fixed;
  inset: 0;
  background: var(--color-bg-overlay);
  z-index: 99;
}

/* Mobile: sidebar slides in from left */
@media (max-width: 768px) {
  .messenger-layout__sidebar {
    position: fixed;
    top: 0;
    left: 0;
    height: 100%;
    z-index: 100;
    transform: translateX(-100%);
    transition: transform var(--transition-normal);
    width: 100%;
    max-width: 320px;
  }

  .messenger-layout__sidebar--open {
    transform: translateX(0);
  }
}

/* Transitions from variables */
.fade-enter-active,
.fade-leave-active { transition: opacity var(--transition-normal); }
.fade-enter-from,
.fade-leave-to { opacity: 0; }

.chat-switch-enter-active,
.chat-switch-leave-active { transition: opacity var(--transition-fast); }
.chat-switch-enter-from,
.chat-switch-leave-to { opacity: 0; }
</style>
