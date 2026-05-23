import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as authApi from '@/api/auth.api'
import * as usersApi from '@/api/users.api'

const TOKEN_KEY = 'pings_token'
const USER_ID_KEY = 'pings_user_id'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem(TOKEN_KEY) ?? null)
  const userId = ref(localStorage.getItem(USER_ID_KEY) ? Number(localStorage.getItem(USER_ID_KEY)) : null)
  const currentUser = ref(null)
  const isLoading = ref(false)

  const isAuthenticated = computed(() => !!token.value)
  const displayName = computed(() => {
    if (!currentUser.value) return ''
    const { firstName, lastName } = currentUser.value
    return lastName ? `${firstName} ${lastName}` : firstName
  })

  function _persist(tkn, uid) {
    token.value = tkn
    userId.value = uid
    localStorage.setItem(TOKEN_KEY, tkn)
    localStorage.setItem(USER_ID_KEY, String(uid))
  }

  function _clear() {
    token.value = null
    userId.value = null
    currentUser.value = null
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_ID_KEY)
  }

  async function login(email, password) {
    isLoading.value = true
    try {
      const res = await authApi.login({ email, password })
      const { token: tkn, userID } = res.data.data ?? res.data
      _persist(tkn, Number(userID))
      await fetchCurrentUser()
      // Start SignalR (lazy import to avoid circular)
      const { useSignalR } = await import('@/composables/useSignalR')
      await useSignalR().connect()
    } finally {
      isLoading.value = false
    }
  }

  async function register(payload) {
    isLoading.value = true
    try {
      await authApi.register(payload)
    } finally {
      isLoading.value = false
    }
  }

  async function logout() {
    const { useSignalR } = await import('@/composables/useSignalR')
    await useSignalR().disconnect()
    _clear()
    // Reset other stores
    const { useChatsStore } = await import('@/stores/chats.store')
    const { useMessagesStore } = await import('@/stores/messages.store')
    useChatsStore().$reset()
    useMessagesStore().$reset()
  }

  async function fetchCurrentUser() {
    try {
      const res = await usersApi.getMe()
      currentUser.value = res.data
    } catch {
      // ignore, non-critical
    }
  }

  async function updateProfile(payload) {
    isLoading.value = true
    try {
      const res = await usersApi.updateMe(payload)
      const updated = res.data?.data ?? res.data
      if (currentUser.value) {
        currentUser.value = { ...currentUser.value, ...updated }
      }
    } finally {
      isLoading.value = false
    }
  }

  async function changePassword(payload) {
    isLoading.value = true
    try {
      await usersApi.changePassword(payload)
    } finally {
      isLoading.value = false
    }
  }

  /** Restore session from localStorage on app mount. */
  async function initFromStorage() {
    if (!token.value) return
    await fetchCurrentUser()
    const { useSignalR } = await import('@/composables/useSignalR')
    await useSignalR().connect()
  }

  return {
    token,
    userId,
    currentUser,
    isLoading,
    isAuthenticated,
    displayName,
    login,
    register,
    logout,
    fetchCurrentUser,
    updateProfile,
    changePassword,
    initFromStorage,
  }
})
