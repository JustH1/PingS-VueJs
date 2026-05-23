<script setup>
import { onMounted } from 'vue'
import { useChatsStore } from '@/stores/chats.store'
import { useUiStore } from '@/stores/ui.store'
import MessengerLayout from '@/components/messenger/MessengerLayout.vue'
import NewChatModal from '@/components/messenger/modals/NewChatModal.vue'
import UserProfileModal from '@/components/messenger/modals/UserProfileModal.vue'
import ConfirmModal from '@/components/messenger/modals/ConfirmModal.vue'

const chatsStore = useChatsStore()
const ui = useUiStore()

onMounted(async () => {
  await chatsStore.fetchChats()
})
</script>

<template>
  <div class="messenger-view">
    <MessengerLayout />

    <!-- Modals -->
    <Teleport to="body">
      <Transition name="fade">
        <NewChatModal v-if="ui.activeModal === 'newChat'" @close="ui.closeModal" />
      </Transition>
      <Transition name="fade">
        <UserProfileModal v-if="ui.activeModal === 'profile'" @close="ui.closeModal" />
      </Transition>
      <Transition name="fade">
        <ConfirmModal
          v-if="ui.activeModal === 'confirm'"
          :payload="ui.modalPayload"
          @close="ui.closeModal"
        />
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.messenger-view {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.fade-enter-active,
.fade-leave-active { transition: opacity var(--transition-normal); }
.fade-enter-from,
.fade-leave-to { opacity: 0; }
</style>
