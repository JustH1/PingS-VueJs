import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as usersApi from '@/api/users.api'

export const useUsersStore = defineStore('users', () => {
  const searchResults = ref([])
  const isSearching = ref(false)
  const userCache = ref(new Map())

  async function searchUsers(query) {
    if (!query || query.trim().length < 1) {
      searchResults.value = []
      return
    }
    isSearching.value = true
    try {
      const res = await usersApi.searchUsers(query.trim())
      searchResults.value = res.data ?? []
    } catch {
      searchResults.value = []
    } finally {
      isSearching.value = false
    }
  }

  function clearSearch() {
    searchResults.value = []
    isSearching.value = false
  }

  async function fetchUserById(id) {
    if (userCache.value.has(id)) return userCache.value.get(id)
    try {
      const res = await usersApi.getUserById(id)
      const user = res.data?.data ?? res.data
      userCache.value.set(id, user)
      return user
    } catch {
      return null
    }
  }

  return {
    searchResults,
    isSearching,
    userCache,
    searchUsers,
    clearSearch,
    fetchUserById,
  }
})
