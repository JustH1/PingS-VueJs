<script setup>
import { computed } from 'vue'
import { useChatsStore } from '@/stores/chats.store'
import ChatHeader from './ChatHeader.vue'
import MessageList from './MessageList.vue'
import MessageInput from './MessageInput.vue'

const chatsStore = useChatsStore()
const chatId = computed(() => chatsStore.activeChatId)
</script>

<template>
  <div class="chat-panel">
    <ChatHeader />
    <MessageList :chat-id="chatId" />
    <MessageInput :chat-id="chatId" />
  </div>
</template>

<style scoped>
.chat-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}
</style>
