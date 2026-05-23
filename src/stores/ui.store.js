import { defineStore } from 'pinia'
import { ref } from 'vue'

let toastId = 0

export const useUiStore = defineStore('ui', () => {
  const toasts = ref([])
  const activeModal = ref(null)
  const modalPayload = ref(null)
  const isMobileSidebarOpen = ref(false)

  function showToast(message, type = 'info', duration = 3500) {
    const id = ++toastId
    toasts.value.push({ id, message, type, duration })
    setTimeout(() => dismissToast(id), duration)
  }

  function dismissToast(id) {
    const idx = toasts.value.findIndex((t) => t.id === id)
    if (idx !== -1) toasts.value.splice(idx, 1)
  }

  function openModal(name, payload = null) {
    activeModal.value = name
    modalPayload.value = payload
  }

  function closeModal() {
    activeModal.value = null
    modalPayload.value = null
  }

  function toggleMobileSidebar() {
    isMobileSidebarOpen.value = !isMobileSidebarOpen.value
  }

  function closeMobileSidebar() {
    isMobileSidebarOpen.value = false
  }

  return {
    toasts,
    activeModal,
    modalPayload,
    isMobileSidebarOpen,
    showToast,
    dismissToast,
    openModal,
    closeModal,
    toggleMobileSidebar,
    closeMobileSidebar,
  }
})
