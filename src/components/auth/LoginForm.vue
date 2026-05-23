<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useUiStore } from '@/stores/ui.store'
import { useChatsStore } from '@/stores/chats.store'
import AppSpinner from '@/components/shared/AppSpinner.vue'

const router = useRouter()
const auth = useAuthStore()
const ui = useUiStore()
const chatsStore = useChatsStore()

const email = ref('')
const password = ref('')
const error = ref('')

async function handleSubmit() {
  error.value = ''
  if (!email.value || !password.value) {
    error.value = 'Please fill in all fields'
    return
  }
  try {
    await auth.login(email.value, password.value)
    await chatsStore.fetchChats()
    router.push('/')
  } catch (e) {
    const msg = e.response?.data?.message ?? e.response?.data?.Message
    error.value = msg || 'Invalid email or password'
  }
}
</script>

<template>
  <form class="login-form" @submit.prevent="handleSubmit">
    <div class="form-group">
      <label class="form-label" for="login-email">Email</label>
      <input
        id="login-email"
        v-model="email"
        class="form-input"
        type="email"
        placeholder="you@example.com"
        autocomplete="email"
        required
      />
    </div>

    <div class="form-group">
      <label class="form-label" for="login-password">Password</label>
      <input
        id="login-password"
        v-model="password"
        class="form-input"
        type="password"
        placeholder="••••••••"
        autocomplete="current-password"
        required
      />
    </div>

    <p v-if="error" class="form-error">{{ error }}</p>

    <button class="btn btn-primary btn-full" type="submit" :disabled="auth.isLoading">
      <AppSpinner v-if="auth.isLoading" size="sm" />
      <span v-else>Sign in</span>
    </button>
  </form>
</template>

<style scoped>
.login-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}
</style>
